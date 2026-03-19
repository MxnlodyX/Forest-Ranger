CREATE DATABASE IF NOT EXISTS app_db;
USE app_db;

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS staff (
    staff_id INT AUTO_INCREMENT,
    username VARCHAR(255) NOT NULL,
    pwd VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    contact_number VARCHAR(20),
    title_role VARCHAR(100),
    staff_role VARCHAR(100) NOT NULL,
    area VARCHAR(100), -- <--- เติมคอลัมน์นี้เข้ามาให้ตรงกับ Frontend
    status ENUM('Off Duty', 'On Duty', 'Leave') DEFAULT 'Off Duty',
    profile_image VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (staff_id),
    UNIQUE KEY uq_staff_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS location (
    location_id INT AUTO_INCREMENT,
    location_name VARCHAR(255) NOT NULL,
    location_type VARCHAR(150),
    risk_level ENUM('Low', 'Medium', 'High') DEFAULT 'Low',
    sector VARCHAR(100),
    coordinates VARCHAR(255),
    description TEXT,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (location_id),
    KEY idx_location_created_by (created_by),
    CONSTRAINT fk_location_created_by
        FOREIGN KEY (created_by) REFERENCES staff(staff_id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS task (
    task_id INT AUTO_INCREMENT,
    task_title VARCHAR(255) NOT NULL,
    objective TEXT,
    description TEXT,
    destination VARCHAR(255),
    assigned_to INT,
    location_id INT,
    priority ENUM('Low', 'Medium', 'High') DEFAULT 'Medium',
    status ENUM('Todo', 'In Progress', 'Done') DEFAULT 'Todo',
    eta VARCHAR(50),
    assigned_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (task_id),
    KEY idx_task_assigned_to (assigned_to),
    KEY idx_task_location_id (location_id),
    CONSTRAINT fk_task_assigned_to
        FOREIGN KEY (assigned_to) REFERENCES staff(staff_id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,
    CONSTRAINT fk_task_location_id
        FOREIGN KEY (location_id) REFERENCES location(location_id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS inventory (
    inventory_id INT AUTO_INCREMENT,
    unique_id VARCHAR(255) NOT NULL,
    item_name VARCHAR(255) NOT NULL,
    inventory_type VARCHAR(100),
    created_by INT,
    inventory_status ENUM('Available', 'In Use', 'Maintenance') DEFAULT 'Available',
    use_by INT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (inventory_id),
    UNIQUE KEY uq_inventory_unique_id (unique_id),
    KEY idx_inventory_created_by (created_by),
    KEY idx_inventory_use_by (use_by),
    CONSTRAINT fk_inventory_created_by
        FOREIGN KEY (created_by) REFERENCES staff(staff_id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,
    CONSTRAINT fk_inventory_use_by
        FOREIGN KEY (use_by) REFERENCES staff(staff_id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS incident_report (
    incident_id INT AUTO_INCREMENT,
    incident_title VARCHAR(255) NOT NULL,
    description TEXT,
    incident_type VARCHAR(100),
    location_id INT,
    reported_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (incident_id),
    KEY idx_incident_location_id (location_id),
    KEY idx_incident_reported_by (reported_by),
    CONSTRAINT fk_incident_reported_by
        FOREIGN KEY (reported_by) REFERENCES staff(staff_id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,
    CONSTRAINT fk_incident_location_id
        FOREIGN KEY (location_id) REFERENCES location(location_id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS incident_image (
    image_id INT AUTO_INCREMENT,
    incident_id INT NOT NULL,
    image_url VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (image_id),
    KEY idx_incident_image_incident_id (incident_id),
    CONSTRAINT fk_incident_image_incident_id
        FOREIGN KEY (incident_id) REFERENCES incident_report(incident_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- Seed data (MVP)
-- ============================================

INSERT INTO staff (
    username,
    pwd,
    full_name,
    contact_number,
    title_role,
    staff_role,
    status
) VALUES
    (
        'bof_admin_01',
        '12345678', 
        'Marcus Thanasak',
        '+66-81-111-1001',
        'Command Director',
        'Back-Office',
        'Off Duty'
    ),
    (
        'fo_ranger_01',
        '12345678',
        'Narin Kittisak',
        '+66-81-111-1002',
        'Senior Ranger',
        'Field-Ops',
        'Off Duty'
    )
ON DUPLICATE KEY UPDATE
    full_name = VALUES(full_name),
    contact_number = VALUES(contact_number),
    title_role = VALUES(title_role),
    staff_role = VALUES(staff_role),
    status = VALUES(status),
    updated_at = CURRENT_TIMESTAMP;

INSERT INTO location (
    location_name,
    location_type,
    risk_level,
    sector,
    coordinates,
    description,
    created_by
)
SELECT
    'Haew Suwat Waterfall Patrol Point',
    'Water Source',
    'Medium',
    'Khao Yai - Central Zone',
    '14.540700, 101.373600',
    'Primary patrol checkpoint near Haew Suwat Waterfall in Khao Yai National Park.',
    s.staff_id
FROM staff s
WHERE s.username = 'fo_ranger_01'
  AND NOT EXISTS (
      SELECT 1 FROM location l
      WHERE l.location_name = 'Haew Suwat Waterfall Patrol Point'
  );

INSERT INTO location (
    location_name,
    location_type,
    risk_level,
    sector,
    coordinates,
    description,
    created_by
)
SELECT
    'Pha Kluai Mai Trailhead Checkpoint',
    'Tourist Trail Entrance',
    'Low',
    'Khao Yai - Eastern Valley',
    '14.526900, 101.404800',
    'Trailhead monitoring point for tourist flow and wildlife safety checks.',
    s.staff_id
FROM staff s
WHERE s.username = 'fo_ranger_01'
  AND NOT EXISTS (
      SELECT 1 FROM location l
      WHERE l.location_name = 'Pha Kluai Mai Trailhead Checkpoint'
  );

-- ============================================
-- Seed tasks (MVP)
-- ============================================

INSERT INTO task (
    task_title,
    objective,
    description,
    destination,
    assigned_to,
    location_id,
    priority,
    status,
    eta,
    assigned_date
)
SELECT
    'Patrol Haew Suwat Waterfall Sector',
    'Inspect the waterfall perimeter for signs of illegal activity and check trail conditions.',
    'Conduct a full sweep of the waterfall area. Document any damaged signage or suspicious activity and report via radio.',
    'Haew Suwat Waterfall Patrol Point',
    ranger.staff_id,
    loc.location_id,
    'High',
    'Todo',
    '2h 30m',
    CURRENT_DATE
FROM
    staff ranger,
    location loc
WHERE
    ranger.username = 'fo_ranger_01'
    AND loc.location_name = 'Haew Suwat Waterfall Patrol Point'
    AND NOT EXISTS (
        SELECT 1 FROM task t
        WHERE t.task_title = 'Patrol Haew Suwat Waterfall Sector'
    )
LIMIT 1;

INSERT INTO task (
    task_title,
    objective,
    description,
    destination,
    assigned_to,
    location_id,
    priority,
    status,
    eta,
    assigned_date
)
SELECT
    'Tourist Flow Monitoring - Pha Kluai Mai',
    'Monitor tourist numbers at trailhead, enforce safety rules, and log wildlife sightings.',
    'Station at trailhead from 08:00-12:00. Record headcount every 30 minutes. Report any wildlife near the trail immediately.',
    'Pha Kluai Mai Trailhead Checkpoint',
    ranger.staff_id,
    loc.location_id,
    'Medium',
    'Todo',
    '4h 00m',
    CURRENT_DATE
FROM
    staff ranger,
    location loc
WHERE
    ranger.username = 'fo_ranger_01'
    AND loc.location_name = 'Pha Kluai Mai Trailhead Checkpoint'
    AND NOT EXISTS (
        SELECT 1 FROM task t
        WHERE t.task_title = 'Tourist Flow Monitoring - Pha Kluai Mai'
    )
LIMIT 1;

INSERT INTO task (
    task_title,
    objective,
    description,
    destination,
    assigned_to,
    location_id,
    priority,
    status,
    eta,
    assigned_date
)
SELECT
    'Camera Trap Maintenance - Eastern Valley',
    'Replace batteries and verify image capture status on all camera traps in the Eastern Valley zone.',
    'Visit camera trap stations EV-01 through EV-04. Replace batteries, clear memory cards, and confirm operation.',
    'Eastern Valley Camera Station EV-02',
    ranger.staff_id,
    loc.location_id,
    'Medium',
    'In Progress',
    '1h 45m',
    CURRENT_DATE
FROM
    staff ranger,
    location loc
WHERE
    ranger.username = 'fo_ranger_01'
    AND loc.location_name = 'Pha Kluai Mai Trailhead Checkpoint'
    AND NOT EXISTS (
        SELECT 1 FROM task t
        WHERE t.task_title = 'Camera Trap Maintenance - Eastern Valley'
    )
LIMIT 1;
