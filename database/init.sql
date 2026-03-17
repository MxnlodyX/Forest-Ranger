CREATE DATABASE IF NOT EXISTS app_db;
USE app_db;

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL
);

INSERT INTO users (name) VALUES ('Senior Engineer'), ('Data Scientist');

CREATE TABLE officers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id VARCHAR(50) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    position VARCHAR(100) NOT NULL,
    department VARCHAR(100) NOT NULL,
    rank VARCHAR(50),
    phone VARCHAR(20),
    email VARCHAR(100),
    hire_date DATE,
    status ENUM('active', 'inactive', 'on_leave') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT INTO officers (employee_id, first_name, last_name, position, department, rank, phone, email, hire_date, status)
VALUES
    ('OFF001', 'สมชาย', 'ใจดี', 'Forest Ranger', 'Field Operations', 'Senior Officer', '081-234-5678', 'somchai@forest.go.th', '2020-01-15', 'active'),
    ('OFF002', 'สมหญิง', 'รักษ์ป่า', 'Conservation Officer', 'Conservation', 'Officer', '082-345-6789', 'somying@forest.go.th', '2021-03-20', 'active'),
    ('OFF003', 'ประสิทธิ์', 'พิทักษ์', 'Field Supervisor', 'Field Operations', 'Chief Officer', '083-456-7890', 'prasit@forest.go.th', '2019-06-10', 'active');