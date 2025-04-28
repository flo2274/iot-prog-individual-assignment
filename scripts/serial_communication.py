import serial
import pymysql
import time

# Configure Serial
ser = serial.Serial('/dev/tty.usbmodem11301', 9600)
time.sleep(2)  # Wait for Arduino to reset

db = pymysql.connect(
    host="localhost",
    user="iot_user",
    password="Justtest1234!",
    database="iot_project"
)

cursor = db.cursor()

def insert_into_db(temp, hum, light):
    sql = "INSERT INTO sensor_data (temperature, humidity, light_level) VALUES (%s, %s, %s)"
    cursor.execute(sql, (temp, hum, light))
    db.commit()

while True:
    try:
        if ser.in_waiting > 0:
            line = ser.readline().decode('utf-8').strip()
            print(f"Received: {line}")

            if line.startswith("TEMP"):
                # Example: TEMP:25.00 HUM:40.00 LIGHT:300
                parts = line.split()
                temp = float(parts[0].split(":")[1])
                hum = float(parts[1].split(":")[1])
                light = int(parts[2].split(":")[1])

                insert_into_db(temp, hum, light)

                # Logic for control
                if temp > 30:
                    ser.write(b'BUZZER_ON\n')
                else:
                    ser.write(b'BUZZER_OFF\n')

                if temp > 27:
                    ser.write(b'MOTOR_ON\n')
                else:
                    ser.write(b'MOTOR_OFF\n')

                if hum > 60:
                    ser.write(b'SERVO_OPEN\n')
                else:
                    ser.write(b'SERVO_CLOSE\n')

                if light < 100:
                    ser.write(b'LED_ON\n')
                else:
                    ser.write(b'LED_OFF\n')

    except Exception as e:
        print(f"Error: {e}")
        time.sleep(2)