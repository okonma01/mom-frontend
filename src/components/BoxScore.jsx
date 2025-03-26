import React from "react";
import "../styles/BoxScore.css";
import { getAssetPath } from "../utils/paths";

// Helper function to get player image (similar to BroadcastEventFeed)
const getPlayerImagePath = (playerId, gameInfo) => {
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
    return "/assets/player icons/default.png";
  }
  
  // Format player name: "First Last" -> "first-last"
  const formattedName = playerName
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/\./g, '') // Remove periods
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, ""); // Remove diacritics
  
  // Split team name to just the last part, e.g., "Boston Celtics" -> "celtics"
  const formattedTeamName = teamName.split(' ').pop().toLowerCase();
  return `/assets/player icons/${formattedTeamName}/${formattedName}.png`;
};

// Helper to calculate percentages
const calculatePercentage = (made, attempted) => {
  if (!attempted) return 0;
  return Math.round((made / attempted) * 100);
};

const BoxScore = ({ gameInfo, playerStats }) => {
  // No data check
  if (!gameInfo || !gameInfo.teams || !playerStats) {
    return <div className="boxscore">No box score data available</div>;
  }

  const homeTeam = gameInfo.teams[0];
  const awayTeam = gameInfo.teams[1];

  // Helper to render team table
  const renderTeamTable = (team, teamIndex) => {
    // Get formatted team name for default icon path
    const formattedTeamName = team.team_name.split(' ').pop().toLowerCase();
    
    // Extract just the nickname (last part of the team name)
    const teamNickname = team.team_name.split(' ').pop();
    
    return (
      <div className="team-boxscore">
        <div className="team-header">
          <span className="team-nickname">{teamNickname}</span>
        </div>
        <table>
          <thead>
            <tr>
              <th className="icon-col"></th> {/* Empty column for player icon */}
              <th className="player-col">Player</th>
              <th>MIN</th>
              <th>PTS</th>
              <th>REB</th>
              <th>AST</th>
              <th>FG</th>
              <th>3PT</th>
              <th>FT</th>
              <th>STL</th>
              <th>TO</th>
            </tr>
          </thead>
          <tbody>
            {(team.players || []).map((player) => {
              const stats = playerStats[player.player_id] || {
                points: 0, rebounds: 0, assists: 0, steals: 0, turnovers: 0,
                fieldGoalMade: 0, fieldGoalAttempted: 0,
                threePointMade: 0, threePointAttempted: 0,
                freeThrowsMade: 0, freeThrowsAttempted: 0
              };
              
              return (
                <tr key={player.player_id}>
                  <td className="icon-col">
                    <img 
                      src={getPlayerImagePath(player.player_id, gameInfo)} 
                      alt={player.player_name || "Player"}
                      className="player-icon"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = `/assets/player icons/${formattedTeamName}/default.png`;
                      }}
                    />
                  </td>
                  <td className="player-col">
                    <span>{player.player_name || player.player_id}</span>
                  </td>
                  <td>0</td> {/* Minutes played - to be implemented */}
                  <td>{stats.points || 0}</td>
                  <td>{stats.rebounds || 0}</td>
                  <td>{stats.assists || 0}</td>
                  <td>{stats.fieldGoalMade || 0}-{stats.fieldGoalAttempted || 0}</td>
                  <td>{stats.threePointMade || 0}-{stats.threePointAttempted || 0}</td>
                  <td>{stats.freeThrowsMade || 0}-{stats.freeThrowsAttempted || 0}</td>
                  <td>{stats.steals || 0}</td>
                  <td>{stats.turnovers || 0}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="boxscore">
      {renderTeamTable(homeTeam, 0)}
      {renderTeamTable(awayTeam, 1)}
    </div>
  );
};

export default BoxScore;
