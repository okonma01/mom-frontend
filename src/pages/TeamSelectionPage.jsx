import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/TeamSelectionPage.css';
import Footer from "../components/Footer";
import { fetchTeams } from "../utils/api";

function TeamSelectionPage() {
  const [availableTeams, setAvailableTeams] = useState([]);
  const [homeTeam, setHomeTeam] = useState(null);
  const [awayTeam, setAwayTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const loadTeams = async () => {
      try {
        setLoading(true);
        const teamsData = await fetchTeams();
        setAvailableTeams(teamsData);
        
        if (teamsData.length >= 2) {
          setHomeTeam(teamsData[0]);
          setAwayTeam(teamsData[1]);
        }
        setLoading(false);
      } catch (error) {
        console.error("Error loading teams:", error);
        setLoading(false);
      }
    };
    
    loadTeams();
  }, []);

  const handleHomeTeamChange = (e) => {
    const teamId = e.target.value;
    const selected = availableTeams.find(team => team.id === teamId);
    setHomeTeam(selected);
  };

  const handleAwayTeamChange = (e) => {
    const teamId = e.target.value;
    const selected = availableTeams.find(team => team.id === teamId);
    setAwayTeam(selected);
  };

  const handleStartSimulation = (mode) => {
    if (!homeTeam || !awayTeam) return;
    
    // Create a game ID (in a real app this might come from the backend)
    const gameId = "gkRPr"; // Placeholder - would be generated
    
    // Store simulation parameters
    localStorage.setItem('simulationMode', mode);
    localStorage.setItem('homeTeamId', homeTeam.id);
    localStorage.setItem('awayTeamId', awayTeam.id);
    
    if (mode === 'quick') {
      navigate(`/summary/${gameId}`);
    } else {
      navigate(`/game/${gameId}`);
    }
  };

  if (loading) {
    return (
      <div className="team-selection-loading">
        <div className="loader"></div>
        <p>Loading teams...</p>
      </div>
    );
  }

  if (!homeTeam || !awayTeam) {
    return (
      <div className="team-selection-error">
        <p>Unable to load teams. Please try again later.</p>
      </div>
    );
  }

  return (
    <div className="team-selection-container">
      <div className="matchup-header">
        <h1>Team Selection</h1>
      </div>
      
      <div className="teams-comparison">
        <div 
          className="team-card home-team"
          style={{
            borderColor: homeTeam.colors?.primary || '#333'
          }}
        >
          <div className="team-selector">
            <h2>Home Team</h2>
            <select 
              value={homeTeam.id} 
              onChange={handleHomeTeamChange}
            >
              {availableTeams.map(team => (
                <option key={`home-${team.id}`} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>
          </div>

          <div className="team-card-content">
            <div className="team-logo-container">
              <img 
                src={homeTeam.logoUrl} 
                alt={`${homeTeam.name} logo`} 
                className="team-logo"
                onError={(e) => {
                  e.target.src = "https://via.placeholder.com/150?text=Team+Logo";
                }}
              />
            </div>

            <div className="team-info">
              <div className="team-record">{homeTeam.record || "0-0"}</div>
              
              <div className="team-stats">
                <div className="stat">
                  <span className="stat-value">{homeTeam.ppg}</span>
                  <span className="stat-label">PPG</span>
                </div>
                <div className="stat">
                  <span className="stat-value">{homeTeam.rpg}</span>
                  <span className="stat-label">RPG</span>
                </div>
                <div className="stat">
                  <span className="stat-value">{homeTeam.apg}</span>
                  <span className="stat-label">APG</span>
                </div>
              </div>
              
              <div className="key-players">
                <h3>Key Players</h3>
                <ul>
                  {homeTeam.keyPlayers?.slice(0, 2).map(player => (
                    <li key={player.id}>
                      <span className="player-name">{player.name}</span>
                      <span className="player-rating">{player.rating}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="versus-container">
          <div className="versus">VS</div>
        </div>

        <div 
          className="team-card away-team"
          style={{
            borderColor: awayTeam.colors?.primary || '#333'
          }}
        >
          <div className="team-selector">
            <h2>Away Team</h2>
            <select 
              value={awayTeam.id} 
              onChange={handleAwayTeamChange}
            >
              {availableTeams.map(team => (
                <option key={`away-${team.id}`} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>
          </div>

          <div className="team-card-content">
            <div className="team-logo-container">
              <img 
                src={awayTeam.logoUrl} 
                alt={`${awayTeam.name} logo`} 
                className="team-logo"
                onError={(e) => {
                  e.target.src = "https://via.placeholder.com/150?text=Team+Logo";
                }}
              />
            </div>

            <div className="team-info">
              <div className="team-record">{awayTeam.record || "0-0"}</div>
              
              <div className="team-stats">
                <div className="stat">
                  <span className="stat-value">{awayTeam.ppg}</span>
                  <span className="stat-label">PPG</span>
                </div>
                <div className="stat">
                  <span className="stat-value">{awayTeam.rpg}</span>
                  <span className="stat-label">RPG</span>
                </div>
                <div className="stat">
                  <span className="stat-value">{awayTeam.apg}</span>
                  <span className="stat-label">APG</span>
                </div>
              </div>
              
              <div className="key-players">
                <h3>Key Players</h3>
                <ul>
                  {awayTeam.keyPlayers?.slice(0, 2).map(player => (
                    <li key={player.id}>
                      <span className="player-name">{player.name}</span>
                      <span className="player-rating">{player.rating}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="simulation-options">
        <div className="sim-buttons">
          <button 
            className="sim-button quick-sim"
            onClick={() => handleStartSimulation('quick')}
          >
            Quick Simulation
            <span className="button-desc">Skip to final results</span>
          </button>
          
          <button 
            className="sim-button full-sim"
            onClick={() => handleStartSimulation('full')}
          >
            Full Simulation
            <span className="button-desc">Watch play-by-play action</span>
          </button>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default TeamSelectionPage;
