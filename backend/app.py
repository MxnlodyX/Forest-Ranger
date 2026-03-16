# โค้ดนี้ถูก refactor ไปที่ app/ package แล้ว
# Entry point ใหม่คือ run.py
# ไฟล์นี้เก็บไว้เพื่อความเข้ากันได้เท่านั้น
from app import create_app  # noqa: F401

app = create_app()