# Example using Flask
import json
from flask import Flask, jsonify, request, send_from_directory, render_template
from flask_cors import CORS
import os
import sys
from pathlib import Path

app_dir = os.path.abspath(os.path.dirname(__file__))
sys.path.append(app_dir)

data_dir = Path(app_dir) / 'data'
if not data_dir.exists():
    data_dir.mkdir()
games_dir = data_dir / 'games'
if not games_dir.exists():
    games_dir.mkdir()

client_dist = Path(app_dir).parent / 'client' / 'dist'

app = Flask(__name__, static_folder=client_dist, static_url_path='/')

CORS(app, resources={
    r"/api/*": {
        "origins": ["https://make-or-miss.vercel.app",
                    "https://make-or-miss-daniel-okonmas-projects.vercel.app",
                    "https://make-or-miss-okonma01-daniel-okonmas-projects.vercel.app"],
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})


@app.route('/')
def index():
    try:
        path = os.path.join(app.static_folder, 'index.html')
        app.logger.info(f"Looking for index.html at: {path}")
        app.logger.info(f"File exists: {os.path.exists(path)}")
        return send_from_directory(app.static_folder, 'index.html')
    except Exception as e:
        app.logger.error(f"Error serving index.html: {str(e)}")
        return str(e), 500


@app.route('/api/test', methods=['GET'])
def test():
    return jsonify({"message": "API is working"})


@app.route('/api/games', methods=['GET'])
def get_games():
    # Return list of available games
    games_dir = data_dir / 'games'
    if not games_dir.exists():
        return jsonify([])
    games = [f.replace('.json', '')
             for f in os.listdir(games_dir) if f.endswith('.json')]
    return jsonify(games)


@app.route('/api/simulate', methods=['POST', 'OPTIONS'])
def simulate_game():
    # For OPTIONS requests, just return headers
    if request.method == 'OPTIONS':
        return '', 204

    try:
        # Get team selections from request
        data = request.json
        home_team_id = data.get('homeTeamId')
        away_team_id = data.get('awayTeamId')

        app.logger.info(f"Starting simulation for teams: {home_team_id} vs {away_team_id}")

        # Import simulation module
        try:
            from main import run_simulation_and_save_events, delete_game_files
            app.logger.info("Successfully imported simulation module")
        except Exception as e:
            app.logger.error(f"Failed to import simulation module: {str(e)}")
            return jsonify({"error": str(e)}), 500

        # Run simulation
        try:
            game = run_simulation_and_save_events(home_team_id, away_team_id)
            app.logger.info(f"Simulation complete, game ID: {game._id}")
            delete_game_files(game._id)
            return jsonify({"gameId": game._id})
        except Exception as e:
            app.logger.error(f"Simulation failed: {str(e)}")
            return jsonify({"error": str(e)}), 500

    except Exception as e:
        app.logger.error(f"General error in simulate endpoint: {str(e)}")
        return jsonify({"error": str(e)}), 500


@app.route('/api/games/<game_id>', methods=['GET'])
def get_game(game_id):
    # Return game data for specific game
    try:
        with open(games_dir / f"game_{game_id}.json", 'r') as f:
            game_data = json.load(f)
        return jsonify(game_data)
    except FileNotFoundError:
        return jsonify({"error": "Game not found"}), 404


if __name__ == '__main__':
    app.run()
