import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/TeamSelectionPage.css';
import Footer from "../components/Footer";
import { fetchTeams } from "../utils/api";
import { getPlayerImagePath } from "../utils/playerUtils";

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
          // Find appropriate default teams (using celtics24 and nuggets23 if available)
          const celtics = teamsData.find(t => t.id === 'celtics24') || teamsData[0];
          const nuggets = teamsData.find(t => t.id === 'nuggets23') || 
                          (teamsData.length > 1 ? teamsData[1] : teamsData[0]);
          
          setHomeTeam(celtics);
          setAwayTeam(nuggets);
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

  // Get background style based on selected teams
  const getBackgroundStyle = () => {
    if (!homeTeam || !awayTeam) return {};
    
    return {
      backgroundColor: '#f8f9fa'  // Simple solid color instead of gradient
    };
  };

  // Get button style based on team color
  const getButtonStyle = (team) => {
    if (!team) return {};
    
    return {
      backgroundColor: team.colors?.primary,
      color: '#ffffff'
    };
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
    <div className="team-selection-container" style={getBackgroundStyle()}>
      <div className="matchup-header">
        <h1>Team Selection</h1>
      </div>
      
      <div className="court-graphic">
        <div className="center-circle"></div>
        <div className="center-line"></div>
      </div>
      
      <div className="teams-comparison">
        <div 
          className="team-card home-team"
          style={{
            borderColor: homeTeam.colors?.primary || '#333'
          }}
        >
          <div className="team-card-header" style={{ color: homeTeam.colors?.primary || '#333' }}>
            <h2>HOME</h2>
          </div>
          
          <div className="team-selector">
            <select 
              value={homeTeam.id} 
              onChange={handleHomeTeamChange}
              style={{ borderColor: homeTeam.colors?.primary || '#333' }}
            >
              {availableTeams.map(team => (
                <option key={`home-${team.id}`} value={team.id}>
                  {team.name} ({team.season})
                </option>
              ))}
            </select>
          </div>

          <div className="team-card-content">
            <div className="team-logo-background">
              <img 
                src={homeTeam.logoUrl} 
                alt={`${homeTeam.name} logo`} 
                className="team-logo-bg"
                onError={(e) => {
                  e.target.src = "/assets/logos/default.png";
                }}
              />
            </div>
          </div>
        </div>

        <div 
          className="team-card away-team"
          style={{
            borderColor: awayTeam.colors?.primary || '#333'
          }}
        >
          <div className="team-card-header" style={{ color: awayTeam.colors?.primary || '#333' }}>
            <h2>AWAY</h2>
          </div>
          
          <div className="team-selector">
            <select 
              value={awayTeam.id} 
              onChange={handleAwayTeamChange}
              style={{ borderColor: awayTeam.colors?.primary || '#333' }}
            >
              {availableTeams.map(team => (
                <option key={`away-${team.id}`} value={team.id}>
                  {team.name} ({team.season})
                </option>
              ))}
            </select>
          </div>

          <div className="team-card-content">
            <div className="team-logo-background">
              <img 
                src={awayTeam.logoUrl} 
                alt={`${awayTeam.name} logo`} 
                className="team-logo-bg"
                onError={(e) => {
                  e.target.src = "/assets/logos/default.png";
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* New position-based lineup comparison */}
      <div className="position-matchups">
        {['PG', 'SG', 'SF', 'PF', 'C'].map((position, index) => {
          const homePlayerId = homeTeam.starting_lineup?.[index];
          const awayPlayerId = awayTeam.starting_lineup?.[index];
          const homePlayer = homeTeam.players?.[homePlayerId];
          const awayPlayer = awayTeam.players?.[awayPlayerId];

          return (
            <div className="position-row" key={position}>
              <div className="player-matchup home-player">
                {homePlayer ? (
                  <>
                    <div className="player-icon-container" style={{ borderColor: homeTeam.colors?.primary || '#333' }}>
                      <img 
                        src={getPlayerImagePath(homePlayer.player_name, homeTeam.name)}
                        alt={homePlayer.player_name}
                        className="player-icon"
                        onError={(e) => {
                          e.target.src = "/assets/players/default.png";
                        }}
                      />
                    </div>
                    <div className="player-details">
                      <div className="player-name">{homePlayer.player_name}</div>
                      <div className="player-number">#{homePlayer.jersey_number}</div>
                    </div>
                  </>
                ) : (
                  <div className="empty-player">No Player</div>
                )}
              </div>
              
              <div className="position-indicator" style={{ 
                backgroundColor: '#495057', // Neutral dark gray color instead of team colors
                color: '#fff'
              }}>
                {position}
              </div>
              
              <div className="player-matchup away-player">
                {awayPlayer ? (
                  <>
                    <div className="player-details text-right">
                      <div className="player-name">{awayPlayer.player_name}</div>
                      <div className="player-number">#{awayPlayer.jersey_number}</div>
                    </div>
                    <div className="player-icon-container" style={{ borderColor: awayTeam.colors?.primary || '#333' }}>
                      <img 
                        src={getPlayerImagePath(awayPlayer.player_name, awayTeam.name)}
                        alt={awayPlayer.player_name}
                        className="player-icon"
                        onError={(e) => {
                          e.target.src = "/assets/players/default.png";
                        }}
                      />
                    </div>
                  </>
                ) : (
                  <div className="empty-player">No Player</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="simulation-options">
        <div className="sim-buttons">
          <button 
            className="sim-button quick-sim"
            onClick={() => handleStartSimulation('quick')}
            style={getButtonStyle(awayTeam)}
          >
            Quick Simulation
            <span className="button-desc">Skip to final results</span>
          </button>
          
          <button 
            className="sim-button full-sim"
            onClick={() => handleStartSimulation('full')}
            style={getButtonStyle(homeTeam)}
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
