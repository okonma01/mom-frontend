from flask import Flask, jsonify
from flask_cors import CORS

app = Flask(__name__)
cors = CORS(app, origins='*')

@app.route('/')
def index():
    return jsonify({"message": "Welcome to the Game API!"})

@app.route('/api/games', methods=['GET'])
def get_games():
    games = [
        {"id": 1, "name": "Game 1", "genre": "Action"},
        {"id": 2, "name": "Game 2", "genre": "Adventure"},
        {"id": 3, "name": "Game 3", "genre": "Puzzle"},
    ]
    return jsonify(games)

if __name__ == '__main__':
    app.run(debug=True, port=8080)