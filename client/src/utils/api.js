// Update the API_BASE_URL to be relative in production and absolute in development
const isDevelopment = window.location.hostname === 'localhost' || 
                     window.location.hostname === '127.0.0.1';

const API_BASE_URL = isDevelopment
  ? `http://${window.location.hostname}:5000/api`
  : "https://mom-frontend.fly.dev/api"; ;
  
// Function to fetch teams from the JSON file
export const fetchTeams = async () => {
  try {
    const response = await fetch('/assets/teams.json');
    if (!response.ok) {
      throw new Error('Failed to fetch teams data');
    }
    
    const teamsData = await response.json();
    
    // Convert from object to array and prepare for UI
    const uiReadyTeams = Object.entries(teamsData).map(([teamId, team]) => {
      // Extract key players (top 3 by index for simplicity)
      const keyPlayers = Object.entries(team.players)
        .slice(0, 3)
        .map(([playerId, player]) => ({
          id: playerId,
          name: player.player_name,
          firstName: player.player_name.split(' ')[0],
          lastName: player.player_name.replace(player.player_name.split(' ')[0] + ' ', ''),
          number: player.jersey_number
        }));
      
      return {
        id: team.team_id,
        name: team.team_name,
        abbreviation: team.abbreviation,
        season: team.season,
        coach: team.coach,
        record: team.record,
        colors: team.colors,
        logoUrl: `/assets/logos/${team.team_id.replace(/[0-9]/g, "").toLowerCase()}.webp`,
        keyPlayers: keyPlayers,
        // Include the starting lineup array
        starting_lineup: team.starting_lineup || [],
        // Include all players data for using in lineup display
        players: team.players || {},
        // Include raw data for other uses
        rawData: team
      };
    });
    
    return uiReadyTeams;
  } catch (error) {
    console.error('Error fetching teams:', error);
    return [];
  }
};

export const simulateGame = async (homeTeamId, awayTeamId) => {
  try {
    console.log("Sending data:", { homeTeamId, awayTeamId }); // Debug output

    const response = await fetch(`${API_BASE_URL}/simulate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ homeTeamId, awayTeamId }),
    });
    
    if (!response.ok) throw new Error('Failed to simulate game');
    return await response.json();
  } catch (error) {
    console.error('Error simulating game:', error);
    throw error;
  }
};

export const fetchGameData = async (gameId, signal = null) => {
  try {
    console.log("Fetching game data for ID:", gameId); // Debug output
    const response = await fetch(`${API_BASE_URL}/games/${gameId}`);
    if (!response.ok) throw new Error('Failed to fetch game data');
    return await response.json();
  } catch (error) {
    console.error('Error fetching game data:', error);
    throw error;
  }
};