from .users import users_bp


def register_blueprints(app) -> None:
    app.register_blueprint(users_bp)
