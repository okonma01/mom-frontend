import os

def delete_games():
    """
    Delete oldest game files if there are more than 30 games
    in the data/games directory
    """
    games_dir = os.path.join('data', 'games')
    json_files = [f for f in os.listdir(games_dir) if f.endswith('.json')]
    
    # If we have more than 30 files, delete the oldest ones
    if len(json_files) > 30:
        # Get full paths with creation time
        files_with_time = [(os.path.join(games_dir, f), 
                           os.path.getmtime(os.path.join(games_dir, f))) 
                           for f in json_files]
        
        # Sort by modification time (oldest first)
        files_with_time.sort(key=lambda x: x[1])
        
        # Delete oldest files to bring count down to 30
        files_to_delete = files_with_time[0:len(files_with_time) - 30]
        for file_path, _ in files_to_delete:
            os.remove(file_path)
