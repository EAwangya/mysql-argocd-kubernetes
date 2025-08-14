-- Drop the database if it exists
DROP DATABASE IF EXISTS myappdb;

-- Create a fresh database
CREATE DATABASE myappdb;

-- Use the new database
USE myappdb;

-- Create users table if it doesn't exist
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100),
    email VARCHAR(100)
);

-- Insert a sample user
INSERT INTO users (name, email) VALUES 
('Ernest Awangya', 'c-ernest.awangya@charter.com');

-- Optional: create user with remote access
CREATE USER IF NOT EXISTS 'root'@'%' IDENTIFIED BY 'admin123';
GRANT ALL PRIVILEGES ON myappdb.* TO 'root'@'%';
FLUSH PRIVILEGES;
