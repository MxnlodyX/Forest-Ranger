import pymysql
import os
from dotenv import load_dotenv

load_dotenv()

def migrate():
    try:
        conn = pymysql.connect(
            host=os.getenv('DB_HOST', 'localhost'),
            user=os.getenv('DB_USER', 'root'),
            password=os.getenv('DB_PASSWORD', ''),
            database=os.getenv('DB_NAME', 'app_db'),
            cursorclass=pymysql.cursors.DictCursor
        )
        with conn.cursor() as cursor:
            print("Creating public_alert table...")
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS public_alert (
                    alert_id INT AUTO_INCREMENT,
                    incident_type ENUM('fire', 'flood', 'wildlife', 'other') NOT NULL,
                    other_detail TEXT,
                    urgency ENUM('normal', 'urgent', 'emergency') DEFAULT 'normal',
                    location_id INT,
                    reporter_name VARCHAR(255),
                    reporter_phone VARCHAR(50) NOT NULL,
                    reporter_email VARCHAR(255),
                    description TEXT,
                    status ENUM('Pending', 'Received', 'In Progress', 'Resolved', 'Rejected') DEFAULT 'Pending',
                    staff_comments TEXT,
                    handled_by INT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    PRIMARY KEY (alert_id),
                    KEY idx_public_alert_location (location_id),
                    KEY idx_public_alert_handled_by (handled_by),
                    CONSTRAINT fk_public_alert_location
                        FOREIGN KEY (location_id) REFERENCES location(location_id)
                        ON DELETE SET NULL
                        ON UPDATE CASCADE,
                    CONSTRAINT fk_public_alert_handled_by
                        FOREIGN KEY (handled_by) REFERENCES staff(staff_id)
                        ON DELETE SET NULL
                        ON UPDATE CASCADE
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
            """)
            conn.commit()
            print("Table created successfully!")
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    migrate()
