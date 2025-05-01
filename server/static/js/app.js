// --- Code für die Index-Seite (Dashboard mit Live-Werten & D3 Chart) ---
// Die Variable isIndexPage prüft jetzt auch auf den neuen Chart Container
const dashboardChartContainer = document.getElementById(
  "sensorDashboardChartsContainer"
);
// Prüfen auf Live-Werte Elemente ODER den Chart Container, um sicherzustellen, dass wir auf der Index-Seite sind
const isIndexPage =
  !!document.getElementById("temperature") || !!dashboardChartContainer;
// const isHistoryPage = !!document.getElementById("sensorHistoryChart"); // Wird in der History-Seite behandelt

// Stelle sicher, dass das SocketIO Objekt global verfügbar ist (normalerweise durch das <script> Tag im HTML)
const socket = io(); // Beispiel, falls es nicht global deklariert ist

if (isIndexPage) {
  console.log("App.js: Betrete Index-Seite Block (Live Werte & D3 Chart).");

  // Elemente für Live-Werte und Status abrufen
  const tempElement = document.getElementById("temperature");
  const humElement = document.getElementById("humidity");
  const lightElement = document.getElementById("light");
  const statusElement = document.getElementById("connection-status"); // Element für Verbindungsstatus
  const controlButtons = document.querySelectorAll(
    ".controls button[data-command]"
  );

  if (socket) {
    // Stelle sicher, dass das Socket-Objekt existiert
    socket.on("connect", () => {
      console.log("Verbunden mit dem Server!");
      if (statusElement) {
        statusElement.textContent = "Verbunden";
        statusElement.style.color = "green";
      }
      // Initialen Status der Sensoren abfragen, falls nötig, nachdem die Verbindung hergestellt ist
      // socket.emit('request_initial_sensor_data'); // Beispiel, falls der Server dies unterstützt
    });

    socket.on("disconnect", () => {
      console.log("Verbindung zum Server getrennt!");
      if (statusElement) {
        statusElement.textContent = "Verbindung getrennt!";
        statusElement.style.color = "red";
      }
      // Optional: UI-Elemente deaktivieren oder Werte zurücksetzen bei Trennung
      if (isIndexPage) {
        // Setze Live-Werte auf Standard zurück bei Trennung
        if (tempElement) tempElement.textContent = "--";
        if (humElement) humElement.textContent = "--";
        if (lightElement) lightElement.textContent = "--";
        // Hier könnten auch die Charts geleert oder eine Nachricht angezeigt werden
        // tempData = []; humData = []; lightData = [];
        // updateCharts(null); // Charts mit leeren Daten neu zeichnen
      }
    });

    socket.on("connect_error", (err) => {
      console.error("Verbindungsfehler:", err);
      if (statusElement) {
        statusElement.textContent = `Verbindungsfehler: ${err.message}`;
        statusElement.style.color = "red";
      }
    });
  } else {
    console.error("SocketIO client object 'socket' is not defined.");
    if (statusElement) {
      statusElement.textContent = "SocketIO Fehler: Client nicht geladen.";
      statusElement.style.color = "red";
    }
  }
  // --- Ende SocketIO Connection Status Handling ---

  // --- D3 Chart Setup ---
  // Stelle sicher, dass der Chart Container existiert, bevor D3 initialisiert wird
  if (dashboardChartContainer && typeof d3 !== "undefined") {
    console.log("D3 Chart Setup wird initialisiert.");
    const maxDataPoints = 50; // Anzahl der Datenpunkte im Live-Chart
    const chartMargin = { top: 10, right: 20, bottom: 20, left: 30 }; // Kleinere Margins für Dashboard
    // Passe die Breite an den Container an
    const chartWidth =
      dashboardChartContainer.clientWidth / 3 -
      chartMargin.left -
      chartMargin.right -
      20; // Teile den Container in 3 Spalten, ziehe Margins und etwas Puffer ab
    const chartHeight = 150; // Höhe jedes kleinen Charts (anpassbar)
    const innerChartWidth = chartWidth - chartMargin.left - chartMargin.right;
    const innerChartHeight = chartHeight - chartMargin.top - chartMargin.bottom;

    // Datensätze für die einzelnen Metriken
    let tempData = [];
    let humData = [];
    let lightData = [];

    // Container auswählen
    const dashboardChartsD3 = d3.select(dashboardChartContainer);
    dashboardChartsD3
      .style("display", "flex")
      .style("flex-wrap", "wrap")
      .style("gap", "10px"); // Flexbox für Layout

    // SVG Elemente für jedes Chart erstellen und gruppieren
    const svgTemp = dashboardChartsD3
      .append("div")
      .attr("class", "dashboard-chart")
      .style("width", `${chartWidth + chartMargin.left + chartMargin.right}px`) // Setze Breite des Containers
      .append("div")
      .attr("class", "chart-title")
      .text("Temperatur (°C)")
      .select(function () {
        return this.parentNode;
      })
      .append("svg")
      .attr("width", chartWidth + chartMargin.left + chartMargin.right) // SVG volle Breite
      .attr("height", chartHeight)
      .append("g")
      .attr("transform", `translate(${chartMargin.left},${chartMargin.top})`);

    const svgHum = dashboardChartsD3
      .append("div")
      .attr("class", "dashboard-chart")
      .style("width", `${chartWidth + chartMargin.left + chartMargin.right}px`) // Setze Breite des Containers
      .append("div")
      .attr("class", "chart-title")
      .text("Luftfeuchtigkeit (%)")
      .select(function () {
        return this.parentNode;
      })
      .append("svg")
      .attr("width", chartWidth + chartMargin.left + chartMargin.right) // SVG volle Breite
      .attr("height", chartHeight)
      .append("g")
      .attr("transform", `translate(${chartMargin.left},${chartMargin.top})`);

    const svgLight = dashboardChartsD3
      .append("div")
      .attr("class", "dashboard-chart")
      .style("width", `${chartWidth + chartMargin.left + chartMargin.right}px`) // Setze Breite des Containers
      .append("div")
      .attr("class", "chart-title")
      .text("Lichtlevel (lx)") // Einheit hinzugefügt
      .select(function () {
        return this.parentNode;
      })
      .append("svg")
      .attr("width", chartWidth + chartMargin.left + chartMargin.right) // SVG volle Breite
      .attr("height", chartHeight)
      .append("g")
      .attr("transform", `translate(${chartMargin.left},${chartMargin.top})`);

    // Skalen definieren (Time für X, Linear für Y - eine Y-Skala pro Chart)
    const xScale = d3.scaleTime().range([0, innerChartWidth]);

    const yScaleTemp = d3
      .scaleLinear()
      .range([innerChartHeight, 0])
      .domain([0, 40]); // Beispiel-Domain für Temperatur (0-40 °C)
    const yScaleHum = d3
      .scaleLinear()
      .range([innerChartHeight, 0])
      .domain([0, 100]); // Beispiel-Domain für Luftfeuchtigkeit (0-100 %)
    const yScaleLight = d3
      .scaleLinear()
      .range([innerChartHeight, 0])
      .domain([0, 1000]); // Beispiel-Domain für Lichtlevel (0-1000 lx)

    // Achsen definieren
    const xAxis = d3
      .axisBottom(xScale)
      .ticks(d3.timeMinute.every(5)) // Ticks alle 5 Minuten
      .tickFormat(d3.timeFormat("%H:%M"));

    const yAxisTemp = d3.axisLeft(yScaleTemp).ticks(5);
    const yAxisHum = d3.axisLeft(yScaleHum).ticks(5);
    const yAxisLight = d3.axisLeft(yScaleLight).ticks(5);

    // Achsen zum SVG hinzufügen (werden später aktualisiert)
    const gxAxisTemp = svgTemp
      .append("g")
      .attr("class", "x axis")
      .attr("transform", `translate(0,${innerChartHeight})`);
    const gyAxisTemp = svgTemp.append("g").attr("class", "y axis");

    const gxAxisHum = svgHum
      .append("g")
      .attr("class", "x axis")
      .attr("transform", `translate(0,${innerChartHeight})`);
    const gyAxisHum = svgHum.append("g").attr("class", "y axis");

    const gxAxisLight = svgLight
      .append("g")
      .attr("class", "x axis")
      .attr("transform", `translate(0,${innerChartHeight})`);
    const gyAxisLight = svgLight.append("g").attr("class", "y axis");

    // Line Generators definieren
    const lineTemp = d3
      .line()
      .x((d) => xScale(d.date))
      .y((d) => yScaleTemp(d.value))
      .curve(d3.curveMonotoneX);

    const lineHum = d3
      .line()
      .x((d) => xScale(d.date))
      .y((d) => yScaleHum(d.value))
      .curve(d3.curveMonotoneX);

    const lineLight = d3
      .line()
      .x((d) => xScale(d.date))
      .y((d) => yScaleLight(d.value))
      .curve(d3.curveMonotoneX);

    // Pfade für die Linien zum SVG hinzufügen (werden später mit Daten gefüllt)
    const pathTemp = svgTemp
      .append("path")
      .attr("class", "line")
      .attr("fill", "none")
      .attr("stroke", "rgb(255, 99, 132)")
      .attr("stroke-width", 1.5);
    const pathHum = svgHum
      .append("path")
      .attr("class", "line")
      .attr("fill", "none")
      .attr("stroke", "rgb(54, 162, 235)")
      .attr("stroke-width", 1.5);
    const pathLight = svgLight
      .append("path")
      .attr("class", "line")
      .attr("fill", "none")
      .attr("stroke", "rgb(255, 205, 86)")
      .attr("stroke-width", 1.5);

    // Funktion zum Aktualisieren der Charts
    function updateCharts(newDataPoint) {
      if (newDataPoint) {
        // Neuen Datenpunkt hinzufügen und ältesten entfernen, falls Limit erreicht
        const parsedPoint = {
          date: new Date(newDataPoint.created_at || Date.now()), // Nutze created_at oder aktuelle Zeit
          temperature: +newDataPoint.temperature,
          humidity: +newDataPoint.humidity,
          light_level: +newDataPoint.light_level,
        };

        // Daten zu den Arrays hinzufügen, ungültige Werte filtern
        if (!isNaN(parsedPoint.temperature))
          tempData.push({
            date: parsedPoint.date,
            value: parsedPoint.temperature,
          });
        if (!isNaN(parsedPoint.humidity))
          humData.push({ date: parsedPoint.date, value: parsedPoint.humidity });
        if (!isNaN(parsedPoint.light_level))
          lightData.push({
            date: parsedPoint.date,
            value: parsedPoint.light_level,
          });

        // Datensätze auf maxDataPoints begrenzen
        if (tempData.length > maxDataPoints) tempData.shift();
        if (humData.length > maxDataPoints) humData.shift();
        if (lightData.length > maxDataPoints) lightData.shift();
      }

      // Domains der Skalen basierend auf den aktuellen Daten aktualisieren
      // Stelle sicher, dass Daten vorhanden sind, bevor die Domains gesetzt werden
      if (tempData.length > 0) {
        xScale.domain(d3.extent(tempData, (d) => d.date)); // X-Achse (Zeit) ist gleich für alle
        yScaleTemp.domain(d3.extent(tempData, (d) => d.value));
      }
      if (humData.length > 0) {
        yScaleHum.domain(d3.extent(humData, (d) => d.value));
      }
      if (lightData.length > 0) {
        yScaleLight.domain(d3.extent(lightData, (d) => d.value));
      }

      // Achsen neu zeichnen (mit Übergang für sanftere Bewegung)
      gxAxisTemp.transition().duration(500).call(xAxis);
      gyAxisTemp.transition().duration(500).call(yAxisTemp);

      gxAxisHum.transition().duration(500).call(xAxis);
      gyAxisHum.transition().duration(500).call(yAxisHum);

      gxAxisLight.transition().duration(500).call(xAxis);
      gyAxisLight.transition().duration(500).call(yAxisLight);

      // Linienpfade mit den neuen Daten neu zeichnen (mit Übergang)
      pathTemp.datum(tempData).transition().duration(500).attr("d", lineTemp);
      pathHum.datum(humData).transition().duration(500).attr("d", lineHum);
      pathLight
        .datum(lightData)
        .transition()
        .duration(500)
        .attr("d", lineLight);

      console.log(
        `Charts updated. Data points: Temp=${tempData.length}, Hum=${humData.length}, Light=${lightData.length}`
      );
    }

    // --- Initiales Laden der letzten Datenpunkte ---
    // Hole die letzten N Datenpunkte beim Laden der Seite
    fetch(`/api/history?limit=${maxDataPoints}`)
      .then((response) => {
        console.log(
          `Fetching last ${maxDataPoints} history data points for initial chart...`
        );
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then((initialData) => {
        console.log("Initial history data fetched:", initialData);
        if (initialData.error) {
          console.error(
            "Error fetching initial history data:",
            initialData.error
          );
          // Optional: Fehlermeldung anzeigen
          if (dashboardChartsD3) {
            // Check if container exists before appending
            dashboardChartsD3
              .append("div")
              .text(`Fehler beim Laden der Initialdaten: ${initialData.error}`)
              .style("color", "red");
          }
          return;
        }

        if (!Array.isArray(initialData) || initialData.length === 0) {
          console.warn(
            "Fetched empty initial history data. Chart will be empty."
          );
          if (dashboardChartsD3) {
            // Check if container exists before appending
            dashboardChartsD3
              .append("div")
              .text("Keine Verlaufsdaten für Initial-Chart gefunden.")
              .style("color", "orange");
          }
          // Trotzdem leere Charts zeichnen, falls Daten später via SocketIO kommen
          updateCharts(null); // Ruft updateCharts mit leeren Daten auf
          return;
        }

        // Initialdaten verarbeiten und Parsen
        const parsedInitialData = initialData
          .map((d) => ({
            date: new Date(d.created_at),
            temperature: +d.temperature,
            humidity: +d.humidity,
            light_level: +d.light_level,
          }))
          .filter(
            (d) =>
              !isNaN(d.temperature) &&
              !isNaN(d.humidity) &&
              !isNaN(d.light_level) // Alle invaliden Punkte filtern
          );

        // Initialen Datensatz befüllen
        tempData = parsedInitialData.map((d) => ({
          date: d.date,
          value: d.temperature,
        }));
        humData = parsedInitialData.map((d) => ({
          date: d.date,
          value: d.humidity,
        }));
        lightData = parsedInitialData.map((d) => ({
          date: d.date,
          value: d.light_level,
        }));

        // Initiales Chart zeichnen
        updateCharts(null); // Ruft updateCharts mit den befüllten Daten auf
      })
      .catch((error) => {
        console.error("Error fetching initial history data:", error);
        if (dashboardChartsD3) {
          // Check if container exists before appending
          dashboardChartsD3
            .append("div")
            .text(`Fehler beim Laden der Initialdaten: ${error}`)
            .style("color", "red");
        }
      });

    // --- Event-Listener für eingehende SocketIO Sensor-Updates ---
    // Dieser Handler empfängt NEUE Datenpunkte live
    // Er wurde zuvor als 'a' getestet, ändere 'a' zurück zu 'update_sensors' oder behalte 'a' bei, je nach deinem Python-Code
    if (socket) {
      // Stelle sicher, dass das Socket-Objekt existiert
      socket.on("a", (data) => {
        // <<< Achte darauf, dass der Event-Name hier mit deinem Python-Code übereinstimmt ('a' oder 'update_sensors')
        console.log("-> Sensor-Update empfangen:", data); // Geändert für Klarheit

        // Aktualisiere die Live-Sensorwerte im HTML
        if (tempElement && data.temperature !== undefined) {
          tempElement.textContent = `${parseFloat(data.temperature).toFixed(
            1
          )} °C`; // Sicherstellen, dass es eine Zahl ist und runden, Einheit hinzugefügt
        }
        if (humElement && data.humidity !== undefined) {
          humElement.textContent = `${parseFloat(data.humidity).toFixed(1)} %`; // Sicherstellen, dass es eine Zahl ist und runden, Einheit hinzugefügt
        }
        // Annahme: Lichtlevel kann auch float sein, runden und Einheit hinzufügen
        if (lightElement && data.light_level !== undefined) {
          lightElement.textContent = `${parseFloat(data.light_level).toFixed(
            1
          )} lx`; // Einheit hinzugefügt, runden falls float
        }
        // --- Ende Aktualisierung Live-Sensorwerte ---

        // Neuen Datenpunkt zum Chart hinzufügen und Charts aktualisieren
        updateCharts(data);
      });
    }
  } else {
    console.warn(
      "D3.js oder Chart Container nicht gefunden. D3 Chart Setup übersprungen."
    );
    if (dashboardChartContainer) {
      dashboardChartContainer.innerHTML =
        "<p style='color: orange;'>Chart konnte nicht geladen werden (D3.js fehlt oder Container nicht gefunden).</p>";
    }
  }
  // --- Ende D3 Chart Setup ---

  // --- Event-Listener für Steuerungs-Buttons ---
  if (controlButtons.length > 0 && socket) {
    // Stelle sicher, dass Buttons und Socket existieren
    controlButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const command = button.getAttribute("data-command");
        if (command) {
          console.log(`Sende Befehl: ${command}`);
          socket.emit("send_command", { command: command });
        }
      });
    });
  } else {
    console.warn(
      "Keine Steuerungs-Buttons gefunden oder SocketIO Client nicht verfügbar."
    );
  }
  // --- Ende Event-Listener für Steuerungs-Buttons ---

  // --- Optional: Feedback vom Server über gesendete Befehle ---
  if (socket) {
    // Stelle sicher, dass das Socket-Objekt existiert
    socket.on("command_response", (data) => {
      console.log("Antwort auf Befehl:", data);
      // Hier könnte man dem Benutzer Feedback geben (z.B. eine kurze Meldung)
      // Geänderter alert für bessere Lesbarkeit und falls message fehlt
      let message = `Befehl '${data.command}' Status: ${data.status}`;
      if (data.status === "error") {
        message = `Befehl '${data.command}' Status: Fehler${
          data.message ? " - " + data.message : ""
        }`;
        alert(message); // Zeige Fehler immer als Alert
      } else {
        console.log(message); // Erfolgsmeldungen nur in der Konsole loggen
        // Optional: Eine temporäre Erfolgsmeldung im UI anzeigen
      }
    });
  }
  // --- Ende Feedback vom Server ---
} else {
  console.log(
    "App.js: Nicht auf der Index-Seite. Index-spezifischer Code wird übersprungen."
  );
}
