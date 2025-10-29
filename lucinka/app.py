import datetime
from functools import wraps
from pathlib import Path

from flask import Flask, jsonify, request, send_from_directory, session
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from webargs.flaskparser import use_kwargs

from lucinka.config import Config
from lucinka.models import Breastfeeding, DataEntry, LoginRecord, Photo, User, Visit, db
from lucinka.schemas import (
    AddBreastfeedingSchema,
    AddDataEntrySchema,
    AddPhotoSchema,
    AddVisitSchema,
    GetBreastfeedingSchema,
    GetDataEntrySchema,
    GetLoginRecordSchema,
    GetPhotoSchema,
    GetUserSchema,
    GetVisitSchema,
    LoginSchema,
)


ALLOWED_EXTENSIONS = {".png", ".jpg", ".jpeg", ".gif", ".webp"}
UPLOAD_FOLDER = Path(__file__).parents[1] / "db/photos"


def utcnow():
    return datetime.datetime.now(datetime.UTC)


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
    limiter = Limiter(
        get_remote_address,
        app=app,
        storage_uri="memory://",
    )

    # Initialize extensions
    db.init_app(app)

    CORS(app)  # Allow frontend to connect

    app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER
    app.config["MAX_CONTENT_LENGTH"] = 16 * 1024 * 1024  # 16MB max file size

    @app.get("/")
    @app.get("/login")
    @app.get("/admin")
    @app.get("/admin/login-stats")
    def index():
        return send_from_directory(app.static_folder, "index.html")

    @app.get("/api/users")
    @admin_required
    def get_users():
        users = User.query.all()
        return jsonify(GetUserSchema(many=True).dump(users))

    @app.get("/api/current-user")
    @login_required
    def get_current_user():
        user_id = session["user_id"]
        if not user_id:
            return jsonify({"error": "Not logged in"}), 401
        user = User.query.get(user_id)
        if not user:
            return jsonify({"error": "User not found"}), 404
        return jsonify(GetUserSchema().dump(user))

    @app.get("/api/login-stats")
    @admin_required
    def get_login_stats():
        stats = LoginRecord.query.all()
        return jsonify(GetLoginRecordSchema(many=True).dump(stats))

    @app.post("/api/login")
    @limiter.limit("100 per hour")
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
        data = DataEntry.query.order_by(DataEntry.date).all()
        return jsonify(GetDataEntrySchema(many=True).dump(data))

    @app.post("/api/data")
    @admin_required
    @use_kwargs(AddDataEntrySchema)
    def add_data(date: str, weight: float, height: float, notes: str):
        user_id = session["user_id"]
        user = User.query.get(user_id)
        if not user:
            return jsonify({"error": "User not found"}), 404
        data_entry = DataEntry(date=date, weight=weight, height=height, notes=notes, user=user)
        db.session.add(data_entry)
        db.session.commit()
        return jsonify({}), 201

    @app.delete("/api/data/<int:entry_id>")
    @admin_required
    def delete_data_entry(entry_id: int):
        data_entry = DataEntry.query.get(entry_id)
        if not data_entry:
            return jsonify({"error": "Data entry not found"}), 404
        db.session.delete(data_entry)
        db.session.commit()
        return jsonify({}), 204

    @app.get("/api/visits")
    @login_required
    def get_visits():
        visits = Visit.query.order_by(Visit.date).all()
        return jsonify(GetVisitSchema(many=True).dump(visits))

    @app.post("/api/visits")
    @admin_required
    @use_kwargs(AddVisitSchema)
    def add_visit(date: str, doctor: str, location: str, type: str, notes: str):
        user_id = session["user_id"]
        user = User.query.get(user_id)
        if not user:
            return jsonify({"error": "User not found"}), 404
        visit = Visit(date=date, doctor=doctor, location=location, type=type, notes=notes, user=user)
        db.session.add(visit)
        db.session.commit()
        return jsonify({}), 201

    @app.delete("/api/visits/<int:visit_id>")
    @admin_required
    def delete_visit(visit_id: int):
        visit = Visit.query.get(visit_id)
        if not visit:
            return jsonify({"error": "Visit not found"}), 404
        db.session.delete(visit)
        db.session.commit()
        return jsonify({}), 204

    @app.get("/api/breastfeeding")
    @login_required
    def get_breastfeeding():
        breastfeeding = Breastfeeding.query.order_by(Breastfeeding.start_dt.desc()).all()
        return jsonify(GetBreastfeedingSchema(many=True).dump(breastfeeding))

    @app.post("/api/breastfeeding")
    @admin_required
    @use_kwargs(AddBreastfeedingSchema)
    def add_breastfeeding(start_dt: str, end_dt: str, left_duration: int = None, right_duration: int = None):
        user_id = session["user_id"]
        user = User.query.get(user_id)
        if not user:
            return jsonify({"error": "User not found"}), 404
        breastfeeding = Breastfeeding(
            start_dt=start_dt,
            end_dt=end_dt,
            left_duration=left_duration,
            right_duration=right_duration,
            user=user,
        )
        db.session.add(breastfeeding)
        db.session.commit()
        return jsonify({}), 201

    @app.delete("/api/breastfeeding/<int:breastfeeding_id>")
    @admin_required
    def delete_breastfeeding(breastfeeding_id: int):
        breastfeeding = Breastfeeding.query.get(breastfeeding_id)
        if not breastfeeding:
            return jsonify({"error": "Breastfeeding record not found"}), 404
        db.session.delete(breastfeeding)
        db.session.commit()
        return jsonify({}), 204

    # Serve images from db/images folder
    def allowed_file(filename):
        return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS

    @app.post("/api/photos")
    @admin_required
    @use_kwargs(
        AddPhotoSchema,
        location="form",
    )
    def add_photo(date: datetime.datetime, notes: str):
        user_id = session["user_id"]
        user = User.query.get(user_id)
        if not user:
            return jsonify({"error": "User not found"}), 404

        # Check if file is in request
        if "photo" not in request.files:
            return jsonify({"error": "No file part"}), 422

        file = request.files["photo"]
        ext = Path(file.filename).suffix
        if not file or ext not in ALLOWED_EXTENSIONS:
            return jsonify({"error": "Invalid file"}), 400

        photo = Photo(
            date=date,
            notes=notes,
            ext=ext,
            user=user,
        )
        db.session.add(photo)
        db.session.commit()

        # Save the file
        filepath = app.config["UPLOAD_FOLDER"] / photo.storage_filename
        try:
            file.save(filepath)
        except OSError as e:
            print(f"Error saving file: {e}")
            db.session.delete(photo)
            db.session.commit()
            return jsonify({"error": "Failed to save file"}), 500

        return jsonify({}), 201

    @app.get("/api/photos")
    @login_required
    def get_photos():
        photos = Photo.query.order_by(Photo.date.desc()).all()
        return jsonify(GetPhotoSchema(many=True).dump(photos))

    # Serve uploaded images
    @app.get("/api/photos/<filename>")
    @login_required
    def serve_photo(filename: str):
        return send_from_directory(app.config["UPLOAD_FOLDER"], filename)

    @app.delete("/api/photos/<int:photo_id>")
    @admin_required
    def delete_photo(photo_id: int):
        photo = Photo.query.get(photo_id)
        if not photo:
            return jsonify({"error": "Photo not found"}), 404
        db.session.delete(photo)
        db.session.commit()
        Path.unlink(app.config["UPLOAD_FOLDER"] / photo.storage_filename)
        return jsonify({}), 204
    return app


if __name__ == "__main__":
    app = create_app(dev=True)
    app.run(debug=True, port=5000)
