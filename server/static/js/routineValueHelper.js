let currentConfig = {};

fetch("/api/config")
  .then((response) => response.json())
  .then((config) => {
    currentConfig = config;
    document.querySelector(".light-threshold .value").value =
      config.LIGHT_THRESHOLD;
    document.querySelector(".humidity-low-threshold .value").value =
      config.HUMIDITY_LOW_THRESHOLD;
    document.querySelector(".humidity-high-threshold .value").value =
      config.HUMIDITY_HIGH_THRESHOLD;
    document.querySelector(".temperature-high-threshold .value").value =
      config.TEMPERATURE_HIGH_THRESHOLD;

    document.querySelector(
      ".led-logic .condition .text"
    ).textContent = `Light level is below ${config.LIGHT_THRESHOLD} %`;
    document.querySelector(".led-logic .action .text").textContent =
      "Turn off light, otherwise turn on";

    document.querySelector(
      ".window-logic .condition .text"
    ).textContent = `Humidity is below ${config.HUMIDITY_LOW_THRESHOLD}% or above ${config.HUMIDITY_HIGH_THRESHOLD}%`;
    document.querySelector(".window-logic .action .text").textContent =
      "Open window, otherwise close it";

    document.querySelector(
      ".buzzer-logic .condition .text"
    ).textContent = `Temperature is above ${config.TEMPERATURE_HIGH_THRESHOLD}°C`;
    document.querySelector(".buzzer-logic .action .text").textContent =
      "Turn on alarm, otherwise turn off";
  });

document.getElementById("save-thresholds").addEventListener("click", () => {
  const newConfig = {
    LIGHT_THRESHOLD: parseInt(
      document.querySelector(".light-threshold .value").value,
      10
    ),
    HUMIDITY_LOW_THRESHOLD: parseInt(
      document.querySelector(".humidity-low-threshold .value").value,
      10
    ),
    HUMIDITY_HIGH_THRESHOLD: parseInt(
      document.querySelector(".humidity-high-threshold .value").value,
      10
    ),
    TEMPERATURE_HIGH_THRESHOLD: parseInt(
      document.querySelector(".temperature-high-threshold .value").value,
      10
    ),
  };

  updateThresholds(newConfig);
});

function updateThresholds(newConfig) {
  fetch("/api/config", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(newConfig),
  })
    .then((response) => response.json())
    .then((result) => {
      console.log("Thresholds updated:", result);
      alert("Thresholds saved successfully!");
    })
    .catch((error) => {
      console.error("Error updating thresholds:", error);
      alert("Error saving thresholds.");
    });
}
