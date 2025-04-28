import os
import pymysql
from dotenv import load_dotenv

# Laden der Umgebungsvariablen
load_dotenv()

# Datenbankverbindungsdetails aus .env holen
DB_HOST = os.getenv('DB_HOST', 'localhost')
DB_USER = os.getenv('DB_USER', 'user')
DB_PASSWORD = os.getenv('DB_PASSWORD', 'password')
DB_NAME = os.getenv('DB_NAME', 'iot_project')
DB_PORT = int(os.getenv('DB_PORT', 3306))

def get_db_connection():
    """Stellt eine Verbindung zur MySQL-Datenbank her."""
    try:
        connection = pymysql.connect(host=DB_HOST,
                                     user=DB_USER,
                                     password=DB_PASSWORD,
                                     database=DB_NAME,
                                     port=DB_PORT,
                                     cursorclass=pymysql.cursors.DictCursor) # Gibt Ergebnisse als Dictionary zurück
        # print("Database connection successful") # Debugging
        return connection
    except pymysql.Error as e:
        print(f"Error connecting to MySQL Database: {e}")
        return None # Gibt None zurück, wenn die Verbindung fehlschlägt

def insert_sensor_data(temperature, humidity, light_level):
    """Fügt einen neuen Sensordaten-Eintrag in die Datenbank ein."""
    connection = get_db_connection()
    if connection is None:
      raise ConnectionError("Could not establish database connection.") # Fehler werfen

    try:
        with connection.cursor() as cursor:
            # SQL-Befehl zum Einfügen der Daten (verwende den korrekten Tabellennamen!)
            # ACHTUNG: Stelle sicher, dass der Tabellenname 'sensor_data' mit schema.sql übereinstimmt.
            sql = "INSERT INTO `sensor_data` (`temperature`, `humidity`, `light_level`) VALUES (%s, %s, %s)"
            cursor.execute(sql, (temperature, humidity, light_level))
        connection.commit() # Änderungen bestätigen
        # print(f"Data inserted: T={temperature}, H={humidity}, L={light_level}") # Debugging
    except pymysql.Error as e:
        print(f"Error inserting data into database: {e}")
        # Optional: connection.rollback() bei Fehlern
        raise # Fehler weiterleiten, damit app.py ihn loggen kann
    finally:
        if connection:
            connection.close() # Verbindung immer schließen
            # print("Database connection closed") # Debugging

def get_historical_data(limit=100):
    """Holt die letzten 'limit' Sensordaten-Einträge aus der Datenbank."""
    connection = get_db_connection()
    if connection is None:
      raise ConnectionError("Could not establish database connection.")

    try:
        with connection.cursor() as cursor:
            # SQL-Befehl zum Abrufen der Daten, sortiert nach Zeitstempel absteigend
            # ACHTUNG: Stelle sicher, dass der Tabellenname 'sensor_data' korrekt ist.
            sql = "SELECT `temperature`, `humidity`, `light_level`, `created_at` FROM `sensor_data` ORDER BY `created_at` DESC LIMIT %s"
            cursor.execute(sql, (limit,))
            result = cursor.fetchall() # Holt alle passenden Zeilen

            # Konvertiere Zeitstempel in ein lesbares Format (ISO 8601), wichtig für JS
            for row in result:
                 if 'created_at' in row and row['created_at']:
                      row['created_at'] = row['created_at'].isoformat()

            # print(f"Fetched {len(result)} historical records.") # Debugging
            # Die neuesten Daten stehen jetzt am Anfang, für Charts oft umgekehrt besser:
            return result[::-1] # Kehrt die Liste um -> Älteste zuerst

    except pymysql.Error as e:
        print(f"Error fetching historical data: {e}")
        raise # Fehler weiterleiten
    finally:
        if connection:
            connection.close()
            # print("Database connection closed") # Debugging

# Beispielaufruf (nur zum Testen dieses Moduls direkt)
if __name__ == '__main__':
    print("Testing database module...")
    try:
        # Teste Einfügen
        print("Attempting to insert test data...")
        insert_sensor_data(99.9, 88.8, 777)
        print("Test data inserted.")

        # Teste Abrufen
        print("Attempting to fetch historical data...")
        history = get_historical_data(limit=5)
        print("Historical data fetched:")
        for record in history:
            print(record)

    except Exception as e:
        print(f"Test failed: {e}")