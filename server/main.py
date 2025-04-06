from util.team_util import load_team_from_csv, load_team_from_json
from game.index import Game
import os
import json
from util.vercel_blob_util import put, list_blobs, delete, is_vercel_environment

def delete_game_files(g: str):
    """
    Delete all game files except the one with the given ID
    Args:
        g: Game ID to keep
    """
    if is_vercel_environment():
        # Use Vercel Blob storage in production
        try:
            blobs = list_blobs(prefix="games/")
            for blob in blobs.blobs:
                if blob.pathname != f'games/game_{g}.json':
                    delete(blob.url)
        except Exception as e:
            print(f"Error cleaning up old games from Blob storage: {str(e)}")
    else:
        # Use file system in local development
        # Get all game files in the directory
        game_files = os.listdir('data/games')

        # Iterate over each file and delete it if it doesn't match the given ID
        for file in game_files:
            if file != f"game_{g}.json":
                os.remove(os.path.join('data', 'games', file))

def run_simulation_and_save_events(home_team_id, away_team_id):
    """
    Load teams from CSV, run a game simulation, and save events to a JSON file

    Args:
        home_team: Path to home team JSON file
        away_team: Path to away team JSON file
        output_json_path: Path to save the JSON output
    """

    # Build paths to team files
    teams_dir = os.path.join('data', 'teams')
    home_team = os.path.join(teams_dir, f"{home_team_id}.json")
    away_team = os.path.join(teams_dir, f"{away_team_id}.json")

    # Load teams
    home_team = load_team_from_json(home_team)
    away_team = load_team_from_json(away_team)

    # Create and run game
    game = Game()
    game.teams = [home_team, away_team]
    game.play_game()

    # Get event log and save to JSON
    event_log = game.logger.event_log

    # Save event log to JSON
    if is_vercel_environment():
        # Use Vercel Blob storage in production
        game_data = event_log.to_dict()
        json_data = json.dumps(game_data)
        result = put(f"games/game_{game._id}.json", json_data, {"access": "public"})
        print(f"Game data saved to Vercel Blob: {result.get('url', 'Unknown URL')}")
    else:
        # Use file system in local development
        event_log.to_json()

    return game


# Only run this when the file is executed directly, not when imported
if __name__ == "__main__":
    # Run the simulation
    g = run_simulation_and_save_events('celtics24', 'nuggets23')
