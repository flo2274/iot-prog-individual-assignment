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
    alert(message); // Show errors prominently
  } else {
    console.log(message); // Log success to console
    // Optionally: Show temporary success message in UI
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
  "current-actuator-source"
);

const actuatorStatusCard = document.querySelector(".actuator-status");
const actuatorStatus = document.getElementById("current-actuator");
const actuatorSource = document.getElementById("current-actuator-source");

// Funktion, die den Status ändert und die Animationen auslöst
export function updateActuatorStatus(status, source) {
  actuatorStatus.textContent = status;
  actuatorSource.textContent = source;

  // Animation aktivieren
  actuatorStatusCard.classList.add("active");

  // Nach einer Sekunde Animation entfernen (optional)
  setTimeout(() => {
    actuatorStatusCard.classList.remove("active");
  }, 1000); // Dauer der Animation
}
