import os
import serial
import threading
import time
import re
from flask import Flask, render_template, jsonify
from flask_socketio import SocketIO, emit
from dotenv import load_dotenv
import database  # Importiert das database.py Modul

# Laden der Umgebungsvariablen aus der .env Datei
load_dotenv()

# --- Konfiguration ---
SERIAL_PORT = os.getenv('SERIAL_PORT', '/dev/tty.usbmodem11301') # Standardwert falls nicht in .env
BAUD_RATE = int(os.getenv('BAUD_RATE', 9600))
DATABASE_NAME = os.getenv('DB_NAME', 'iot_project') # Sicherstellen, dass DB existiert

# --- Flask & SocketIO Initialisierung ---
app = Flask(__name__)
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'a_very_secret_key') # Wichtig für SocketIO
socketio = SocketIO(app, async_mode='threading')

# --- Serielle Verbindung ---
ser = None # Wird später initialisiert
serial_lock = threading.Lock() # Lock für thread-sicheren Zugriff auf ser

def initialize_serial():
    """Versucht, die serielle Verbindung herzustellen."""
    global ser
    try:
        ser = serial.Serial(SERIAL_PORT, BAUD_RATE, timeout=1)
        print(f"Successfully connected to Arduino on {SERIAL_PORT}")
        # Kurze Pause, damit der Arduino ggf. neu starten kann
        time.sleep(2)
        # Leeren des Eingangspuffers
        ser.flushInput()
        return True
    except serial.SerialException as e:
        print(f"Error connecting to serial port {SERIAL_PORT}: {e}")
        ser = None
        return False
    except Exception as e:
        print(f"An unexpected error occurred during serial initialization: {e}")
        ser = None
        return False

def parse_arduino_string(data_string):
    """Parst den String vom Arduino (z.B. "TEMP:23.5 HUM:45.2 LIGHT:512")."""
    temp = hum = light = None
    try:
        # Regex, um die Werte zu extrahieren (robuster gegen Leerzeichen)
        match = re.search(r"TEMP:\s*(-?\d+\.?\d*)\s+HUM:\s*(\d+\.?\d*)\s+LIGHT:\s*(\d+)", data_string)
        if match:
            temp = float(match.group(1))
            hum = float(match.group(2))
            light = int(match.group(3))
            # print(f"Parsed data: Temp={temp}, Hum={hum}, Light={light}") # Debugging
            return temp, hum, light
        elif "ERROR" in data_string:
            print("Received ERROR message from Arduino.")
            return None, None, None # Signalisiert einen Fehler
        else:
            # print(f"Could not parse Arduino string: '{data_string}'") # Debugging
            return None, None, None
    except Exception as e:
        print(f"Error parsing string '{data_string}': {e}")
        return None, None, None

def read_from_arduino():
    """Hintergrund-Thread zum Lesen von Daten vom Arduino."""
    global ser
    while True:
        if ser is None or not ser.is_open:
            print("Serial port not available. Attempting to reconnect...")
            if not initialize_serial():
                time.sleep(5) # Warte 5 Sekunden vor dem nächsten Verbindungsversuch
                continue # Springe zum Anfang der Schleife

        try:
            if ser.in_waiting > 0:
                with serial_lock:
                    line = ser.readline().decode('utf-8', errors='ignore').strip()

                if line:
                    # print(f"Raw line from Arduino: {line}") # Debugging
                    temperature, humidity, light_level = parse_arduino_string(line)

                    if temperature is not None and humidity is not None and light_level is not None:
                        # Daten erfolgreich geparst
                        print(f"Received: Temp={temperature}°C, Hum={humidity}%, Light={light_level}")

                        # Daten in die Datenbank einfügen
                        try:
                             database.insert_sensor_data(temperature, humidity, light_level)
                             print("Data inserted into database.")
                        except Exception as db_err:
                             print(f"Database insert error: {db_err}")

                        # Daten an alle verbundenen Web-Clients senden
                        socketio.emit('sensor_update', {
                            'temperature': temperature,
                            'humidity': humidity,
                            'light_level': light_level
                        })
                        print("Sensor data emitted via SocketIO.")
                    elif "ERROR" not in line: # Ignoriere Parsing-Fehler, wenn es keine explizite Fehlermeldung war
                         pass # War möglicherweise nur eine unvollständige Zeile

        except serial.SerialException as e:
            print(f"Serial error during read: {e}. Attempting to reconnect...")
            ser.close()
            ser = None # Setze ser zurück, damit neu initialisiert wird
            time.sleep(5)
        except Exception as e:
            print(f"An unexpected error occurred in read_from_arduino: {e}")
            # Verhindert Endlosschleife bei unerwarteten Fehlern
            time.sleep(1)


# --- Flask Routen ---
@app.route('/')
def index():
    """Liefert das Haupt-Dashboard."""
    return render_template('index.html')

@app.route('/history')
def history():
    """Liefert die Verlaufsseite."""
    return render_template('history.html')

@app.route('/api/history')
def api_history():
    """API-Endpunkt zum Abrufen der Verlaufsdaten."""
    try:
        # Hole z.B. die letzten 100 Einträge
        data = database.get_historical_data(limit=100)
        # print(f"Fetched historical data: {data}") # Debugging
        return jsonify(data)
    except Exception as e:
        print(f"Error fetching history data: {e}")
        return jsonify({"error": "Could not fetch history data"}), 500


# --- SocketIO Events ---
@socketio.on('connect')
def handle_connect():
    """Wird aufgerufen, wenn sich ein Client verbindet."""
    print('Client connected')
    # Optional: Sende aktuelle Werte direkt beim Verbinden
    # last_data = database.get_historical_data(limit=1) # Hole letzten Wert
    # if last_data:
    #     socketio.emit('update_sensors', last_data[0])


@socketio.on('disconnect')
def handle_disconnect():
    """Wird aufgerufen, wenn ein Client die Verbindung trennt."""
    print('Client disconnected')

@socketio.on('send_command')
def handle_command(data):
    """Empfängt Befehle vom Client und sendet sie an den Arduino."""
    global ser
    command = data.get('command')
    if command:
        print(f"Received command from client: {command}")
        if ser and ser.is_open:
            try:
                with serial_lock:
                     # Befehl muss mit Newline enden, wie vom Arduino erwartet
                    ser.write(f"{command}\n".encode('utf-8'))
                print(f"Sent command '{command}' to Arduino.")
                # Optional: Feedback an den Client senden
                emit('command_response', {'status': 'success', 'command': command})
            except serial.SerialException as e:
                print(f"Serial error sending command '{command}': {e}")
                emit('command_response', {'status': 'error', 'message': str(e), 'command': command})
                # Versuche ggf. die Verbindung neu aufzubauen
                ser.close()
                ser = None
            except Exception as e:
                print(f"Error sending command '{command}': {e}")
                emit('command_response', {'status': 'error', 'message': str(e), 'command': command})
        else:
            print(f"Cannot send command '{command}', serial port not available.")
            emit('command_response', {'status': 'error', 'message': 'Serial port not available', 'command': command})


# --- Hauptausführung ---
if __name__ == '__main__':
    if initialize_serial(): # Versuche, Serial Port beim Start zu öffnen
       # Starte den Hintergrund-Thread nur, wenn Serial erfolgreich initialisiert wurde
       serial_thread = threading.Thread(target=read_from_arduino, daemon=True)
       serial_thread.start()
    else:
       print("WARNING: Serial port could not be opened on startup. Will retry in background thread.")
       # Starte den Thread trotzdem, er wird versuchen, sich zu verbinden
       serial_thread = threading.Thread(target=read_from_arduino, daemon=True)
       serial_thread.start()

    # printe diue URL
    print("Flask-SocketIO server is running at: http://localhost:3002")
    socketio.run(app, host='localhost', port=3002, debug=True, use_reloader=False)
    # use_reloader=False ist wichtig, wenn Threads verwendet werden, um doppelte Ausführung zu vermeiden.
    # Debug=True ist für die Entwicklung hilfreich, im Produktivbetrieb auf False setzen.