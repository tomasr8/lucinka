from werkzeug.security import generate_password_hash

from lucinka.models import User, db


def create_user(username: str, password: str, *, is_admin: bool = False) -> User:
    """Create a new user."""
    password_hash = generate_password_hash(password)
    user = User(username=username, password_hash=password_hash, is_admin=is_admin)
    db.session.add(user)
    db.session.commit()
    return user
