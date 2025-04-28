// Prüfen, ob wir auf der Hauptseite oder der Verlaufsseite sind
const tempElementCheck = document.getElementById("temperature");
const chartElementCheck = document.getElementById("sensorHistoryChart");

const isIndexPage = !!document.getElementById("temperature"); // Prüft, ob das Element existiert
const isHistoryPage = !!document.getElementById("sensorHistoryChart");

console.log("App.js geladen."); // <<< Neu
console.log("Suche nach #temperature:", tempElementCheck); // <<< Neu: Zeigt das gefundene Element oder null
console.log("Suche nach #sensorHistoryChart:", chartElementCheck); // <<< Neu
console.log("isIndexPage:", isIndexPage); // <<< Neu
console.log("isHistoryPage:", isHistoryPage); // <<< Neu

// Verbindung zum Socket.IO Server herstellen
// Passt sich automatisch an den Host an, von dem die Seite geladen wurde
const socket = io();

const statusElement = document.getElementById("connection-status");

socket.on("connect", () => {
  console.log("Verbunden mit dem Server!");
  if (statusElement) statusElement.textContent = "Verbunden";
  if (statusElement) statusElement.style.color = "green";
});

socket.on("disconnect", () => {
  console.log("Verbindung zum Server getrennt!");
  if (statusElement) statusElement.textContent = "Verbindung getrennt!";
  if (statusElement) statusElement.style.color = "red";
  // Optional: UI-Elemente deaktivieren oder Werte zurücksetzen
  if (isIndexPage) {
    document.getElementById("temperature").textContent = "--";
    document.getElementById("humidity").textContent = "--";
    document.getElementById("light").textContent = "--";
  }
});

socket.on("connect_error", (err) => {
  console.error("Verbindungsfehler:", err);
  if (statusElement)
    statusElement.textContent = `Verbindungsfehler: ${err.message}`;
  if (statusElement) statusElement.style.color = "red";
});

// --- Code für die Index-Seite (Dashboard) ---
if (isIndexPage) {
  console.log("App.js: Betrete Index-Seite Block.");
  const tempElement = document.getElementById("temperature");
  const humElement = document.getElementById("humidity");
  const lightElement = document.getElementById("light");
  const controlButtons = document.querySelectorAll(
    ".controls button[data-command]"
  );

  // Event-Listener für eingehende Sensor-Updates
  socket.on("a", (data) => {
    console.log("Sensor-Update empfangen:", data);
    if (data.temperature !== undefined) {
      tempElement.textContent = data.temperature.toFixed(1); // Auf eine Nachkommastelle runden
    }
    if (data.humidity !== undefined) {
      humElement.textContent = data.humidity.toFixed(1);
    }
    if (data.light_level !== undefined) {
      lightElement.textContent = data.light_level;
    }
  });

  // Event-Listener für Steuerungs-Buttons
  controlButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const command = button.getAttribute("data-command");
      if (command) {
        console.log(`Sende Befehl: ${command}`);
        socket.emit("send_command", { command: command });
      }
    });
  });

  // Optional: Feedback vom Server über gesendete Befehle
  socket.on("command_response", (data) => {
    console.log("Antwort auf Befehl:", data);
    // Hier könnte man dem Benutzer Feedback geben (z.B. eine kurze Meldung)
    alert(
      `Befehl '${data.command}' Status: ${data.status}${
        data.message ? " - " + data.message : ""
      }`
    );
  });
}

// --- Code für die History-Seite ---
if (isHistoryPage) {
  console.log("App.js: Betrete History-Seite Block.");
  const ctx = document.getElementById("sensorHistoryChart").getContext("2d");
  let sensorChart; // Variable, um das Chart-Objekt zu halten

  function renderChart(historyData) {
    console.log("Rendering chart with data:", historyData);

    if (!Array.isArray(historyData) || historyData.length === 0) {
      console.warn("No history data to display.");
      // Optional: Zeige eine Meldung im Canvas an
      ctx.font = "16px Arial";
      ctx.textAlign = "center";
      ctx.fillText("Keine Verlaufsdaten verfügbar.", ctx.canvas.width / 2, 50);
      return;
    }

    // Daten für Chart.js vorbereiten
    const labels = historyData.map((d) => new Date(d.created_at)); // Zeitstempel als Datumsobjekte
    const tempData = historyData.map((d) => d.temperature);
    const humData = historyData.map((d) => d.humidity);
    const lightData = historyData.map((d) => d.light_level);

    // Zerstöre altes Chart, falls vorhanden (für Updates)
    if (sensorChart) {
      sensorChart.destroy();
    }

    sensorChart = new Chart(ctx, {
      type: "line", // Linien-Diagramm
      data: {
        labels: labels, // X-Achse (Zeit)
        datasets: [
          {
            label: "Temperatur (°C)",
            data: tempData,
            borderColor: "rgb(255, 99, 132)",
            backgroundColor: "rgba(255, 99, 132, 0.5)",
            yAxisID: "yTemp", // Eigene Y-Achse
            tension: 0.1, // Glättet die Linie etwas
          },
          {
            label: "Luftfeuchtigkeit (%)",
            data: humData,
            borderColor: "rgb(54, 162, 235)",
            backgroundColor: "rgba(54, 162, 235, 0.5)",
            yAxisID: "yHum", // Eigene Y-Achse
            tension: 0.1,
          },
          {
            label: "Lichtlevel",
            data: lightData,
            borderColor: "rgb(255, 205, 86)",
            backgroundColor: "rgba(255, 205, 86, 0.5)",
            yAxisID: "yLight", // Eigene Y-Achse
            tension: 0.1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true, // Beibehaltung des Seitenverhältnisses
        interaction: {
          // Bessere Tooltips
          mode: "index",
          intersect: false,
        },
        stacked: false, // Linien nicht stapeln
        scales: {
          x: {
            type: "time", // Zeit-Achse verwenden
            time: {
              unit: "minute", // Oder 'hour', 'day' etc. anpassen
              tooltipFormat: "dd.MM.yyyy HH:mm:ss", // Format für Tooltips
              displayFormats: {
                // Wie die Achse beschriftet wird
                minute: "HH:mm",
                hour: "dd.MM HH:mm",
              },
            },
            title: {
              display: true,
              text: "Zeit",
            },
          },
          // Definition der verschiedenen Y-Achsen
          yTemp: {
            type: "linear",
            display: true,
            position: "left",
            title: {
              display: true,
              text: "Temperatur (°C)",
            },
            grid: {
              // Nur das Gitter für die Hauptachse zeichnen
              drawOnChartArea: true,
            },
          },
          yHum: {
            type: "linear",
            display: true,
            position: "left", // Gleiche Seite wie Temperatur für Übersichtlichkeit
            title: {
              display: true,
              text: "Luftfeuchtigkeit (%)",
            },
            grid: {
              drawOnChartArea: false, // Gitter nicht doppelt zeichnen
            },
          },
          yLight: {
            type: "linear",
            display: true,
            position: "right", // Auf der rechten Seite platzieren
            title: {
              display: true,
              text: "Lichtlevel",
            },
            grid: {
              drawOnChartArea: false,
            },
          },
        },
        plugins: {
          // Plugin-Konfigurationen
          tooltip: {
            mode: "index",
            intersect: false,
          },
          title: {
            // Titel für das Diagramm
            display: true,
            text: "Sensorverlauf (Letzte Einträge)",
          },
          legend: {
            // Legende anzeigen
            position: "top",
          },
        },
      },
    });
  }

  // Daten vom API-Endpunkt abrufen, wenn die Seite geladen wird
  fetch("/api/history")
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then((data) => {
      if (data.error) {
        console.error("Fehler beim Laden der Verlaufsdaten:", data.error);
        // Optional: Fehlermeldung im Chart-Bereich anzeigen
      } else {
        renderChart(data); // Chart mit den Daten zeichnen
      }
    })
    .catch((error) => {
      console.error("Fehler beim Abrufen der Verlaufsdaten:", error);
      // Optional: Fehlermeldung im Chart-Bereich anzeigen
      ctx.font = "16px Arial";
      ctx.textAlign = "center";
      ctx.fillText("Fehler beim Laden der Daten.", ctx.canvas.width / 2, 50);
    });
}
