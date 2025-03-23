import React from "react";
import { getTeamLogoPath } from "../utils/teamUtils";
import "../styles/BroadcastScoreboard.css";

const BroadcastScoreboard = ({ gameInfo, scores, currentTime, teamColors }) => {
  const home = gameInfo.teams[0];
  const away = gameInfo.teams[1];

  // Mock records for design purposes (would come from actual data in production)
  const homeRecord = gameInfo.teams[0].record || "";
  const awayRecord = gameInfo.teams[1].record || "";

  return (
    <div className="broadcast-scoreboard">
      <div
        className="scoreboard-left"
        style={{
          backgroundColor: teamColors[0]?.primary || "#f8f9fa",
          color: teamColors[0]?.secondary || "#212529",
        }}
      >
        <div className="team-record">{homeRecord}</div>
        <img
          src={getTeamLogoPath(home.team_name)}
          alt={home.team_name}
          className="team-logo"
        />
        <div className="team-name">{home.team_name}</div>
      </div>

      <div className="scoreboard-center">
        <div className="score-display">
          <div className="score home-score">{scores.home}</div>
          <div className="score-divider">-</div>
          <div className="score away-score">{scores.away}</div>
        </div>
        <div className="time-display">
          <div className="quarter-indicator">Q{currentTime.quarter}</div>
          <div className="time-remaining">{currentTime.timestamp}</div>
        </div>
      </div>

      <div
        className="scoreboard-right"
        style={{
          backgroundColor: teamColors[1]?.primary || "#f8f9fa",
          color: teamColors[1]?.secondary || "#212529",
        }}
      >
        <div className="team-record">{awayRecord}</div>
        <img
          src={getTeamLogoPath(away.team_name)}
          alt={away.team_name}
          className="team-logo"
        />
        <div className="team-name">{away.team_name}</div>
        <div className="live-indicator">
          <span className="live-dot"></span> LIVE
        </div>
      </div>
    </div>
  );
};

export default BroadcastScoreboard;
