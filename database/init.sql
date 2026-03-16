CREATE DATABASE IF NOT EXISTS app_db;
USE app_db;

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL
);

INSERT INTO users (name) VALUES ('Senior Engineer'), ('Data Scientist');