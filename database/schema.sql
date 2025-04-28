-- Löscht die Tabelle, falls sie bereits existiert (für Entwicklungszwecke)
DROP TABLE IF EXISTS sensor_data;

-- Erstellt die Tabelle zur Speicherung der Sensordaten
CREATE TABLE sensor_data (
    id INT AUTO_INCREMENT PRIMARY KEY,          -- Eindeutige ID für jeden Eintrag
    temperature FLOAT,                          -- Temperaturwert (z.B. 23.5)
    humidity FLOAT,                             -- Luftfeuchtigkeitswert (z.B. 45.8)
    light_level INT,                            -- Lichtlevel (z.B. 0-1023)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP -- Zeitstempel der Messung
);

-- Optional: Index zur schnelleren Abfrage nach Zeitstempel
CREATE INDEX idx_created_at ON sensor_data (created_at);