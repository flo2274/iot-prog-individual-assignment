from flask import Flask, render_template
import pymysql

app = Flask(__name__)

# Database connection
db = pymysql.connect(
    host="localhost",
    user="youruser",
    password="yourpassword",
    database="iot_project"
)
cursor = db.cursor()

@app.route('/')
def index():
    # Get latest sensor reading
    cursor.execute("SELECT temperature, humidity, light_level, timestamp FROM environment_log ORDER BY id DESC LIMIT 1")
    latest = cursor.fetchone()

    # Get last 10 sensor logs
    cursor.execute("SELECT temperature, humidity, light_level, timestamp FROM environment_log ORDER BY id DESC LIMIT 10")
    logs = cursor.fetchall()

    return render_template('index.html', latest=latest, logs=logs)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)