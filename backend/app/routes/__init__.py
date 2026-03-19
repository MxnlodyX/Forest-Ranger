from .users import users_bp
from .human_resource import hr_bp
from .sign_in import sign_in_bp
from .task import task_bp
from .inventory import inventory_bp  # <--- นำเข้าไฟล์ที่เพิ่งสร้างใหม่

def register_blueprints(app) -> None:
    app.register_blueprint(users_bp)
    app.register_blueprint(hr_bp)
    app.register_blueprint(sign_in_bp)
    app.register_blueprint(task_bp)
    app.register_blueprint(inventory_bp)  # <--- ลงทะเบียนให้ Backend รู้จัก
