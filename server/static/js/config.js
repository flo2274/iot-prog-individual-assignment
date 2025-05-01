export const config = {
  api: {
    historyEndpoint: "/api/history",
  },
  socket: {
    events: {
      CONNECT: "connect",
      DISCONNECT: "disconnect",
      CONNECT_ERROR: "connect_error",
      SENSOR_UPDATE: "a", // Use 'a' as per the original example, change if needed
      SEND_COMMAND: "send_command",
      COMMAND_RESPONSE: "command_response",
    },
  },
  chart: {
    maxDataPoints: 50,
    margin: { top: 10, right: 20, bottom: 20, left: 30 },
    height: 150,
    updateDuration: 500, // ms for transitions
    sensors: {
      temperature: {
        title: "Temperatur (°C)",
        yDomain: [0, 40],
        color: "rgb(255, 99, 132)",
        elementId: "temperature",
        unit: "°C",
      },
      humidity: {
        title: "Luftfeuchtigkeit (%)",
        yDomain: [0, 100],
        color: "rgb(54, 162, 235)",
        elementId: "humidity",
        unit: "%",
      },
      light_level: {
        title: "Lichtlevel (lx)",
        yDomain: [0, 1000],
        color: "rgb(255, 205, 86)",
        elementId: "light",
        unit: "lx",
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
