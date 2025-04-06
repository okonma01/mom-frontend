# Example using Flask
import json
from flask import Flask, jsonify, request, send_from_directory, render_template
from flask_cors import CORS
import os, sys
from pathlib import Path
from util.vercel_blob_util import put, list_blobs, get, delete, is_vercel_environment
import dotenv

app_dir = os.path.abspath(os.path.dirname(__file__))
sys.path.append(app_dir)

# Keep these directories for local development compatibility
# In production with Vercel, we'll use Blob storage instead
data_dir = Path(app_dir) / 'data'
if not data_dir.exists():
    data_dir.mkdir()
games_dir = data_dir / 'games'
if not games_dir.exists():
    games_dir.mkdir()

client_dist = Path(app_dir).parent / 'client' / 'dist'

app = Flask(__name__, static_folder=client_dist, static_url_path='/')
dotenv.load_dotenv()

# Update CORS configuration to be more permissive and handle OPTIONS properly
CORS(app, resources={
    r"/api/*": {
        "origins": ["https://make-or-miss.vercel.app", 
                    "https://make-or-miss-daniel-okonmas-projects.vercel.app",
                    "https://make-or-miss-okonma01-daniel-okonmas-projects.vercel.app",
                    "http://localhost:5000",
                    "http://localhost:3000"],  # Added localhost:3000 for development
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization", "Accept", "Origin", "X-Requested-With"],
        "supports_credentials": True,
        "max_age": 86400  # Cache preflight response for 24 hours
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
    if is_vercel_environment():
        # Use Vercel Blob storage
        try:
            blobs = list_blobs(prefix="games/")
            games = [blob.pathname.replace('games/game_', '').replace('.json', '')
                    for blob in blobs.blobs if blob.pathname.startswith('games/game_')]
            return jsonify(games)
        except Exception as e:
            app.logger.error(f"Error listing blobs: {str(e)}")
            return jsonify([])
    else:
        # Fallback to file system for local development
        games_dir = data_dir / 'games'
        if not games_dir.exists():
            return jsonify([])
        games = [f.replace('game_', '').replace('.json', '')
                for f in os.listdir(games_dir) if f.endswith('.json')]
        return jsonify(games)


@app.route('/api/simulate', methods=['POST', 'OPTIONS'])
def simulate_game():
    # Handle OPTIONS requests at the Flask level to ensure CORS headers are applied
    if request.method == 'OPTIONS':
        return '', 204
    
    try:
        # Get team selections from request
        data = request.json
        if not data:
            return jsonify({"error": "No JSON data provided"}), 400
            
        home_team_id = data.get('homeTeamId')
        away_team_id = data.get('awayTeamId')
        
        if not home_team_id or not away_team_id:
            return jsonify({"error": "Missing team IDs"}), 400

        # Run simulation (from your existing Python code)
        from main import run_simulation_and_save_events, delete_game_files
        game = run_simulation_and_save_events(home_team_id, away_team_id)
        
        if is_vercel_environment():
            # In Vercel, we need to clean up old game files from Blob storage
            # Note: This could be expensive, consider implementing a better cleanup strategy
            try:
                blobs = list_blobs(prefix="games/")
                for blob in blobs.blobs:
                    if blob.pathname != f'games/game_{game._id}.json':
                        delete(blob.url)
            except Exception as e:
                app.logger.error(f"Error cleaning up old games from Blob storage: {str(e)}")
        else:
            # In local environment, use file system cleanup
            delete_game_files(game._id)

        # Return game ID
        return jsonify({"gameId": game._id})
        
    except Exception as e:
        app.logger.error(f"Error in simulate_game: {str(e)}")
        return jsonify({"error": str(e)}), 500


@app.route('/api/games/<game_id>', methods=['GET'])
def get_game(game_id):
    # Return game data for specific game
    try:
        if is_vercel_environment():
            # Use Vercel Blob storage
            try:
                blob_path = f"games/game_{game_id}.json"
                blob = get(blob_path)
                if blob._content:
                    game_data = json.loads(blob.text())
                    return jsonify(game_data)
                else:
                    return jsonify({"error": "Game not found"}), 404
            except Exception as e:
                app.logger.error(f"Error getting blob: {str(e)}")
                return jsonify({"error": f"Game not found: {str(e)}"}), 404
        else:
            # Fallback to file system for local development
            with open(games_dir / f"game_{game_id}.json", 'r') as f:
                game_data = json.load(f)
            return jsonify(game_data)
    except FileNotFoundError:
        return jsonify({"error": "Game not found"}), 404


@app.after_request
def after_request(response):
    """Ensure CORS headers are set properly for all responses"""
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,POST,OPTIONS,PUT,DELETE')
    return response


if __name__ == '__main__':
    app.run()
