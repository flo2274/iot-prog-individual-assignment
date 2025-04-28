#!/bin/bash

# Optional: Aktiviere eine virtuelle Umgebung, falls vorhanden
# source venv/bin/activate

echo "Stelle sicher, dass die Datenbank läuft und das Schema (database/schema.sql) angewendet wurde."
echo "Stelle sicher, dass der Arduino verbunden ist und auf dem Port aus .env läuft."
echo "Starte den Python Backend Server (app.py)..."

# Führe das Haupt-Python-Skript aus
# Der Pfad muss relativ zum Ort sein, an dem das Skript ausgeführt wird,
# oder man wechselt vorher ins Verzeichnis.
python server/app.py

# Optional: Deaktiviere die virtuelle Umgebung beim Beenden
# deactivate

echo "Server wurde beendet."