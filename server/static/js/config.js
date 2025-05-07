export const config = {
  api: {
    historyEndpoint: "/api/history",
  },
  socket: {
    events: {
      CONNECT: "connect",
      DISCONNECT: "disconnect",
      CONNECT_ERROR: "connect_error",
      SENSOR_UPDATE: "sensor_update",
      SEND_COMMAND: "send_command",
      COMMAND_RESPONSE: "command_response",
    },
  },
  chart: {
    maxDataPoints: 50,
    margin: { top: 10, right: 20, bottom: 20, left: 30 },
    height: 150,
    updateDuration: 500,
    sensors: {
      temperature: {
        title: "Temperature (°C)",
        yDomain: [0, 40],
        color: "rgb(255, 99, 132)",
        elementId: "temperature",
        unit: "°C",
      },
      humidity: {
        title: "Humidity (%)",
        yDomain: [0, 100],
        color: "rgb(54, 162, 235)",
        elementId: "humidity",
        unit: "%",
      },
      light_level: {
        title: "Light Level (%)",
        yDomain: [0, 100],
        color: "rgb(255, 205, 86)",
        elementId: "light",
        unit: "%",
      },
    },
  },
  ui: {
    dashboardChartContainerId: "sensorDashboardChartsContainer",
    chartsFlexContainerSelector:
      "#sensorDashboardChartsContainer .charts-flex-container",
    connectionStatusId: "connection-status",
    controlButtonSelector: ".controls button[data-command]",
  },
};
