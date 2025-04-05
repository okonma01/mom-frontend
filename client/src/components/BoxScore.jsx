import React, { useMemo, memo, useState } from "react";
import "../styles/BoxScore.css";
import { getPlayerImageFromGameInfo } from "../utils/playerUtils";
import { getAssetPath } from "../utils/paths";
import { getTeamColors, getTeamDefaultImagePath } from "../utils/teamUtils";

// Memoized PlayerRow component to prevent unnecessary re-renders
const PlayerRow = memo(({ player, playerId, stats, isStarter, gameInfo, teamColor }) => {
  // Get player icon path
  const iconPath = getAssetPath(getPlayerImageFromGameInfo(playerId, gameInfo));
  
  // Calculate shooting percentages
  const fgPct = stats.fieldGoalAttempted > 0 
    ? Math.round((stats.fieldGoalMade / stats.fieldGoalAttempted) * 100) 
    : 0;
    
  const tpPct = stats.threePointAttempted > 0 
    ? Math.round((stats.threePointMade / stats.threePointAttempted) * 100) 
    : 0;
    
  const ftPct = stats.freeThrowsAttempted > 0 
    ? Math.round((stats.freeThrowsMade / stats.freeThrowsAttempted) * 100) 
    : 0;
  
  return (
    <tr className={isStarter ? "starter-row" : ""}>
      <td className="icon-col">
        <img 
          src={iconPath} 
          alt={player.player_name} 
          className="player-icon" 
          style={isStarter ? { borderColor: teamColor } : {}}
          onError={(e) => {
            const teamDefaultPath = getAssetPath(getTeamDefaultImagePath(playerId, gameInfo));
            
            // If current src is already the team default, try global default
            if (e.target.src.includes(teamDefaultPath)) {
              e.target.src = getAssetPath("/assets/player icons/default.png");
            } else {
              // Otherwise try the team default
              e.target.src = teamDefaultPath;
            }
            
            // Prevent infinite error loops
            e.target.onerror = null;
          }}
        />
      </td>
      <td className={`player-col ${isStarter ? "starter" : ""}`}>
        {player.player_name}
        {isStarter && <span className="starter-indicator">•</span>}
      </td>
      <td>{Math.round(stats.minutes || 0)}</td>
      <td className={stats.points >= 20 ? "highlight-stat" : ""}>{stats.points || 0}</td>
      <td>{stats.rebounds || 0}</td>
      <td>{stats.assists || 0}</td>
      <td>
        <div className="fg-display">
          <div className="fg-numbers">{`${stats.fieldGoalMade || 0}-${stats.fieldGoalAttempted || 0}`}</div>
          <div className="fg-percent">{stats.fieldGoalAttempted > 0 ? `${fgPct}%` : "-"}</div>
        </div>
      </td>
      <td>
        <div className="fg-display">
          <div className="fg-numbers">{`${stats.threePointMade || 0}-${stats.threePointAttempted || 0}`}</div>
          <div className="fg-percent">{stats.threePointAttempted > 0 ? `${tpPct}%` : "-"}</div>
        </div>
      </td>
      <td>
        <div className="fg-display">
          <div className="fg-numbers">{`${stats.freeThrowsMade || 0}-${stats.freeThrowsAttempted || 0}`}</div>
          <div className="fg-percent">{stats.freeThrowsAttempted > 0 ? `${ftPct}%` : "-"}</div>
        </div>
      </td>
      <td>{stats.steals || 0}</td>
      <td>{stats.blocks || 0}</td>
      <td>{stats.turnovers || 0}</td>
    </tr>
  );
});

// Memoized TeamTable component to prevent unnecessary re-renders
const TeamTable = memo(({ team, teamIndex, playerStats, starterIds }) => {
  const teamName = team.team_name;
  const teamColors = getTeamColors(teamName);
  const primaryColor = teamColors?.primary || "#007aff";
  const secondaryColor = teamColors?.secondary || "#f5f5f7";
  
  // Sort players so starters come first - memoized to avoid recalculation
  const sortedPlayers = useMemo(() => {
    return [...team.players].sort((a, b) => {
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
      
      // For bench players, sort by minutes for better UX
      const aStats = playerStats[aId] || {};
      const bStats = playerStats[bId] || {};
      return (bStats.minutes || 0) - (aStats.minutes || 0);
    });
  }, [team.players, starterIds, playerStats]);
  
  // Calculate team totals
  const teamTotals = useMemo(() => {
    const totals = {
      minutes: 0,
      points: 0,
      rebounds: 0,
      assists: 0,
      fieldGoalMade: 0,
      fieldGoalAttempted: 0,
      threePointMade: 0,
      threePointAttempted: 0,
      freeThrowsMade: 0,
      freeThrowsAttempted: 0,
      steals: 0,
      blocks: 0,
      turnovers: 0
    };
    
    sortedPlayers.forEach(player => {
      const playerId = player.player_id || `p${player.player_index}`;
      const stats = playerStats[playerId] || {};
      
      totals.minutes += stats.minutes || 0;
      totals.points += stats.points || 0;
      totals.rebounds += stats.rebounds || 0;
      totals.assists += stats.assists || 0;
      totals.fieldGoalMade += stats.fieldGoalMade || 0;
      totals.fieldGoalAttempted += stats.fieldGoalAttempted || 0;
      totals.threePointMade += stats.threePointMade || 0;
      totals.threePointAttempted += stats.threePointAttempted || 0;
      totals.freeThrowsMade += stats.freeThrowsMade || 0;
      totals.freeThrowsAttempted += stats.freeThrowsAttempted || 0;
      totals.steals += stats.steals || 0;
      totals.blocks += stats.blocks || 0;
      totals.turnovers += stats.turnovers || 0;
    });
    
    // Calculate percentages
    totals.fgPct = totals.fieldGoalAttempted > 0 
      ? Math.round((totals.fieldGoalMade / totals.fieldGoalAttempted) * 100) 
      : 0;
      
    totals.tpPct = totals.threePointAttempted > 0 
      ? Math.round((totals.threePointMade / totals.threePointAttempted) * 100) 
      : 0;
      
    totals.ftPct = totals.freeThrowsAttempted > 0 
      ? Math.round((totals.freeThrowsMade / totals.freeThrowsAttempted) * 100) 
      : 0;
    
    return totals;
  }, [sortedPlayers, playerStats]);
  
  return (
    <div className="team-boxscore">
      <div className="table-container">
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
              <th>BLK</th>
              <th>TO</th>
            </tr>
          </thead>
          <tbody>
            {sortedPlayers.map((player) => {
              const playerId = player.player_id || `p${player.player_index}`;
              const stats = playerStats[playerId] || {};
              const isStarter = starterIds.includes(playerId);
              
              return (
                <PlayerRow 
                  key={playerId}
                  player={player}
                  playerId={playerId}
                  stats={stats}
                  isStarter={isStarter}
                  gameInfo={team.gameInfo}
                  teamColor={primaryColor}
                />
              );
            })}
          </tbody>
          <tfoot>
            <tr className="totals-row">
              <td colSpan="2">Team Totals</td>
              <td>{Math.round(teamTotals.minutes)}</td>
              <td className="highlight-stat">{teamTotals.points}</td>
              <td>{teamTotals.rebounds}</td>
              <td>{teamTotals.assists}</td>
              <td>
                <div className="fg-display">
                  <div className="fg-numbers">{`${teamTotals.fieldGoalMade}-${teamTotals.fieldGoalAttempted}`}</div>
                  <div className="fg-percent">{teamTotals.fieldGoalAttempted > 0 ? `${teamTotals.fgPct}%` : "-"}</div>
                </div>
              </td>
              <td>
                <div className="fg-display">
                  <div className="fg-numbers">{`${teamTotals.threePointMade}-${teamTotals.threePointAttempted}`}</div>
                  <div className="fg-percent">{teamTotals.threePointAttempted > 0 ? `${teamTotals.tpPct}%` : "-"}</div>
                </div>
              </td>
              <td>
                <div className="fg-display">
                  <div className="fg-numbers">{`${teamTotals.freeThrowsMade}-${teamTotals.freeThrowsAttempted}`}</div>
                  <div className="fg-percent">{teamTotals.freeThrowsAttempted > 0 ? `${teamTotals.ftPct}%` : "-"}</div>
                </div>
              </td>
              <td>{teamTotals.steals}</td>
              <td>{teamTotals.blocks}</td>
              <td>{teamTotals.turnovers}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
});

const BoxScore = ({ gameInfo, playerStats }) => {
  // Check for required props to prevent unnecessary renders
  if (!gameInfo || !gameInfo.teams || !playerStats) {
    return <div className="boxscore-loading">Loading box score data...</div>;
  }
  
  // Get starter IDs for both teams - memoized to avoid recalculation
  const teamStarterIds = useMemo(() => {
    return gameInfo.teams.map(team => {
      return team.starting_lineup || 
        (team.players || []).slice(0, 5).map(p => p.player_id || `p${p.player_index}`);
    });
  }, [gameInfo.teams]);

  // State to track active team tab
  const [activeTeamIndex, setActiveTeamIndex] = useState(0);
  
  // Get team colors for styling
  const teamColors = useMemo(() => {
    return gameInfo.teams.map(team => getTeamColors(team.team_name));
  }, [gameInfo.teams]);
  
  return (
    <div className="boxscore">
      <div className="boxscore-tabs">
        {gameInfo.teams.map((team, index) => {
          // Get team color object, ensuring it has a logo property with a fallback
          const teamColor = teamColors[index] || {};
          const logoPath = teamColor.logo ? getAssetPath(teamColor.logo) : "";
          
          return (
            <button
              key={index}
              className={`boxscore-tab ${activeTeamIndex === index ? 'active' : ''}`}
              onClick={() => setActiveTeamIndex(index)}
              style={{
                borderColor: activeTeamIndex === index ? teamColors[index]?.primary : 'transparent',
                color: activeTeamIndex === index ? teamColors[index]?.primary : '#1d1d1f'
              }}
            >
              <div className="team-tab-logo">
                {logoPath ? (
                  <img 
                    src={logoPath} 
                    alt={team.team_name}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = getAssetPath("/assets/logos/default.png");
                    }}
                  />
                ) : (
                  <span>{team.team_name.charAt(0)}</span>
                )}
              </div>
              <span>{team.team_name}</span>
            </button>
          );
        })}
      </div>
      
      <div className="boxscore-team-header" style={{ backgroundColor: teamColors[activeTeamIndex]?.primary }}>
        <div className="team-name-container">
          <span className="team-nickname">{gameInfo.teams[activeTeamIndex].team_name}</span>
          <span className="team-record">{gameInfo.teams[activeTeamIndex].record || ""}</span>
        </div>
      </div>
      
      <div className="boxscore-container">
        <TeamTable 
          team={{...gameInfo.teams[activeTeamIndex], gameInfo}}
          teamIndex={activeTeamIndex}
          playerStats={playerStats}
          starterIds={teamStarterIds[activeTeamIndex]}
        />
      </div>
    </div>
  );
};

export default memo(BoxScore);
