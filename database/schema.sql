-- Drop table if it exists (for development/testing)
DROP TABLE IF EXISTS sensor_data;

-- Create table to store sensor data
CREATE TABLE sensor_data (
    id INT AUTO_INCREMENT PRIMARY KEY,
    temperature FLOAT,
    humidity FLOAT,
    light_level INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP  -- Timestamp of the measurement
);

-- Optional index for faster queries by timestamp
CREATE INDEX idx_created_at ON sensor_data (created_at);