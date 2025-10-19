import click

from lucinka.app import create_app
from lucinka.models import User, db
from lucinka.users import create_user as _create_user


app = create_app()


@click.group()
def cli() -> None:
    pass


@cli.command("run")
@click.option("--port", default=5000, help="Port to run the server on.")
def run(port: int) -> None:
    """Run the development server."""
    app = create_app(dev=False)
    app.run(debug=False, host="0.0.0.0", port=port)


@cli.command("debug")
@click.option("--port", default=5000, help="Port to run the server on.")
def debug(port: int) -> None:
    """Run the development server."""
    app = create_app(dev=True)
    app.run(debug=True, port=port)


@cli.group()
def user() -> None:
    """User management commands."""


@cli.group()
def admin() -> None:
    """Admin management commands."""


@user.command("list")
def list_users() -> None:
    """List all users."""
    with app.app_context():
        users = User.query.all()
        for user in users:
            if user.is_admin:
                click.secho(f"{user.username} (admin)", fg="red")
            else:
                click.secho(f"{user.username}", fg="blue")


@admin.command("list")
def list_admins() -> None:
    """List all admin users."""
    with app.app_context():
        admins = User.query.filter_by(is_admin=True)
        for admin in admins:
            click.secho(f"{admin.username}", fg="blue")


@admin.command("create")
@click.argument("username")
@click.argument("password")
def create_admin(username: str, password: str) -> None:
    """Create an admin user."""
    with app.app_context():
        _create_user(username, password, is_admin=True)
        click.secho(f"Admin user {username} created.", fg="green")


@user.command("create")
@click.argument("username")
@click.argument("password")
def create_user(username: str, password: str) -> None:
    """Create a user."""
    with app.app_context():
        _create_user(username, password, is_admin=False)
        click.secho(f"User {username} created.", fg="green")


@user.command("delete")
@click.argument("username")
def delete_user(username: str) -> None:
    """Delete a user."""
    with app.app_context():
        user = User.query.filter_by(username=username).first()
        if user:
            db.session.delete(user)
            db.session.commit()
            click.secho(f"User {username} deleted.", fg="green")
        else:
            click.secho(f"User {username} not found.", fg="red")


if __name__ == "__main__":
    cli()
