fetch("/api/config")
  .then((response) => response.json())
  .then((config) => {
    document.querySelector(".light-threshold .value").textContent =
      config.LIGHT_THRESHOLD;
    document.querySelector(".humidity-low-threshold .value").textContent =
      config.HUMIDITY_LOW_THRESHOLD;
    document.querySelector(".humidity-high-threshold .value").textContent =
      config.HUMIDITY_HIGH_THRESHOLD;
    document.querySelector(".temperature-high-threshold .value").textContent =
      config.TEMPERATURE_HIGH_THRESHOLD;

    document.querySelector(
      ".led-logic .condition .text"
    ).textContent = `Light level is below ${config.LIGHT_THRESHOLD} %`;
    document.querySelector(".led-logic .action .text").textContent =
      "Turn on LED, otherwise turn off";

    document.querySelector(
      ".window-logic .condition .text"
    ).textContent = `Humidity is below ${config.HUMIDITY_LOW_THRESHOLD}% or above ${config.HUMIDITY_HIGH_THRESHOLD}%`;
    document.querySelector(".window-logic .action .text").textContent =
      "Open window, otherwise close it";

    document.querySelector(
      ".buzzer-logic .condition .text"
    ).textContent = `Temperature is above ${config.TEMPERATURE_HIGH_THRESHOLD}°C`;
    document.querySelector(".buzzer-logic .action .text").textContent =
      "Turn on buzzer, otherwise turn off";
  });
