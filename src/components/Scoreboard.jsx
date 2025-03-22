import React from 'react';
import '../styles/Scoreboard.css';

function Scoreboard({ 
  homeTeam, 
  awayTeam, 
  homeScore, 
  awayScore, 
  quarter, 
  timeRemaining,
  possession 
}) {
  return (
    <div className="scoreboard">
      <div className={`team home-team ${possession === 0 ? 'has-possession' : ''}`}>
        <div className="team-name">{homeTeam.charAt(0).toUpperCase() + homeTeam.slice(1)}</div>
        <div className="team-score">{homeScore}</div>
      </div>
      
      <div className="game-info">
        <div className="quarter">Q{quarter}</div>
        <div className="time-remaining">{timeRemaining}</div>
      </div>
      
      <div className={`team away-team ${possession === 1 ? 'has-possession' : ''}`}>
        <div className="team-name">{awayTeam.charAt(0).toUpperCase() + awayTeam.slice(1)}</div>
        <div className="team-score">{awayScore}</div>
      </div>
    </div>
  );
}

export default React.memo(Scoreboard);
