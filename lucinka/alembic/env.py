from logging.config import fileConfig

from alembic import context
from sqlalchemy import engine_from_config, pool

from lucinka.app import create_app
from lucinka.models import Base


# this is the Alembic Config object
config = context.config

# Interpret the config file for Python logging
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Get Flask app and its config
app = create_app()
with app.app_context():
    # Override sqlalchemy.url with app's database URI
    config.set_main_option("sqlalchemy.url", app.config["SQLALCHEMY_DATABASE_URI"])

# Add model's MetaData object for 'autogenerate' support
target_metadata = Base.metadata


def run_migrations() -> None:
    """Run migrations in 'online' mode."""
    connectable = engine_from_config(
        config.get_section(config.config_ini_section),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
        )

        with context.begin_transaction():
            context.run_migrations()


run_migrations()
