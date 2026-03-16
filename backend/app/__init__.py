import os
from flask import Flask
from .config import config_by_name


def create_app(env: str | None = None) -> Flask:
    """Application factory."""
    app = Flask(__name__)

    env = env or os.getenv('FLASK_ENV', 'production')
    app.config.from_object(config_by_name.get(env, config_by_name['production']))

    from .routes import register_blueprints
    register_blueprints(app)

    return app
