from datetime import datetime

import click

from lucinka.app import create_app
from lucinka.models import Breastfeeding, DataEntry, User, Visit, db
from lucinka.users import create_user as _create_user


app = create_app(dev=True)


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


@cli.group()
def data() -> None:
    """Data management commands."""


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


@data.command("list")
def list_data() -> None:
    """List all data entries."""
    with app.app_context():
        for entry in DataEntry.query.order_by(DataEntry.date).all():
            click.secho(f"{entry.id} | {entry.date} | {entry.weight}kg | {entry.height}cm | {entry.notes}", fg="blue")
        for visit in Visit.query.order_by(Visit.date).all():
            click.secho(f"{visit.id} | {visit.date} | {visit.doctor} | {visit.location} | Type: {visit.type} | Notes: {visit.notes}", fg="green")
        for breastfeeding in Breastfeeding.query.order_by(Breastfeeding.date).all():
            click.secho(f"{breastfeeding.id} | {breastfeeding.date} | Breast: {breastfeeding.breast} | Left Duration: {breastfeeding.left_duration}min | Right Duration: {breastfeeding.right_duration}min", fg="magenta")

@data.command("delete")
@click.argument("data_id", type=int)
def delete_data(data_id: int) -> None:
    """Delete a data entry by ID."""
    with app.app_context():
        entry = DataEntry.query.get(data_id)
        if entry:
            db.session.delete(entry)
            db.session.commit()
            click.secho(f"Data entry {data_id} deleted.", fg="green")
        else:
            click.secho(f"Data entry {data_id} not found.", fg="red")


@data.command("add")
@click.argument("date")
@click.option("--user", type=str, required=True, help="Username of the user.")
@click.option("--weight", type=float, required=False, help="Weight in kg.")
@click.option("--height", type=float, required=False, help="Height in cm.")
@click.option("--notes", type=str, required=False, help="Additional notes.")
def add_data(date: str, user: str, weight: float, height: float, notes: str) -> None:
    """Add a new data entry."""
    with app.app_context():
        dt = datetime.fromisoformat(date)
        user = User.query.filter_by(username=user).first()
        if not user:
            click.secho(f"User {user} not found.", fg="red")
            return
        entry = DataEntry(date=dt, user=user, weight=weight, height=height, notes=notes)
        db.session.add(entry)
        db.session.commit()
        click.secho(f"Data entry added: {entry.date} | {entry.weight}kg | {entry.height}cm | {entry.notes}", fg="green")


if __name__ == "__main__":
    cli()
