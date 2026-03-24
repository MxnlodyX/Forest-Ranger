from .users import users_bp
from .human_resource import hr_bp
from .sign_in import sign_in_bp
from .task import task_bp
<<<<<<< HEAD
from .inventory import inventory_bp 
from .dashboard import dashboard_bp 
=======
from .inventory import inventory_bp
from .report_management import report_bp
from .patrol_route import patrol_route_bp
>>>>>>> 086fbc20f1f67fc8e00d5226703d61760fa7a849

def register_blueprints(app) -> None:
    app.register_blueprint(users_bp)
    app.register_blueprint(hr_bp)
    app.register_blueprint(sign_in_bp)
    app.register_blueprint(task_bp)
<<<<<<< HEAD
    app.register_blueprint(inventory_bp)  
    app.register_blueprint(dashboard_bp) 
=======
    app.register_blueprint(inventory_bp)
    app.register_blueprint(report_bp)
    app.register_blueprint(patrol_route_bp)
>>>>>>> 086fbc20f1f67fc8e00d5226703d61760fa7a849
