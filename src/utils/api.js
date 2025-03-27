// Load teams from teams.json file

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

// Additional functions to work with the team data
export const getPlayersByTeam = async (teamId) => {
  try {
    const response = await fetch('/assets/teams.json');
    if (!response.ok) {
      throw new Error('Failed to fetch teams data');
    }
    
    const teamsData = await response.json();
    const team = teamsData[teamId];
    
    if (!team) return [];
    
    return Object.entries(team.players).map(([playerId, player]) => ({
      player_id: playerId,
      ...player
    }));
  } catch (error) {
    console.error('Error fetching players:', error);
    return [];
  }
};

export const getTeamById = async (teamId) => {
  try {
    const response = await fetch('/assets/teams.json');
    if (!response.ok) {
      throw new Error('Failed to fetch teams data');
    }
    
    const teamsData = await response.json();
    return teamsData[teamId] || null;
  } catch (error) {
    console.error('Error fetching team:', error);
    return null;
  }
};
