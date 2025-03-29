import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from '../styles/TeamSelectionPage.module.css';
import Footer from "../components/Footer";
import { fetchTeams } from "../utils/api";
import { getPlayerImagePath, getPlayerFirstName, getPlayerLastName } from "../utils/playerUtils";

function TeamSelectionPage() {
  const [availableTeams, setAvailableTeams] = useState([]);
  const [homeTeam, setHomeTeam] = useState(null);
  const [awayTeam, setAwayTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeDropdown, setActiveDropdown] = useState(null); // 'home', 'away', or null
  const navigate = useNavigate();

  useEffect(() => {
    const loadTeams = async () => {
      try {
        setLoading(true);
        const teamsData = await fetchTeams();
        setAvailableTeams(teamsData);
        
        if (teamsData.length >= 2) {
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
    setActiveDropdown(null); // Hide dropdown after selection
  };

  const handleAwayTeamChange = (e) => {
    const teamId = e.target.value;
    const selected = availableTeams.find(team => team.id === teamId);
    setAwayTeam(selected);
    setActiveDropdown(null); // Hide dropdown after selection
  };

  const toggleDropdown = (team) => {
    if (activeDropdown === team) {
      setActiveDropdown(null);
    } else {
      setActiveDropdown(team);
    }
  };

  const handleStartSimulation = (mode) => {
    if (!homeTeam || !awayTeam) return;
    
    const gameId = "gkRPr"; // Placeholder - would be generated
    
    localStorage.setItem('simulationMode', mode);
    localStorage.setItem('homeTeamId', homeTeam.id);
    localStorage.setItem('awayTeamId', awayTeam.id);
    
    if (mode === 'quick') {
      navigate(`/summary/${gameId}`);
    } else {
      navigate(`/game/${gameId}`);
    }
  };

  const getBackgroundStyle = () => {
    if (!homeTeam || !awayTeam) return {};
    
    return {
      backgroundColor: '#f8f9fa'
    };
  };

  const getButtonStyle = (team) => {
    if (!team) return {};
    
    return {
      backgroundColor: team.colors?.primary,
      color: '#ffffff'
    };
  };

  if (loading) {
    return (
      <div className={styles.team_selection_loading}>
        <div className={styles.loader}></div>
        <p>Loading teams...</p>
      </div>
    );
  }

  if (!homeTeam || !awayTeam) {
    return (
      <div className={styles.team_selection_error}>
        <p>Unable to load teams. Please try again later.</p>
      </div>
    );
  }

  return (
    <div className={styles.team_selection_container} style={getBackgroundStyle()}>
      <div className={styles.matchup_header}>
        <h1>Team Selection</h1>
      </div>
      
      <div className={styles.court_graphic}>
        <div className={styles.center_circle}></div>
        <div className={styles.center_line}></div>
      </div>
      
      <div className={styles.teams_comparison}>
        <div 
          className={`${styles.team_card} ${styles.home_team}`}
          style={{
            borderColor: homeTeam.colors?.primary || '#333'
          }}
        >
          <div className={styles.team_card_header} style={{ color: homeTeam.colors?.primary || '#333' }}>
            <h2>HOME</h2>
          </div>
          
          <div className={styles.team_card_content}>
            <div 
              className={styles.team_logo_button} 
              onClick={() => toggleDropdown('home')}
            >
              <img 
                src={homeTeam.logoUrl} 
                alt={`${homeTeam.name} logo`} 
                className={styles.team_logo}
                onError={(e) => {
                  e.target.src = "/assets/logos/default.png";
                }}
              />
            </div>
            
            {activeDropdown === 'home' && (
              <div className={styles.team_selector}>
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
            )}
          </div>
        </div>

        <div 
          className={`${styles.team_card} ${styles.away_team}`}
          style={{
            borderColor: awayTeam.colors?.primary || '#333'
          }}
        >
          <div className={styles.team_card_header} style={{ color: awayTeam.colors?.primary || '#333' }}>
            <h2>AWAY</h2>
          </div>
          
          <div className={styles.team_card_content}>
            <div 
              className={styles.team_logo_button} 
              onClick={() => toggleDropdown('away')}
            >
              <img 
                src={awayTeam.logoUrl} 
                alt={`${awayTeam.name} logo`} 
                className={styles.team_logo}
                onError={(e) => {
                  e.target.src = "/assets/logos/default.png";
                }}
              />
            </div>
            
            {activeDropdown === 'away' && (
              <div className={styles.team_selector}>
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
            )}
          </div>
        </div>
      </div>

      <div className={styles.position_matchups}>
        {['PG', 'SG', 'SF', 'PF', 'C'].map((position, index) => {
          const homePlayerId = homeTeam.starting_lineup?.[index];
          const awayPlayerId = awayTeam.starting_lineup?.[index];
          const homePlayer = homeTeam.players?.[homePlayerId];
          const awayPlayer = awayTeam.players?.[awayPlayerId];

          return (
            <div className={styles.position_row} key={position}>
              <div className={`${styles.player_matchup} ${styles.home_player}`}>
                {homePlayer ? (
                  <>
                    <div className={styles.player_details}>
                      <div className={styles.player_name}>{getPlayerFirstName(homePlayer.player_name)}</div>
                      <div className={`${styles.player_name} ${styles.player_last_name}`}>{getPlayerLastName(homePlayer.player_name)}</div>
                    </div>
                    <div className={styles.player_icon_container} style={{ borderColor: homeTeam.colors?.primary || '#333' }}>
                      <img 
                        src={getPlayerImagePath(homePlayer.player_name, homeTeam.name)}
                        alt={homePlayer.player_name}
                        className={styles.player_icon}
                        onError={(e) => {
                          e.target.src = "/assets/players/default.png";
                        }}
                      />
                    </div>
                  </>
                ) : (
                  <div className={styles.empty_player}>No Player</div>
                )}
              </div>
              
              <div className={styles.position_indicator}>
                {position}
              </div>
              
              <div className={`${styles.player_matchup} ${styles.away_player}`}>
                {awayPlayer ? (
                  <>
                    <div className={styles.player_icon_container} style={{ borderColor: awayTeam.colors?.primary || '#333' }}>
                      <img 
                        src={getPlayerImagePath(awayPlayer.player_name, awayTeam.name)}
                        alt={awayPlayer.player_name}
                        className={styles.player_icon}
                        onError={(e) => {
                          e.target.src = "/assets/players/default.png";
                        }}
                      />
                    </div>
                    <div className={`${styles.player_details}`}>
                      <div className={styles.player_name}>{getPlayerFirstName(awayPlayer.player_name)}</div>
                      <div className={`${styles.player_name} ${styles.player_last_name}`}>{getPlayerLastName(awayPlayer.player_name)}</div>
                    </div>
                  </>
                ) : (
                  <div className={styles.empty_player}>No Player</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className={styles.simulation_options}>
        <div className={styles.sim_buttons}>
          <button 
            className={`${styles.sim_button} ${styles.quick_sim}`}
            onClick={() => handleStartSimulation('quick')}
            style={getButtonStyle(awayTeam)}
          >
            Quick Simulation
            <span className={styles.button_desc}>Skip to final results</span>
          </button>
          
          <button 
            className={`${styles.sim_button} ${styles.full_sim}`}
            onClick={() => handleStartSimulation('full')}
            style={getButtonStyle(homeTeam)}
          >
            Full Simulation
            <span className={styles.button_desc}>Watch play-by-play action</span>
          </button>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default TeamSelectionPage;
