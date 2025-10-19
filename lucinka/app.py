import json
from functools import wraps
from pathlib import Path

from flask import Flask, jsonify, send_from_directory, session
from flask_cors import CORS
from webargs.flaskparser import use_kwargs

import lucinka
from lucinka.config import Config
from lucinka.models import LoginRecord, User, db
from lucinka.schemas import GetLoginRecordSchema, GetUserSchema, LoginSchema


def login_required(f):
    """Decorator to require login for certain routes."""

    @wraps(f)
    def decorated_function(*args, **kwargs):
        if "user_id" not in session:
            return jsonify({"error": "Authentication required"}), 401
        return f(*args, **kwargs)

    return decorated_function


def admin_required(f):
    """Decorator to require admin privileges."""

    @wraps(f)
    def decorated_function(*args, **kwargs):
        if "user_id" not in session:
            return jsonify({"error": "Authentication required"}), 401

        user = User.query.get(session["user_id"])
        if not user or not user.is_admin:
            return jsonify({"error": "Admin privileges required"}), 403

        return f(*args, **kwargs)

    return decorated_function


def create_app(*, dev: bool = False, testing: bool = False) -> Flask:
    """Application factory pattern."""
    # Load configuration
    config = Config(dev=dev, testing=testing)
    app = Flask(__name__, static_url_path=config.STATIC_URL_PATH, static_folder=config.STATIC_FOLDER)
    app.config.from_object(config)

    # Initialize extensions
    db.init_app(app)

    CORS(app)  # Allow frontend to connect

    @app.get("/")
    def index():
        return send_from_directory(app.static_folder, "index.html")

    @app.get("/api/users")
    @admin_required
    def get_users():
        users = User.query.all()
        return jsonify(GetUserSchema(many=True).dump(users))

    @app.get("/api/login-stats")
    @admin_required
    def get_login_stats():
        stats = LoginRecord.query.all()
        return jsonify(GetLoginRecordSchema(many=True).dump(stats))

    @app.post("/api/login")
    @use_kwargs(LoginSchema)
    def login(username: str, password: str):
        user = User.query.filter_by(username=username).first()
        if not user or not user.verify_password(password):
            return jsonify({"message": "Invalid credentials"}), 401

        session["user_id"] = user.id
        session.permanent = True
        record = LoginRecord(user=user)
        db.session.add(record)
        db.session.commit()
        return jsonify({})

    @app.post("/api/logout")
    @login_required
    def logout():
        session.pop("user_id", None)
        return jsonify({})

    @app.get("/api/data")
    @login_required
    def get_data():
        data = Path(__file__).parent / "weight.json"
        with Path.open(data) as f:
            weights = json.load(f)
        return jsonify(weights)

    return app


if __name__ == "__main__":
    app = create_app(dev=True)
    app.run(debug=True, port=5000)
