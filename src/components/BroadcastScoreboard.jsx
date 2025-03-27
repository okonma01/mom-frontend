import React from "react";
import { getTeamLogoPath } from "../utils/teamUtils";
import styles from "../styles/BroadcastScoreboard.module.css";

const BroadcastScoreboard = ({ gameInfo, scores, currentTime, teamColors }) => {
  const home = gameInfo.teams[0];
  const away = gameInfo.teams[1];

  // Mock records for design purposes (would come from actual data in production)
  const homeRecord = gameInfo.teams[0].record || "";
  const awayRecord = gameInfo.teams[1].record || "";

  return (
    <div className={styles.broadcast_scoreboard}>
      <div
        className={styles.scoreboard_left}
        style={{
          backgroundColor: teamColors[0]?.primary || "#f8f9fa",
          color: teamColors[0]?.secondary || "#212529",
        }}
      >
        <div className={styles.team_record}>{homeRecord}</div>
        <img
          src={getTeamLogoPath(home.team_name)}
          alt={home.team_name}
          className={styles.team_logo}
        />
        <div className={styles.team_name}>{home.team_name}</div>
      </div>

      <div className={styles.scoreboard_center}>
        <div className={styles.score_display}>
          <div className={`${styles.score} ${styles.home_score}`}>
            {scores.home}
          </div>
          <div className={styles.score_divider}>-</div>
          <div className={`${styles.score} ${styles.away_score}`}>
            {scores.away}
          </div>
        </div>
        <div className={styles.time_display}>
          <div className={styles.quarter_indicator}>Q{currentTime.quarter}</div>
          <div className={styles.time_remaining}>{currentTime.timestamp}</div>
        </div>
      </div>

      <div
        className={styles.scoreboard_right}
        style={{
          backgroundColor: teamColors[1]?.primary || "#f8f9fa",
          color: teamColors[1]?.secondary || "#212529",
        }}
      >
        <div className={styles.team_record}>{awayRecord}</div>
        <img
          src={getTeamLogoPath(away.team_name)}
          alt={away.team_name}
          className={styles.team_logo}
        />
        <div className={styles.team_name}>{away.team_name}</div>
      </div>
    </div>
  );
};

export default BroadcastScoreboard;
