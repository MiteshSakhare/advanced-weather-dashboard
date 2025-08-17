from flask import Flask, render_template, request, jsonify
import requests
import os
from dotenv import load_dotenv        

load_dotenv()                          

app = Flask(__name__)

OPENWEATHER_API_KEY = os.environ.get("OPENWEATHER_API_KEY")

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/weather/<city_name>', methods=['GET'])
def get_weather_data(city_name):
    """Fetches current weather data for a given city."""
    if not city_name:
        return jsonify({"error": "City name is required"}), 400
    url = f"https://api.openweathermap.org/data/2.5/weather?q={city_name}&appid={OPENWEATHER_API_KEY}"
    try:
        resp = requests.get(url)
        resp.raise_for_status()
        return jsonify(resp.json())
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/weather_by_coords')
def weather_by_coords():
    lat = request.args.get("lat")
    lon = request.args.get("lon")
    if not lat or not lon:
        return jsonify({"error": "Coordinates required"}), 400
    url = f"https://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&appid={OPENWEATHER_API_KEY}"
    try:
        resp = requests.get(url)
        resp.raise_for_status()
        return jsonify(resp.json())
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/forecast/<city_id>', methods=['GET'])
def get_forecast_data(city_id):
    if not city_id:
        return jsonify({"error": "City ID is required"}), 400
    url = f"https://api.openweathermap.org/data/2.5/forecast?id={city_id}&appid={OPENWEATHER_API_KEY}"
    try:
        resp = requests.get(url)
        resp.raise_for_status()
        return jsonify(resp.json())
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/uvindex', methods=['GET'])
def get_uv_index_data():
    lat = request.args.get('lat')
    lon = request.args.get('lon')
    if not lat or not lon:
        return jsonify({"error": "Latitude and longitude are required"}), 400
    url = f"https://api.openweathermap.org/data/2.5/uvi?lat={lat}&lon={lon}&appid={OPENWEATHER_API_KEY}"
    try:
        resp = requests.get(url)
        resp.raise_for_status()
        return jsonify(resp.json())
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/air_quality', methods=['GET'])
def air_quality():
    lat = request.args.get('lat')
    lon = request.args.get('lon')
    if not lat or not lon:
        return jsonify({"error": "Coordinates required"}), 400
    url = f"http://api.openweathermap.org/data/2.5/air_pollution?lat={lat}&lon={lon}&appid={OPENWEATHER_API_KEY}"
    try:
        resp = requests.get(url)
        resp.raise_for_status()
        return jsonify(resp.json())
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
