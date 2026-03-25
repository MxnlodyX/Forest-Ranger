import os
from flask import Flask
from flask_cors import CORS
from .config import config_by_name

def create_app(env: str | None = None) -> Flask:
    """Application factory."""
    app = Flask(__name__)

    env = env or os.getenv('FLASK_ENV', 'production')
    app.config.from_object(config_by_name.get(env, config_by_name['production']))

    CORS(
        app,
        resources={r"/api/*": {"origins": app.config.get('CORS_ALLOWED_ORIGINS', [])}},
        supports_credentials=app.config.get('CORS_SUPPORTS_CREDENTIALS', True),
    )

    from .routes import register_blueprints
    register_blueprints(app)

    return app