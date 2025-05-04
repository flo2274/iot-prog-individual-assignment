#include <DHT.h>
#include <Servo.h>

#define DHTPIN 2        // Pin where DHT is connected
#define DHTTYPE DHT11   // Or DHT11

DHT dht(DHTPIN, DHTTYPE);
Servo windowServo; // Deklariere das Servo-Objekt

const int lightSensorPin = A0;
// Der MotorPin wird nicht mehr benötigt
// const int motorPin = 3;
const int servoPin = 5; // Pin for the servo (you already have this)
const int buzzerPin = 6;
const int ledPin = 7;

void setup() {
  Serial.begin(9600);
  dht.begin();
  delay(2000);

  // Der MotorPin wird nicht mehr als OUTPUT gesetzt
  // pinMode(motorPin, OUTPUT);
  pinMode(buzzerPin, OUTPUT);
  pinMode(ledPin, OUTPUT);

  windowServo.attach(servoPin); // Weise den Servo dem Pin 5 zu
  windowServo.write(0); // Setze den Servo auf die "geschlossen"-Position (0 Grad)

  // Den Motor hier einschalten wird entfernt
  // digitalWrite(motorPin, HIGH);
}

void loop() {
  // Read Sensors
  float temp = dht.readTemperature();
  float hum = dht.readHumidity();
  int lightLevel = analogRead(lightSensorPin);

  int mappedLevel = map(lightLevel, 0, 50, 0, 100);

  if (isnan(temp) || isnan(hum)) {
    Serial.println("ERROR");
    // Optional: Handle this error more gracefully if needed
    // For now, we just return and try again in the next loop iteration
    return;
  }

  // Send data over Serial
  Serial.print("TEMP:");
  Serial.print(temp);
  Serial.print(" HUM:");
  Serial.print(hum);
  Serial.print(" LIGHT:");
  Serial.println(mappedLevel);

  // Listen for commands from Mac
  if (Serial.available() > 0) {
    String command = Serial.readStringUntil('\n');
    command.trim();

    // MOTOR_ON und MOTOR_OFF Befehle werden entfernt
    // if (command == "MOTOR_ON") {
    //   digitalWrite(motorPin, LOW);
    // }
    // else if (command == "MOTOR_OFF") {
    //   digitalWrite(motorPin, HIGH);
    // }

    if (command == "BUZZER_ON") {
      digitalWrite(buzzerPin, HIGH);
    }
    else if (command == "BUZZER_OFF") {
      digitalWrite(buzzerPin, LOW);
    }
    else if (command == "SERVO_OPEN") {
      // Steuere den Servo auf die "offen"-Position (z.B. 90 Grad)
      // Du kannst diesen Wert anpassen, je nachdem wie dein Servo montiert ist
      windowServo.write(90);
      Serial.println("Servo: OPEN"); // Bestätigung senden (optional)
    }
    else if (command == "SERVO_CLOSE") {
      // Steuere den Servo auf die "geschlossen"-Position (0 Grad)
      // Du kannst diesen Wert anpassen
      windowServo.write(0);
      Serial.println("Servo: CLOSE"); // Bestätigung senden (optional)
    }
    else if (command == "LED_ON") {
      digitalWrite(ledPin, HIGH);
    }
    else if (command == "LED_OFF") {
      digitalWrite(ledPin, LOW);
    }
    // Du könntest auch einen Befehl für beliebige Winkel hinzufügen, z.B. "SERVO:45"
    // else if (command.startsWith("SERVO:")) {
    //   int angle = command.substring(6).toInt(); // Extrahiere den Wert nach "SERVO:"
    //   angle = constrain(angle, 0, 180); // SG90 kann typischerweise 0-180 Grad
    //   windowServo.write(angle);
    //   Serial.print("Servo: SET to "); Serial.println(angle); // Bestätigung senden
    // }
    else {
      // Optional: Unbekannten Befehl loggen
      // Serial.print("Unknown command: "); Serial.println(command);
    }
  }

  delay(3000); // Read sensors every 3 seconds
}