import os
from datetime import timedelta
from pathlib import Path

import lucinka


basedir = Path(lucinka.__file__).parents[1]
dev_db_path = f"sqlite:///{basedir / 'db' / 'app.db'}"


class Config:
    """App config"""

    def __init__(self, *, dev: bool = False, testing: bool = False) -> None:
        self.DEBUG = dev
        self.SECRET_KEY = "dev-secret-key" if dev else os.environ.get("SECRET_KEY")
        if not dev:
            assert self.SECRET_KEY and len(self.SECRET_KEY) >= 16, (
                "SECRET_KEY must be set and at least 16 characters long."
            )
        if not dev:
            db_uri = os.environ.get("SQLALCHEMY_DATABASE_URI")
            assert db_uri, "SQLALCHEMY_DATABASE_URI must be set in production."
        self.SQLALCHEMY_DATABASE_URI = os.environ.get("SQLALCHEMY_DATABASE_URI") or dev_db_path
        self.STATIC_URL_PATH = ""

        if dev:
            self.STATIC_FOLDER = Path(lucinka.__file__).parents[1] / "static"
        else:
            static_folder = os.environ.get("STATIC_FOLDER")
            assert static_folder, "STATIC_FOLDER must be set in production."
            self.STATIC_FOLDER = static_folder

        if not dev:
            self.PERMANENT_SESSION_LIFETIME = timedelta(hours=8)

        if testing:
            self.TESTING = True
            self.SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"
            self.WTF_CSRF_ENABLED = False
