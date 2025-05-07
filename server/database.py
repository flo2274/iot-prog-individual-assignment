import os
import pymysql
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Database config from .env
DB_HOST = os.getenv('DB_HOST', 'localhost')
DB_USER = os.getenv('DB_USER', 'user')
DB_PASSWORD = os.getenv('DB_PASSWORD', 'password')
DB_NAME = os.getenv('DB_NAME', 'iot_project')
DB_PORT = int(os.getenv('DB_PORT', 3306))

def get_db_connection():
    """Connect to MySQL database."""
    try:
        connection = pymysql.connect(host=DB_HOST,
                                     user=DB_USER,
                                     password=DB_PASSWORD,
                                     database=DB_NAME,
                                     port=DB_PORT,
                                     cursorclass=pymysql.cursors.DictCursor)
        return connection
    except pymysql.Error as e:
        print(f"Error connecting to MySQL: {e}")
        return None

def insert_sensor_data(temperature, humidity, light_level):
    """Insert new sensor data into database."""
    connection = get_db_connection()
    if connection is None:
        raise ConnectionError("Database connection failed.")

    try:
        with connection.cursor() as cursor:
            sql = "INSERT INTO `sensor_data` (`temperature`, `humidity`, `light_level`) VALUES (%s, %s, %s)"
            cursor.execute(sql, (temperature, humidity, light_level))
        connection.commit()
    except pymysql.Error as e:
        print(f"Error inserting data: {e}")
        raise
    finally:
        if connection:
            connection.close()

def get_historical_data(limit=500):
    """Fetch last 'limit' sensor records."""
    connection = get_db_connection()
    if connection is None:
        raise ConnectionError("Database connection failed.")

    try:
        with connection.cursor() as cursor:
            sql = "SELECT `temperature`, `humidity`, `light_level`, `created_at` FROM `sensor_data` ORDER BY `created_at` DESC LIMIT %s"
            cursor.execute(sql, (limit,))
            result = cursor.fetchall()

            for row in result:
                if 'created_at' in row and row['created_at']:
                    row['created_at'] = row['created_at'].isoformat()

            return result[::-1]  # Oldest first
    except pymysql.Error as e:
        print(f"Error fetching data: {e}")
        raise
    finally:
        if connection:
            connection.close()

if __name__ == '__main__':
    print("Testing database module...")
    try:
        print("Inserting test data...")
        insert_sensor_data(99.9, 88.8, 777)
        print("Test data inserted.")

        print("Fetching historical data...")
        history = get_historical_data(limit=5)
        print("Historical data:")
        for record in history:
            print(record)
    except Exception as e:
        print(f"Test failed: {e}")