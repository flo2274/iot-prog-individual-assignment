import { config } from "./config.js";

const uiElements = {
  temperature: document.getElementById(
    config.chart.sensors.temperature.elementId
  ),
  humidity: document.getElementById(config.chart.sensors.humidity.elementId),
  light_level: document.getElementById(
    config.chart.sensors.light_level.elementId
  ),
  connectionStatus: document.getElementById(config.ui.connectionStatusId),
  dashboardChartContainer: document.getElementById(
    config.ui.dashboardChartContainerId
  ),
};

function formatValue(value, unit) {
  const number = parseFloat(value);
  return isNaN(number) ? "--" : `${number.toFixed(1)} ${unit}`;
}

export function updateLiveValue(sensorKey, value) {
  const element = uiElements[sensorKey];
  const sensorConfig = config.chart.sensors[sensorKey];
  if (element && sensorConfig && value !== undefined) {
    element.textContent = formatValue(value, sensorConfig.unit);
  } else if (element) {
    element.textContent = "--";
  }
}

export function resetLiveValues() {
  updateLiveValue("temperature", undefined);
  updateLiveValue("humidity", undefined);
  updateLiveValue("light_level", undefined);
}

export function updateConnectionStatus(status, message = "", isError = false) {
  const element = uiElements.connectionStatus;
  if (!element) return;

  element.textContent = message || status;
  element.style.color = isError ? "red" : "green";
}

export function displayError(containerElement, message, type = "error") {
  if (!containerElement) return;
  const errorDiv = document.createElement("div");
  errorDiv.textContent = message;
  errorDiv.style.color = type === "error" ? "red" : "orange";
  errorDiv.style.marginTop = "10px";
  containerElement.appendChild(errorDiv);
}

export function showCommandFeedback(data) {
  let message = `Command '${data.command}' Status: ${data.status}`;
  if (data.status === "error") {
    message = `Command '${data.command}' Status: Error${
      data.message ? ` - ${data.message}` : ""
    }`;
    alert(message);
  } else {
    console.log(message);
  }
}

export function getElement(key) {
  return uiElements[key] || null;
}

export function getDashboardChartContainer() {
  return uiElements.dashboardChartContainer;
}

uiElements.currentActuator = document.getElementById("current-actuator");
uiElements.currentActuatorSource = document.getElementById(
  "current-actuator-mode"
);

const actuatorStatusCard = document.querySelector(".actuator-status");
const actuatorStatus = document.getElementById("current-actuator");
const actuatorSource = document.getElementById("current-actuator-mode");

export function updateActuatorStatus(status, mode) {
  if (status.includes("LED")) {
    actuatorStatus.textContent = status.includes("ON")
      ? "LED turned on"
      : "LED turned off";
  }
  if (status.includes("BUZZER")) {
    actuatorStatus.textContent = status.includes("ON")
      ? "Buzzer turned on"
      : "Buzzer turned off";
  }
  if (status.includes("SERVO")) {
    actuatorStatus.textContent = status.includes("OPEN")
      ? "Window opened"
      : "Window closed";
  }
  actuatorSource.textContent = mode;

  actuatorStatusCard.classList.add("active");

  setTimeout(() => {
    actuatorStatusCard.classList.remove("active");
  }, 1000);
}

uiElements.servoStatus = document.getElementById("servo-status");
uiElements.ledStatus = document.getElementById("led-status");
uiElements.buzzerStatus = document.getElementById("buzzer-status");

export function updateSingleActuatorCard(actuator, state) {
  const element = uiElements[`${actuator.toLowerCase()}Status`];
  if (!element) return;

  if (actuator === "servo") {
    element.textContent =
      state === "OPEN" ? "Window is open" : "Window is closed";
  }
  if (actuator === "led") {
    element.textContent = state === "ON" ? "Light is ON" : "Light is OFF";
  }
  if (actuator === "buzzer") {
    element.textContent = state === "ON" ? "Alarm is ON" : "Alarm is OFF";
  }
}
