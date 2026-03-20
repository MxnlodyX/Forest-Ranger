import os
from dotenv import load_dotenv

# โหลด .env อัตโนมัติเมื่อรันนอก Docker (local dev)
load_dotenv()


def _env_flag(name: str, default: bool = False) -> bool:
    value = os.getenv(name)
    if value is None:
        return default
    return value.strip().lower() in {'1', 'true', 'yes', 'on'}


def _env_list(name: str, default: str = '') -> list[str]:
    raw = os.getenv(name, default)
    return [item.strip() for item in raw.split(',') if item.strip()]


class BaseConfig:
    SECRET_KEY: str = os.getenv('SECRET_KEY', '')
    DB_HOST:     str  = os.getenv('DB_HOST', 'db')
    DB_USER:     str  = os.getenv('DB_USER', 'root')
    DB_PASSWORD: str  = os.getenv('DB_PASSWORD', '')
    DB_NAME:     str  = os.getenv('DB_NAME', 'app_db')
    SESSION_COOKIE_HTTPONLY: bool = True
    SESSION_COOKIE_SECURE: bool = _env_flag('SESSION_COOKIE_SECURE', False)
    SESSION_COOKIE_SAMESITE: str = os.getenv('SESSION_COOKIE_SAMESITE', 'Lax')
    CORS_ALLOWED_ORIGINS: list[str] = _env_list('CORS_ALLOWED_ORIGINS', 'http://localhost:5173')
    CORS_SUPPORTS_CREDENTIALS: bool = True
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
