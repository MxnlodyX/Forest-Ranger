from .users import users_bp
from .human_resource import hr_bp


def register_blueprints(app) -> None:
    app.register_blueprint(users_bp)
    app.register_blueprint(hr_bp)
