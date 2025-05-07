import { config } from "./config.js";
import { socketManager } from "./socketManager.js";
import {
  updateLiveValue,
  resetLiveValues,
  updateConnectionStatus,
  showCommandFeedback,
  getElement,
  getDashboardChartContainer,
  updateActuatorStatus,
  updateSingleActuatorCard,
} from "./uiUpdater.js";
import {
  initializeCharts,
  updateCharts,
  fetchInitialData,
} from "./dashboardChart.js";

document.addEventListener("DOMContentLoaded", () => {
  const dashboardChartContainer = getDashboardChartContainer();
  const isIndexPage = !!getElement("temperature") || !!dashboardChartContainer;

  if (isIndexPage) {
    console.log("App.js: Initializing index page modules.");

    // init charts
    const chartsInitialized = initializeCharts();

    // init socket
    const socket = socketManager.initialize();
    if (!socket) {
      updateConnectionStatus("SocketIO Error", "Client not loaded.", true);
      return;
    }

    // socket events
    socketManager.on(config.socket.events.CONNECT, () => {
      updateConnectionStatus("Connected", "Connected", false);
    });

    socketManager.on(config.socket.events.DISCONNECT, () => {
      updateConnectionStatus("Connection lost!", "Connection lost!", true);
      resetLiveValues();
    });

    socketManager.on(config.socket.events.CONNECT_ERROR, (err) => {
      updateConnectionStatus("Connection error", `Error: ${err.message}`, true);
    });

    socketManager.on(config.socket.events.SENSOR_UPDATE, (data) => {
      console.log("-> Sensor update received:", data);
      Object.keys(config.chart.sensors).forEach((key) => {
        if (data[key] !== undefined) {
          updateLiveValue(key, data[key]);
        }
      });
      if (chartsInitialized) {
        updateCharts(data);
      }
    });

    socketManager.on(config.socket.events.COMMAND_RESPONSE, (data) => {
      console.log("Command response received:", data);
      showCommandFeedback(data);

      const actuatorName = data.command;
      const mode = data.mode;
      updateActuatorStatus(actuatorName, mode);

      if (actuatorName.startsWith("LED")) {
        updateSingleActuatorCard(
          "led",
          actuatorName.includes("ON") ? "ON" : "OFF"
        );
      } else if (actuatorName.startsWith("BUZZER")) {
        updateSingleActuatorCard(
          "buzzer",
          actuatorName.includes("ON") ? "ON" : "OFF"
        );
      } else if (actuatorName.startsWith("SERVO")) {
        updateSingleActuatorCard(
          "servo",
          actuatorName.includes("OPEN") ? "OPEN" : "CLOSE"
        );
      }
    });

    // control buttons
    const controlButtons = document.querySelectorAll(
      config.ui.controlButtonSelector
    );
    if (controlButtons.length > 0) {
      controlButtons.forEach((button) => {
        button.addEventListener("click", () => {
          const command = button.getAttribute("data-command");
          if (command) {
            console.log(`Sending command: ${command}`);
            socketManager.emit(config.socket.events.SEND_COMMAND, { command });
          }
        });
      });
    } else {
      console.warn("No control buttons found.");
    }
  } else {
    console.log(
      "App.js: Not on index page. Skipping index-specific initialization."
    );
  }
});
