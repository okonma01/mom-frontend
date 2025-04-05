# Example using Flask
import json
from flask import Flask, jsonify, request, send_from_directory 
from flask_cors import CORS
import os

app = Flask(__name__, static_folder='../client/dist', static_url_path='/')
app.config['JSONIFY_PRETTYPRINT_REGULAR'] = True

CORS(app, resources={
    r"/api/*": {
        "origins": ["http://localhost:5000", "http://127.0.0.1:5000"],
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})

@app.route('/')
def index():
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/api/test', methods=['GET'])
def test():
    return jsonify({"message": "API is working"})

@app.route('/api/games', methods=['GET'])
def get_games():
    # Return list of available games
    games = [f.replace('.json', '')
             for f in os.listdir('data/games') if f.endswith('.json')]
    return jsonify(games)


@app.route('/api/simulate', methods=['POST', 'OPTIONS'])
def simulate_game():
    # For OPTIONS requests, just return headers
    if request.method == 'OPTIONS':
        return '', 204
    
    # Get team selections from request
    data = request.json
    home_team_id = data.get('homeTeamId')
    away_team_id = data.get('awayTeamId')

    # Run simulation (from your existing Python code)
    from main import run_simulation_and_save_events
    game = run_simulation_and_save_events(home_team_id, away_team_id)

    # Return game ID
    return jsonify({"gameId": game._id})


@app.route('/api/games/<game_id>', methods=['GET'])
def get_game(game_id):
    # Return game data for specific game
    try:
        with open(f"data/games/game_{game_id}.json", 'r') as f:
            game_data = json.load(f)
        return jsonify(game_data)
    except FileNotFoundError:
        return jsonify({"error": "Game not found"}), 404


if __name__ == '__main__':
    app.run()
