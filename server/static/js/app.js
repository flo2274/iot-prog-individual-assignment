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

    // 1. Initialize UI Updater elements (already done via import)

    // 2. Initialize Charts
    const chartsInitialized = initializeCharts();

    // 3. Initialize Socket Manager
    const socket = socketManager.initialize();

    if (!socket) {
      updateConnectionStatus("SocketIO Fehler", "Client nicht geladen.", true);
      return; // Stop initialization if socket failed
    }

    // 4. Setup Socket Event Listeners
    socketManager.on(config.socket.events.CONNECT, () => {
      updateConnectionStatus("Verbunden", "Verbunden", false);
      if (chartsInitialized) {
        fetchInitialData(); // Fetch history data only after connection
      }
    });

    socketManager.on(config.socket.events.DISCONNECT, () => {
      updateConnectionStatus(
        "Verbindung getrennt!",
        "Verbindung getrennt!",
        true
      );
      resetLiveValues();
      // Optionally clear charts or show overlay
      // updateCharts(null); // Example to clear charts
    });

    socketManager.on(config.socket.events.CONNECT_ERROR, (err) => {
      updateConnectionStatus(
        "Verbindungsfehler",
        `Fehler: ${err.message}`,
        true
      );
    });

    socketManager.on(config.socket.events.SENSOR_UPDATE, (data) => {
      console.log("-> Sensor-Update received:", data);
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

      // Update Aktuator-Anzeige
      const actuatorName = data.command; // z. B. "LED_ON"
      const source = data.source || "button"; // Default: button
      updateActuatorStatus(actuatorName, source);
    });

    // 5. Setup Control Button Listeners
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
