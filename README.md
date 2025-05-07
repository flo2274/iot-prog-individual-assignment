# IoT Smart Home Dashboard

=========================

This project is an IoT Smart Home system for monitoring and controlling environmental conditions such as temperature, humidity, and light. It uses an Arduino with sensors and actuators, a Python backend with edge computing, a MySQL database, and a web dashboard.

## Features

---

- Read temperature, humidity, and light level (DHT11, phototransistor)
- Control LED, buzzer, and servo motor (window)
- Store data in a MySQL database
- Display real-time data and historical charts in a web interface
- Configure automation rules and manual control through the dashboard

## Components

---

- Hardware: Arduino Uno, DHT11, phototransistor, LED, buzzer, servo
- Backend: Python (Flask, Flask-SocketIO, pyserial, pymysql)
- Database: MySQL Server
- Frontend: HTML, CSS, JavaScript, D3.js, Socket.IO

## Setup

1. Make sure MySQL server is running and apply `database/schema.sql`.
2. Connect the Arduino to your computer and upload the Arduino sketch.
3. Update `.env` with the correct serial port.
4. Install Python dependencies (Flask, Flask-SocketIO, pyserial, pymysql).
5. Run the backend:
   bash run.sh
6. Open the web dashboard in your browser (at http://localhost:3002).

## Notes

- Use a flashlight to test the light sensor.
- Tap or breathe near DHT11 to change humidity.
- Change automation thresholds in the dashboard for auto routines.
- Manual actuator control is available through the UI.
