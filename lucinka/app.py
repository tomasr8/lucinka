import os

from flask import Flask, jsonify, request
from flask_cors import CORS

from lucinka.config import config
from lucinka.models import db


def create_app(config_name=None):
    """Application factory pattern."""
    app = Flask(__name__)

    # Load configuration
    config_name = config_name or os.environ.get("FLASK_ENV", "development")
    app.config.from_object(config[config_name])

    # Initialize extensions
    db.init_app(app)

    # Create tables if they don't exist
    with app.app_context():
        db.create_all()

    CORS(app)  # Allow frontend to connect
    return app


app = create_app()


# Simple in-memory data storage
tasks = []
task_id_counter = 1


@app.route("/api/weight", methods=["GET"])
def get_weights():
    return jsonify({"weights": tasks})


# Login route
@app.route("/api/login", methods=["POST"])
def login():
    data = request.json
    username = data.get("username")
    password = data.get("password")

    # Here you would typically validate the username and password
    if username == "user" and password == "pass":
        return jsonify({"message": "Login successful!"})
    return jsonify({"message": "Invalid credentials!"}), 401


if __name__ == "__main__":
    app.run(debug=True, port=5000)
