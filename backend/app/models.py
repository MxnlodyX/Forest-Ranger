import pymysql
import pymysql.cursors
from flask import current_app


def get_db_connection() -> pymysql.Connection:
    """เปิด connection ใหม่จาก config ของ app ปัจจุบัน"""
    cfg = current_app.config
    return pymysql.connect(
        host=cfg['DB_HOST'],
        user=cfg['DB_USER'],
        password=cfg['DB_PASSWORD'],
        database=cfg['DB_NAME'],
        cursorclass=pymysql.cursors.DictCursor,
    )
