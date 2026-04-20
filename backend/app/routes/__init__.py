from .users import users_bp
from .human_resource import hr_bp
from .sign_in import sign_in_bp
from .task import task_bp
from .inventory import inventory_bp 
from .dashboard import dashboard_bp 
from .report_management import report_bp
from .patrol_route import patrol_route_bp
from .heatmap import heatmap_bp
from .knowledge_management import knowledge_bp
from .monthly_report import monthly_report_bp
from .vilager_incident_report import vilager_report_bp

def register_blueprints(app) -> None:
    app.register_blueprint(users_bp)
    app.register_blueprint(hr_bp)
    app.register_blueprint(sign_in_bp)
    app.register_blueprint(task_bp)
    app.register_blueprint(dashboard_bp) 
    app.register_blueprint(inventory_bp)
    app.register_blueprint(report_bp)
    app.register_blueprint(patrol_route_bp)
    app.register_blueprint(heatmap_bp)
    app.register_blueprint(knowledge_bp)
    app.register_blueprint(monthly_report_bp)
    app.register_blueprint(vilager_report_bp)
