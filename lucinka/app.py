import json
import os
from functools import wraps
from pathlib import Path

from flask import Flask, jsonify, session
from flask_cors import CORS
from webargs.flaskparser import use_kwargs

from lucinka.config import config
from lucinka.models import LoginRecord, User, db
from lucinka.schemas import GetLoginRecordSchema, GetUserSchema, LoginSchema


def create_app(config_name=None) -> Flask:
    """Application factory pattern."""
    app = Flask(__name__)

    # Load configuration
    config_name = config_name or os.environ.get("FLASK_ENV", "development")
    app.config.from_object(config[config_name])

    # Initialize extensions
    db.init_app(app)

    CORS(app)  # Allow frontend to connect
    return app


app = create_app()


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


@app.get("/api/weight")
@login_required
def get_weights():
    data = Path(__file__).parent / "weight.json"
    with Path.open(data) as f:
        weights = json.load(f)
    return jsonify(weights)


if __name__ == "__main__":
    app.run(debug=True, port=5000)
