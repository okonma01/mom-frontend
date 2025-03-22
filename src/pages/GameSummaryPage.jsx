import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import '../styles/GameSummaryPage.css';

function GameSummaryPage() {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const [gameData, setGameData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [finalStats, setFinalStats] = useState(null);

  // Load game data
  useEffect(() => {
    const fetchGame = async () => {
      try {
        console.log("Fetching game summary data...");
        const response = await fetch(`/game_${gameId}.json`);
        const data = await response.json();
        console.log("Game summary data loaded:", data);
        setGameData(data);
        
        // Find the game_over event to get final scores
        const gameOverEvent = data.events.find(event => event.event_type === 'game_over');
        if (gameOverEvent) {
          setFinalStats({
            homeScore: gameOverEvent.details.home_score,
            awayScore: gameOverEvent.details.away_score
          });
        }
        
        setLoading(false);
      } catch (error) {
        console.error("Error loading game summary data:", error);
        setLoading(false);
      }
    };

    fetchGame();
  }, [gameId]);

  const handlePlayAgain = () => {
    navigate('/select-teams');
  };

  const handleWatchReplay = () => {
    navigate(`/game/${gameId}`);
  };

  if (loading) {
    return <div className="loading">Loading summary...</div>;
  }

  if (!gameData || !finalStats) {
    console.error("Game summary data or final stats are null or undefined");
    return <div className="error">Failed to load game summary</div>;
  }

  const homeTeam = gameData.game_info.teams[0].team_name;
  const awayTeam = gameData.game_info.teams[1].team_name;
  const winner = finalStats.homeScore > finalStats.awayScore ? homeTeam : awayTeam;

  console.log("Rendering GameSummaryPage with data:", { gameData, finalStats, homeTeam, awayTeam, winner });

  return (
    <div className="game-summary-container">
      <h1>Game Summary</h1>
      
      <div className="final-score">
        <div className="team home-team">
          <h2>{homeTeam.charAt(0).toUpperCase() + homeTeam.slice(1)}</h2>
          <div className="score">{finalStats.homeScore}</div>
        </div>
        
        <div className="vs">VS</div>
        
        <div className="team away-team">
          <h2>{awayTeam.charAt(0).toUpperCase() + awayTeam.slice(1)}</h2>
          <div className="score">{finalStats.awayScore}</div>
        </div>
      </div>
      
      <div className="result-message">
        <h3>{winner.charAt(0).toUpperCase() + winner.slice(1)} wins!</h3>
      </div>
      
      <div className="key-stats">
        <h3>Key Stats</h3>
        {/* You would calculate and display key stats here */}
        {/* For now, using placeholder stats */}
        <div className="stats-comparison">
          <div className="stat-item">
            <div className="stat-label">Field Goal %</div>
            <div className="stat-values">
              <span className="home-stat">45%</span>
              <span className="away-stat">48%</span>
            </div>
          </div>
          <div className="stat-item">
            <div className="stat-label">3-Point %</div>
            <div className="stat-values">
              <span className="home-stat">38%</span>
              <span className="away-stat">42%</span>
            </div>
          </div>
          <div className="stat-item">
            <div className="stat-label">Rebounds</div>
            <div className="stat-values">
              <span className="home-stat">42</span>
              <span className="away-stat">38</span>
            </div>
          </div>
          <div className="stat-item">
            <div className="stat-label">Assists</div>
            <div className="stat-values">
              <span className="home-stat">24</span>
              <span className="away-stat">26</span>
            </div>
          </div>
          <div className="stat-item">
            <div className="stat-label">Turnovers</div>
            <div className="stat-values">
              <span className="home-stat">12</span>
              <span className="away-stat">10</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="summary-actions">
        <button onClick={handlePlayAgain} className="play-again-button">
          New Game
        </button>
        <button onClick={handleWatchReplay} className="watch-replay-button">
          Watch Replay
        </button>
      </div>
    </div>
  );
}

export default GameSummaryPage;
