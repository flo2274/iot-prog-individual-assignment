import { config } from "./config.js";
import { displayError } from "./uiUpdater.js";

let chartInstances = {};
let xScale;
let chartContainer;
let flexContainer;
let chartWidth, innerChartWidth, innerChartHeight;

// Calculate chart sizes
function setupChartDimensions() {
  if (!chartContainer) return false;

  const containerWidth = chartContainer.clientWidth;
  chartWidth =
    containerWidth / Object.keys(config.chart.sensors).length -
    config.chart.margin.left -
    config.chart.margin.right -
    15;

  chartWidth = Math.max(chartWidth, 250);

  innerChartWidth =
    chartWidth - config.chart.margin.left - config.chart.margin.right;
  innerChartHeight =
    config.chart.height - config.chart.margin.top - config.chart.margin.bottom;
  return true;
}

// Create single chart element
function createSingleChart(sensorKey, sensorConfig) {
  const chartDiv = flexContainer
    .append("div")
    .attr("class", "dashboard-chart")
    .style(
      "width",
      `${chartWidth + config.chart.margin.left + config.chart.margin.right}px`
    );

  chartDiv.append("div").attr("class", "chart-title").text(sensorConfig.title);

  const svg = chartDiv
    .append("svg")
    .attr(
      "width",
      chartWidth + config.chart.margin.left + config.chart.margin.right
    )
    .attr("height", config.chart.height);

  const g = svg
    .append("g")
    .attr(
      "transform",
      `translate(${config.chart.margin.left},${config.chart.margin.top})`
    );

  const yScale = d3
    .scaleLinear()
    .range([innerChartHeight, 0])
    .domain(sensorConfig.yDomain);

  const yAxis = d3.axisLeft(yScale).ticks(5);
  const gyAxis = g.append("g").attr("class", "y axis");

  const xAxis = d3
    .axisBottom(xScale)
    .ticks(d3.timeMinute.every(5))
    .tickFormat(d3.timeFormat("%H:%M"));
  const gxAxis = g
    .append("g")
    .attr("class", "x axis")
    .attr("transform", `translate(0,${innerChartHeight})`);

  const line = d3
    .line()
    .x((d) => xScale(d.date))
    .y((d) => yScale(d.value))
    .curve(d3.curveMonotoneX);

  const path = g
    .append("path")
    .attr("class", "line")
    .attr("fill", "none")
    .attr("stroke", sensorConfig.color)
    .attr("stroke-width", 1.5);

  return {
    sensorKey,
    yScale,
    yAxis,
    gyAxis,
    xAxis,
    gxAxis,
    line,
    path,
    data: [],
  };
}

// Init all charts
export function initializeCharts() {
  chartContainer = document.getElementById(config.ui.dashboardChartContainerId);
  if (!chartContainer || typeof d3 === "undefined") {
    console.warn("D3 or chart container not found.");
    if (chartContainer) {
      displayError(
        chartContainer,
        "Chart could not be loaded (D3.js missing or container not found).",
        "warning"
      );
    }
    return false;
  }

  flexContainer = d3.select(config.ui.chartsFlexContainerSelector);
  if (flexContainer.empty()) {
    console.error(
      `Chart flex container '${config.ui.chartsFlexContainerSelector}' not found.`
    );
    displayError(
      chartContainer,
      `Layout container ${config.ui.chartsFlexContainerSelector} not found.`,
      "error"
    );
    return false;
  }

  flexContainer
    .style("display", "flex")
    .style("flex-wrap", "wrap")
    .style("gap", "10px");

  if (!setupChartDimensions()) {
    displayError(chartContainer, "Chart container not found.", "error");
    return false;
  }

  xScale = d3.scaleTime().range([0, innerChartWidth]);

  for (const [key, sensorConfig] of Object.entries(config.chart.sensors)) {
    chartInstances[key] = createSingleChart(key, sensorConfig);
  }

  // Handle window resize
  window.addEventListener("resize", () => {
    if (setupChartDimensions()) {
      xScale.range([0, innerChartWidth]);
      Object.values(chartInstances).forEach((instance) => {
        instance.yScale.range([innerChartHeight, 0]);
        instance.gxAxis.attr("transform", `translate(0,${innerChartHeight})`);
        instance.path.attr("d", instance.line);
      });
      redrawAllCharts(false);
    }
  });

  return true;
}

// Redraw all charts
function redrawAllCharts(useTransition = true) {
  const allData = Object.values(chartInstances).flatMap((inst) => inst.data);
  if (allData.length > 0) {
    xScale.domain(d3.extent(allData, (d) => d.date));
  } else {
    xScale.domain([new Date(), new Date()]);
  }

  for (const instance of Object.values(chartInstances)) {
    const transition = useTransition
      ? d3.transition().duration(config.chart.updateDuration)
      : d3.transition().duration(0);

    instance.gxAxis.transition(transition).call(instance.xAxis);
    instance.gyAxis.transition(transition).call(instance.yAxis);
    instance.path
      .datum(instance.data)
      .transition(transition)
      .attr("d", instance.line);
  }

  console.log(
    `Charts updated. Data points: ${Object.entries(chartInstances)
      .map(([key, inst]) => `${key}=${inst.data.length}`)
      .join(", ")}`
  );
}

// Add or update chart data
export function updateCharts(newDataPoint) {
  if (!chartContainer || flexContainer.empty()) return;

  let dataAdded = false;
  if (newDataPoint) {
    const parsedDate = new Date(newDataPoint.created_at || Date.now());

    for (const [key, instance] of Object.entries(chartInstances)) {
      const value = +newDataPoint[key];
      if (!isNaN(value)) {
        instance.data.push({ date: parsedDate, value: value });
        if (instance.data.length > config.chart.maxDataPoints) {
          instance.data.shift();
        }
        dataAdded = true;
      }
    }
  }

  if (dataAdded || !newDataPoint) {
    redrawAllCharts(true);
  }
}

// Fetch initial chart data
export async function fetchInitialData() {
  if (!chartContainer || flexContainer.empty()) return;

  try {
    console.log(
      `Fetching last ${config.chart.maxDataPoints} history data points...`
    );
    const response = await fetch(
      `${config.api.historyEndpoint}?limit=${config.chart.maxDataPoints}`
    );
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const initialData = await response.json();
    console.log("Initial history data fetched:", initialData);

    if (initialData.error) {
      throw new Error(initialData.error);
    }

    if (!Array.isArray(initialData) || initialData.length === 0) {
      console.warn("Fetched empty or invalid initial history data.");
      displayError(
        flexContainer.node(),
        "No historical data found for initial chart.",
        "warning"
      );
      updateCharts(null);
      return;
    }

    const processedData = {};
    Object.keys(chartInstances).forEach((key) => (processedData[key] = []));

    initialData.forEach((d) => {
      const date = new Date(d.created_at);
      for (const [key, instance] of Object.entries(chartInstances)) {
        const value = +d[key];
        if (!isNaN(value)) {
          processedData[key].push({ date, value });
        }
      }
    });

    for (const [key, dataArray] of Object.entries(processedData)) {
      chartInstances[key].data = dataArray.slice(-config.chart.maxDataPoints);
    }

    updateCharts(null);
  } catch (error) {
    console.error("Error fetching initial history data:", error);
    displayError(
      flexContainer.node(),
      `Error loading initial data: ${error.message}`,
      "error"
    );
  }
}
