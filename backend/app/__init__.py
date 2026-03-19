import os
from flask import Flask
from flask_cors import CORS  # <--- 1. นำเข้า CORS ตรงนี้
from .config import config_by_name

def create_app(env: str | None = None) -> Flask:
    """Application factory."""
    app = Flask(__name__)
    
    # 2. เปิดใช้งาน CORS ทันทีหลังจากสร้าง app
    CORS(app) 

    env = env or os.getenv('FLASK_ENV', 'production')
    app.config.from_object(config_by_name.get(env, config_by_name['production']))

    from .routes import register_blueprints
    register_blueprints(app)

    return app