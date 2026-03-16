import os
from dotenv import load_dotenv

# โหลด .env อัตโนมัติเมื่อรันนอก Docker (local dev)
load_dotenv()


class BaseConfig:
    SECRET_KEY:  str  = os.getenv('SECRET_KEY', 'change-me-in-production')
    DB_HOST:     str  = os.getenv('DB_HOST', 'db')
    DB_USER:     str  = os.getenv('DB_USER', 'root')
    DB_PASSWORD: str  = os.getenv('DB_PASSWORD', '')
    DB_NAME:     str  = os.getenv('DB_NAME', 'app_db')
    TESTING:     bool = False


class DevelopmentConfig(BaseConfig):
    DEBUG: bool = True


class ProductionConfig(BaseConfig):
    DEBUG: bool = False


class TestingConfig(BaseConfig):
    TESTING: bool = True
    DEBUG:   bool = True


config_by_name: dict[str, type[BaseConfig]] = {
    'development': DevelopmentConfig,
    'production':  ProductionConfig,
    'testing':     TestingConfig,
}
