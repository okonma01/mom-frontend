import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/TeamSelectionPage.css';

function TeamSelectionPage() {
  const [teams, setTeams] = useState(['celtics', 'nuggets']);
  const [homeTeam, setHomeTeam] = useState('');
  const [awayTeam, setAwayTeam] = useState('');
  const navigate = useNavigate();

  // Typically you would fetch teams from an API
  // This is a simplified version
  useEffect(() => {
    setHomeTeam(teams[0]);
    setAwayTeam(teams[1]);
  }, [teams]);

  const handleStartSimulation = () => {
    // In a real app, you might create a new game or load an existing one
    // For now, we'll just navigate to the predefined game
    navigate('/game/g9YJw');
  };

  return (
    <div className="team-selection-container">
      <h1>Select Teams</h1>
      
      <div className="teams-container">
        <div className="team-selector">
          <h2>Home Team</h2>
          <select 
            value={homeTeam} 
            onChange={(e) => setHomeTeam(e.target.value)}
          >
            {teams.map(team => (
              <option key={`home-${team}`} value={team}>
                {team.charAt(0).toUpperCase() + team.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div className="versus">VS</div>

        <div className="team-selector">
          <h2>Away Team</h2>
          <select 
            value={awayTeam} 
            onChange={(e) => setAwayTeam(e.target.value)}
          >
            {teams.map(team => (
              <option key={`away-${team}`} value={team}>
                {team.charAt(0).toUpperCase() + team.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <button 
        className="start-simulation-button"
        onClick={handleStartSimulation}
      >
        Start Simulation
      </button>
    </div>
  );
}

export default TeamSelectionPage;
