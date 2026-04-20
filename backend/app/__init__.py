import os
from flask import Flask
from flask_cors import CORS
from .config import config_by_name
from dotenv import load_dotenv
from .extensions import mail

def create_app(env: str | None = None) -> Flask:
    """Application factory."""
    app = Flask(__name__)

    env = env or os.getenv('FLASK_ENV', 'production')
    app.config.from_object(config_by_name.get(env, config_by_name['production']))
    app.config['MAIL_SERVER'] = 'smtp.gmail.com'
    app.config['MAIL_PORT'] = 587
    app.config['MAIL_USE_TLS'] = True
    app.config['MAIL_USERNAME'] = os.getenv('MAIL_USERNAME')
    app.config['MAIL_PASSWORD'] = os.getenv('MAIL_PASSWORD')
    app.config['MAIL_DEFAULT_SENDER'] = ('Forest Ranger Admin', os.getenv('MAIL_USERNAME'))
    CORS(
        app,
        resources={r"/api/*": {"origins": app.config.get('CORS_ALLOWED_ORIGINS', [])}},
        supports_credentials=app.config.get('CORS_SUPPORTS_CREDENTIALS', True),
    )
    mail.init_app(app)
    from .routes import register_blueprints
    register_blueprints(app)

    return app