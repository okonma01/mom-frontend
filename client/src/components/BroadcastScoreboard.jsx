import React, { memo } from "react";
import { getTeamLogoPath } from "../utils/teamUtils";
import styles from "../styles/BroadcastScoreboard.module.css";

const BroadcastScoreboard = ({ 
  gameInfo, 
  scores, 
  currentTime, 
  teamColors,
  homeScoreUpdated,
  awayScoreUpdated
}) => {
  if (!gameInfo || !gameInfo.teams) return null;
  
  const home = gameInfo.teams[0];
  const away = gameInfo.teams[1];
  
  return (
    <div className={styles.scoreboard}>
      <div className={styles.scoreboard_container}>
        <div className={styles.team_logo_wrapper}>
          <img
            src={getTeamLogoPath(home.team_name)}
            alt={home.team_name}
            className={styles.team_logo}
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = "/assets/logos/default.png";
            }}
          />
        </div>
        
        <div 
          className={`${styles.score} ${homeScoreUpdated ? styles.score_updated : ''}`}
          style={{color: teamColors[0]?.primary}}
        >
          {scores.home}
        </div>
        
        <div className={styles.time_display}>
          <span className={styles.quarter_indicator}>{currentTime.quarter}</span>
          <span className={styles.time_remaining}>{currentTime.timestamp}</span>
        </div>
        
        <div 
          className={`${styles.score} ${awayScoreUpdated ? styles.score_updated : ''}`}
          style={{color: teamColors[1]?.primary}}
        >
          {scores.away}
        </div>
        
        <div className={styles.team_logo_wrapper}>
          <img
            src={getTeamLogoPath(away.team_name)}
            alt={away.team_name}
            className={styles.team_logo}
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = "/assets/logos/default.png";
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default memo(BroadcastScoreboard);
