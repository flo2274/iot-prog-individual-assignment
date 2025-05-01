import { config } from "./config.js";
import { displayError } from "./uiUpdater.js";

export async function initializeHistoryChartD3() {
  const container = document.getElementById("sensorHistoryChart");

  if (!container) {
    console.error("Chart container 'sensorHistoryChart' not found.");
    return false;
  }

  try {
    console.log("Fetching historical sensor data...");
    const fetchLimit = 1000;
    const response = await fetch(
      `${config.api.historyEndpoint}?limit=${fetchLimit}`
    );

    if (!response.ok) {
      const errorResponse = await response.json().catch(() => ({}));
      const errorMessage =
        errorResponse.error || `HTTP error! status: ${response.status}`;
      throw new Error(`Fehler beim Abrufen der Verlaufsdaten: ${errorMessage}`);
    }

    const historyData = await response.json();
    console.log("Historical data fetched:", historyData);

    if (!Array.isArray(historyData) || historyData.length === 0) {
      displayError(
        container.parentElement,
        "Keine Verlaufsdaten gefunden.",
        "warning"
      );
      return true;
    }

    d3.select("#sensorHistoryChart").selectAll("svg").remove();

    const margin = { top: 20, right: 60, bottom: 50, left: 60 };
    const width = container.clientWidth - margin.left - margin.right;
    const height = 300; // height per chart

    // Hier definieren wir explizit die Schlüssel, die wir erwarten
    const sensorKeys = ["temperature", "light_level", "humidity"];

    // Sicherstellen, dass alle Sensordaten vorhanden sind und in der Konfiguration korrekt abgeglichen werden
    const series = sensorKeys
      .map((key) => {
        const sensorConfig = config.chart.sensors[key];
        const data = historyData
          .map((d) => {
            const date = new Date(d.created_at);
            const value = d[key]; // Direkt auf den Schlüssel zugreifen
            return value !== undefined &&
              !isNaN(date.getTime()) &&
              !isNaN(value)
              ? { date, value }
              : null;
          })
          .filter((d) => d !== null);

        return {
          key,
          label:
            sensorConfig && sensorConfig.label !== undefined
              ? sensorConfig.label
              : key, // <-- Geänderte Zeile
          unit: sensorConfig ? sensorConfig.unit : "",
          color: sensorConfig ? sensorConfig.color : "gray",
          data,
        };
      })
      .filter((s) => s.data.length > 0);

    if (series.length === 0) {
      displayError(
        container.parentElement,
        "Gültige Verlaufsdaten für Sensoren nicht gefunden.",
        "warning"
      );
      return true;
    }

    const allDates = series.flatMap((s) => s.data.map((d) => d.date));
    const x = d3.scaleTime().domain(d3.extent(allDates)).range([0, width]);

    series.forEach((s, idx) => {
      const y = d3
        .scaleLinear()
        .domain([0, d3.max(s.data, (d) => d.value)])
        .nice()
        .range([height, 0]);

      const svg = d3
        .select("#sensorHistoryChart")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

      // X axis (only on bottom chart)
      if (idx === series.length - 1) {
        svg
          .append("g")
          .attr("transform", `translate(0,${height})`)
          .call(
            d3
              .axisBottom(x)
              .ticks(width / 80)
              .tickFormat(d3.timeFormat("%H:%M"))
          )
          .append("text")
          .attr("x", width / 2)
          .attr("y", 35)
          .style("text-anchor", "middle")
          .style("fill", "black")
          .text("Zeitpunkt");
      } else {
        svg
          .append("g")
          .attr("transform", `translate(0,${height})`)
          .call(d3.axisBottom(x).ticks(0).tickSize(0))
          .selectAll("text")
          .remove();
      }

      // Y axis
      svg.append("g").call(d3.axisLeft(y));
      svg
        .append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", -margin.left + 15)
        .attr("x", -height / 2)
        .style("text-anchor", "middle")
        .style("fill", "black")
        .text(`${s.label} (${s.unit})`);

      // Line
      const line = d3
        .line()
        .x((d) => x(d.date))
        .y((d) => y(d.value))
        .curve(d3.curveMonotoneX);

      svg
        .append("path")
        .datum(s.data)
        .attr("fill", "none")
        .attr("stroke", s.color)
        .attr("stroke-width", 1.5)
        .attr("d", line);

      // Tooltip
      const focus = svg.append("g").style("display", "none");

      focus.append("circle").attr("r", 4.5).style("fill", s.color);
      focus
        .append("rect")
        .attr("class", "tooltip")
        .attr("width", 80)
        .attr("height", 30)
        .attr("x", 10)
        .attr("y", -22)
        .attr("rx", 4)
        .attr("ry", 4)
        .style("fill", "white")
        .style("stroke", s.color)
        .style("opacity", 0.9);

      focus
        .append("text")
        .attr("x", 18)
        .attr("y", -2)
        .attr("font-size", "12px");

      svg
        .append("rect")
        .attr("class", "overlay")
        .attr("width", width)
        .attr("height", height)
        .style("fill", "none")
        .style("pointer-events", "all")
        .on("mouseover", () => focus.style("display", null))
        .on("mouseout", () => focus.style("display", "none"))
        .on("mousemove", (event) => {
          const bisectDate = d3.bisector((d) => d.date).left;
          const x0 = x.invert(d3.pointer(event)[0]);
          const i = bisectDate(s.data, x0, 1);
          const d0 = s.data[i - 1];
          const d1 = s.data[i];
          const d = !d1 ? d0 : x0 - d0.date > d1.date - x0 ? d1 : d0;
          focus.attr("transform", `translate(${x(d.date)},${y(d.value)})`);
          focus
            .select("text")
            .text(`${d.value} @ ${d3.timeFormat("%H:%M")(d.date)}`);
        });
    });

    // Legend
    const legend = d3
      .select("#sensorHistoryChart")
      .insert("div", ":first-child")
      .style("display", "flex")
      .style("gap", "15px")
      .style("margin-bottom", "5px");

    series.forEach((s) => {
      legend
        .append("div")
        .style("display", "flex")
        .style("align-items", "center")
        .html(
          `<span style="width:12px;height:12px;background:${s.color};display:inline-block;margin-right:5px"></span>${s.label}`
        );
    });

    console.log("D3 stacked history charts initialized successfully.");
    return true;
  } catch (error) {
    console.error("Error initializing D3 history chart:", error);
    displayError(
      container.parentElement,
      `Fehler beim Laden des Verlaufs: ${error.message}`,
      "error"
    );
    return false;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("sensorHistoryChart")) {
    console.log("History page detected. Initializing D3 history chart.");
    initializeHistoryChartD3();
  }
});
