from .users import users_bp
from .officers import officers_bp


def register_blueprints(app) -> None:
    app.register_blueprint(users_bp)
    app.register_blueprint(officers_bp)
