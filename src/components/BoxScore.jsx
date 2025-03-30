import React from "react";
import "../styles/BoxScore.css";
import { getPlayerImageFromGameInfo } from "../utils/playerUtils";
import { getAssetPath } from "../utils/paths";

const BoxScore = ({ gameInfo, playerStats }) => {
  // Simplified render function for a team's box score
  const renderTeamTable = (teamIndex) => {
    const team = gameInfo.teams[teamIndex];
    const teamName = team.team_name;
    const teamNickname = teamName.split(' ').pop();
    
    // Get the starting lineup IDs or use the first five players as starters
    const starterIds = team.starting_lineup || 
      (team.players || []).slice(0, 5).map(p => p.player_id || `p${p.player_index}`);
    
    // Sort players so starters come first
    const sortedPlayers = [...team.players].sort((a, b) => {
      const aId = a.player_id || `p${a.player_index}`;
      const bId = b.player_id || `p${b.player_index}`;
      
      const aIsStarter = starterIds.includes(aId);
      const bIsStarter = starterIds.includes(bId);
      
      if (aIsStarter && !bIsStarter) return -1;
      if (!aIsStarter && bIsStarter) return 1;
      
      // For starters, maintain starting lineup order
      if (aIsStarter && bIsStarter) {
        return starterIds.indexOf(aId) - starterIds.indexOf(bId);
      }
      
      return 0;
    });
    
    return (
      <div className="team-boxscore">
        <div className="team-header">
          <span className="team-nickname">{teamNickname}</span>
        </div>
        <table>
          <thead>
            <tr>
              <th className="icon-col"></th>
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
            {sortedPlayers.map((player) => {
              const playerId = player.player_id || `p${player.player_index}`;
              const stats = playerStats[playerId] || {};
              const isStarter = starterIds.includes(playerId);
              
              // Get player icon path
              const iconPath = getAssetPath(getPlayerImageFromGameInfo(playerId, gameInfo));
              
              return (
                <tr key={playerId}>
                  <td className="icon-col">
                    <img 
                      src={iconPath} 
                      alt={player.player_name} 
                      className="player-icon" 
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = getAssetPath("/assets/player icons/default.png");
                      }}
                    />
                  </td>
                  <td className={`player-col ${isStarter ? "starter" : ""}`}>{player.player_name}</td>
                  <td>{Math.round(stats.minutes || 0)}</td>
                  <td>{stats.points || 0}</td>
                  <td>{stats.rebounds || 0}</td>
                  <td>{stats.assists || 0}</td>
                  <td>{`${stats.fieldGoalMade || 0}-${stats.fieldGoalAttempted || 0}`}</td>
                  <td>{`${stats.threePointMade || 0}-${stats.threePointAttempted || 0}`}</td>
                  <td>{`${stats.freeThrowsMade || 0}-${stats.freeThrowsAttempted || 0}`}</td>
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
      {gameInfo && gameInfo.teams && (
        <>
          {renderTeamTable(0)}
          {renderTeamTable(1)}
        </>
      )}
    </div>
  );
};

export default BoxScore;
