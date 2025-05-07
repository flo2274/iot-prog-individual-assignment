#!/bin/bash

# Optional: activate a virtual environment if available
# source venv/bin/activate

echo "Make sure the database is running and the schema (database/schema.sql) has been applied."
echo "Make sure the Arduino is connected and running on the port from .env."
echo "Starting the Python backend server (app.py)..."

# Run the main Python script
# The path must be relative to the location where the script is executed,
# or you can change into the directory first.
python server/app.py

# Optional: deactivate the virtual environment on exit
# deactivate

echo "Server has been stopped."