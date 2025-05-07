#include <DHT.h>
#include <Servo.h>

#define DHTPIN 2
#define DHTTYPE DHT11

DHT dht(DHTPIN, DHTTYPE);
Servo windowServo;

const int lightSensorPin = A0;
const int servoPin = 5;
const int buzzerPin = 6;
const int ledPin = 7;

void setup() {
  Serial.begin(9600);
  dht.begin();
  delay(2000);

  pinMode(buzzerPin, OUTPUT);
  pinMode(ledPin, OUTPUT);

  windowServo.attach(servoPin);
  windowServo.write(0); // Servo closed position
}

void loop() {
  float temp = dht.readTemperature();
  float hum = dht.readHumidity();
  int lightLevel = analogRead(lightSensorPin);
  int mappedLevel = map(lightLevel, 0, 50, 0, 100);

  if (isnan(temp) || isnan(hum)) {
    Serial.println("ERROR");
    return;
  }

  // Send data over Serial
  Serial.print("TEMP:");
  Serial.print(temp);
  Serial.print(" HUM:");
  Serial.print(hum);
  Serial.print(" LIGHT:");
  Serial.println(mappedLevel);

  // Check for incoming commands
  if (Serial.available() > 0) {
    String command = Serial.readStringUntil('\n');
    command.trim();

    if (command == "BUZZER_ON") {
      digitalWrite(buzzerPin, HIGH);
    }
    else if (command == "BUZZER_OFF") {
      digitalWrite(buzzerPin, LOW);
    }
    else if (command == "SERVO_OPEN") {
      windowServo.write(90);
      Serial.println("Servo: OPEN");
    }
    else if (command == "SERVO_CLOSE") {
      windowServo.write(0);
      Serial.println("Servo: CLOSE");
    }
    else if (command == "LED_ON") {
      digitalWrite(ledPin, HIGH);
    }
    else if (command == "LED_OFF") {
      digitalWrite(ledPin, LOW);
    }
  }

  delay(3000);
}