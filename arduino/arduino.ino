#include <DHT.h>
#include <Servo.h>

#define DHTPIN 2        // Pin where DHT is connected
#define DHTTYPE DHT22   // Or DHT11

DHT dht(DHTPIN, DHTTYPE);
Servo windowServo;

const int lightSensorPin = A0;
const int motorPin = 3;
const int servoPin = 5;
const int buzzerPin = 6;
const int ledPin = 7;

void setup() {
  Serial.begin(9600);
  dht.begin();
  
  pinMode(motorPin, OUTPUT);
  pinMode(buzzerPin, OUTPUT);
  pinMode(ledPin, OUTPUT);
  
  windowServo.attach(servoPin);
  windowServo.write(0); // Window closed
}

void loop() {
  // Read Sensors
  float temp = dht.readTemperature();
  float hum = dht.readHumidity();
  int lightLevel = analogRead(lightSensorPin);

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
  Serial.println(lightLevel);

  // Listen for commands from Mac
  if (Serial.available() > 0) {
    String command = Serial.readStringUntil('\n');
    command.trim();
    
    if (command == "MOTOR_ON") {
      digitalWrite(motorPin, HIGH);
    }
    else if (command == "MOTOR_OFF") {
      digitalWrite(motorPin, LOW);
    }
    else if (command == "BUZZER_ON") {
      digitalWrite(buzzerPin, HIGH);
    }
    else if (command == "BUZZER_OFF") {
      digitalWrite(buzzerPin, LOW);
    }
    else if (command == "SERVO_OPEN") {
      windowServo.write(90); // Open window
    }
    else if (command == "SERVO_CLOSE") {
      windowServo.write(0); // Close window
    }
    else if (command == "LED_ON") {
      digitalWrite(ledPin, HIGH);
    }
    else if (command == "LED_OFF") {
      digitalWrite(ledPin, LOW);
    }
  }

  delay(3000); // Read sensors every 3 seconds
}