import os
import serial
import threading
import time
import re
from flask import Flask, render_template, jsonify, request
from flask_socketio import SocketIO, emit
from dotenv import load_dotenv
import database
import json

# Load environment variables
load_dotenv()

# --- Config ---
SERIAL_PORT = os.getenv('SERIAL_PORT', '/dev/tty.usbmodem11301')
BAUD_RATE = int(os.getenv('BAUD_RATE', 9600))
DATABASE_NAME = os.getenv('DB_NAME', 'iot_project')

# --- Flask & SocketIO ---
app = Flask(__name__)
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'a_very_secret_key')
socketio = SocketIO(app, async_mode='threading')

# --- Serial Setup ---
ser = None
serial_lock = threading.Lock()

def initialize_serial():
    global ser
    try:
        ser = serial.Serial(SERIAL_PORT, BAUD_RATE, timeout=1)
        print(f"Successfully connected to Arduino on {SERIAL_PORT}")
        time.sleep(2)
        ser.flushInput()
        return True
    except serial.SerialException as e:
        print(f"Error connecting to serial port {SERIAL_PORT}: {e}")
        ser = None
        return False
    except Exception as e:
        print(f"Unexpected error during serial init: {e}")
        ser = None
        return False

def parse_arduino_string(data_string):
    try:
        match = re.search(r"TEMP:\s*(-?\d+\.?\d*)\s+HUM:\s*(\d+\.?\d*)\s+LIGHT:\s*(\d+)", data_string)
        if match:
            return float(match.group(1)), float(match.group(2)), int(match.group(3))
        elif "ERROR" in data_string:
            print("Received ERROR from Arduino.")
            return None, None, None
        else:
            return None, None, None
    except Exception as e:
        print(f"Error parsing '{data_string}': {e}")
        return None, None, None

def read_from_arduino():
    global ser
    counter = 0
    while True:
        if ser is None or not ser.is_open:
            print("Serial port not available. Attempting reconnect...")
            if not initialize_serial():
                time.sleep(5)
                continue

        try:
            if ser.in_waiting > 0:
                with serial_lock:
                    line = ser.readline().decode('utf-8', errors='ignore').strip()

                if line:
                    temperature, humidity, light_level = parse_arduino_string(line)
                    if temperature is not None and humidity is not None and light_level is not None:
                        print(f"Received: Temp={temperature}°C, Hum={humidity}%, Light={light_level}")
                        counter += 1
                        if counter % 10 == 0:
                            try:
                                database.insert_sensor_data(temperature, humidity, light_level)
                                print("Data inserted into database.")
                            except Exception as db_err:
                                print(f"Database error: {db_err}")

                        socketio.emit('sensor_update', {
                            'temperature': temperature,
                            'humidity': humidity,
                            'light_level': light_level
                        })
                        print("Sensor data emitted.")
                        handle_automatic_actions(temperature, humidity, light_level)

        except serial.SerialException as e:
            print(f"Serial error: {e}. Reconnecting...")
            ser.close()
            ser = None
            time.sleep(5)
        except Exception as e:
            print(f"Error in read_from_arduino: {e}")
            time.sleep(1)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/history')
def history():
    return render_template('history.html')

@app.route('/routine')
def routine():
    return render_template('routine.html')

@app.route('/api/history')
def api_history():
    try:
        data = database.get_historical_data(limit=100)
        return jsonify(data)
    except Exception as e:
        print(f"History fetch error: {e}")
        return jsonify({"error": "Could not fetch history data"}), 500

@socketio.on('connect')
def handle_connect():
    print('Client connected')

@socketio.on('disconnect')
def handle_disconnect():
    print('Client disconnected')

@socketio.on('send_command')
def handle_command(data):
    global ser
    command = data.get('command')
    if command:
        print(f"Client command: {command}")
        if ser and ser.is_open:
            try:
                with serial_lock:
                    ser.write(f"{command}\n".encode('utf-8'))
                emit('command_response', {'status': 'success', 'command': command, 'mode': 'hand-mode'})
                if command in ['LED_ON', 'LED_OFF']:
                    set_manual_override('LED')
                elif command in ['SERVO_OPEN', 'SERVO_CLOSE']:
                    set_manual_override('SERVO')
                elif command in ['BUZZER_ON', 'BUZZER_OFF']:
                    set_manual_override('BUZZER')
            except Exception as e:
                print(f"Send error: {e}")
                emit('command_response', {'status': 'error', 'message': str(e), 'command': command})
        else:
            emit('command_response', {'status': 'error', 'message': 'Serial port not available', 'command': command})

THRESHOLDS_FILE = os.path.join(os.path.dirname(__file__), 'thresholds.json')

def load_thresholds():
    with open(THRESHOLDS_FILE, 'r') as f:
        return json.load(f)

def save_thresholds(thresholds):
    with open(THRESHOLDS_FILE, 'w') as f:
        json.dump(thresholds, f)

@app.route('/api/config')
def api_config():
    thresholds = load_thresholds()
    return jsonify(thresholds)

@app.route('/api/config', methods=['POST'])
def update_config():
    data = request.json
    save_thresholds(data)
    return jsonify({"status": "success"})

# --- Manual override flags ---
manual_override = {'LED': False, 'SERVO': False, 'BUZZER': False}
override_timers = {}

def set_manual_override(device, duration=600):
    manual_override[device] = True
    if override_timers.get(device):
        override_timers[device].cancel()
    timer = threading.Timer(duration, reset_manual_override, args=[device])
    override_timers[device] = timer
    timer.start()
    print(f"Manual override set for {device} ({duration}s)")

def reset_manual_override(device):
    manual_override[device] = False
    print(f"Manual override expired for {device}")

# --- Last known states ---
last_states = {
    'LED': None,
    'SERVO': None,
    'BUZZER': None
}

def handle_automatic_actions(temp, hum, light):
    thresholds = load_thresholds()
    LIGHT_THRESHOLD = thresholds['LIGHT_THRESHOLD']
    HUMIDITY_LOW_THRESHOLD = thresholds['HUMIDITY_LOW_THRESHOLD']
    HUMIDITY_HIGH_THRESHOLD = thresholds['HUMIDITY_HIGH_THRESHOLD']
    TEMPERATURE_HIGH_THRESHOLD = thresholds['TEMPERATURE_HIGH_THRESHOLD']

    led_state = 'LED_ON' if light < LIGHT_THRESHOLD else 'LED_OFF'
    if not manual_override['LED'] and led_state != last_states['LED']:
        send_command_to_arduino(led_state)
        last_states['LED'] = led_state

    servo_state = 'SERVO_OPEN' if hum < HUMIDITY_LOW_THRESHOLD or hum > HUMIDITY_HIGH_THRESHOLD else 'SERVO_CLOSE'
    if not manual_override['SERVO'] and servo_state != last_states['SERVO']:
        send_command_to_arduino(servo_state)
        last_states['SERVO'] = servo_state

    buzzer_state = 'BUZZER_ON' if temp > TEMPERATURE_HIGH_THRESHOLD else 'BUZZER_OFF'
    if not manual_override['BUZZER'] and buzzer_state != last_states['BUZZER']:
        send_command_to_arduino(buzzer_state)
        last_states['BUZZER'] = buzzer_state

def send_command_to_arduino(command):
    global ser
    if ser and ser.is_open:
        try:
            with serial_lock:
                ser.write(f"{command}\n".encode('utf-8'))
            print(f"Auto command sent: {command}")
            socketio.emit('command_response', {
                'command': command,
                'status': 'success',
                'mode': 'auto-mode'
            })
        except Exception as e:
            print(f"Error sending AUTO command '{command}': {e}")
            socketio.emit('command_response', {
                'command': command,
                'status': 'error',
                'message': str(e),
                'mode': 'auto-mode'
            })

if __name__ == '__main__':
    if initialize_serial():
        serial_thread = threading.Thread(target=read_from_arduino, daemon=True)
        serial_thread.start()
    else:
        print("WARNING: Serial port could not be opened. Will retry in background.")
        serial_thread = threading.Thread(target=read_from_arduino, daemon=True)
        serial_thread.start()

    print("Server running at http://localhost:3002")
    socketio.run(app, host='localhost', port=3002, debug=True, use_reloader=False)