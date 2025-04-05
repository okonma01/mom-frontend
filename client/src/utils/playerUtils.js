/**
 * Get the path to a player's image based on player name and team
 * @param {string} playerName - Full name of the player
 * @param {string} teamName - Name of the team (can be full name like "Boston Celtics")
 * @returns {string} Path to the player's image
 */
export const getPlayerImagePath = (playerName, teamName) => {
  if (!playerName || !teamName) {
    return "/assets/players/default.png";
  }

  // Format player name: "First Last" -> "first-last"
  playerName = playerName.toLowerCase().replace(/\s+/g, '-').replace(/\./g, '').normalize("NFD").replace(/[\u0300-\u036f]/g, ""); // Remove diacritics

  // Get the last part of the team name (e.g., "Boston Celtics" -> "celtics")
  // and remove any numbers (e.g., "celtics24" -> "celtics")
  const teamNameOnly = teamName.split(' ').pop().toLowerCase().replace(/\d+/g, '');

  return `/assets/player icons/${teamNameOnly}/${playerName}.png`;
};

/**
 * Get the path to a player's image based on player ID from a game context
 * @param {string} playerId - ID of the player to get image for
 * @param {object} gameInfo - Game information containing player and team data
 * @returns {string} Path to the player's image
 */
export const getPlayerImageFromGameInfo = (playerId, gameInfo) => {
  // Find the player in game info to get their name and team
  let playerName = "";
  let teamName = "";

  for (const team of gameInfo.teams || []) {
    for (const player of team.players || []) {
      if (player.player_id === playerId) {
        playerName = player.player_name || "";
        teamName = team.team_name;
        break;
      }
    }
    if (playerName) break;
  }

  if (!playerName || !teamName) {
    return "/assets/players/default.png";
  }

  return getPlayerImagePath(playerName, teamName);
};

export const getPlayerFirstName = (playerName) => {
  if (!playerName) return "";
  return playerName.split(' ')[0];
}

export const getPlayerLastName = (playerName) => {
  if (!playerName) return "";
  return playerName.replace(playerName.split(' ')[0] + ' ', '');
}