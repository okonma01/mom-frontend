import React, { useEffect, useRef, useState } from 'react';
import { getAssetPath } from '../utils/paths';
import '../styles/BroadcastEventFeed.css';

const getPlayerImagePath = (playerId, gameInfo) => {
  // Find the player in game info to get their name and team
  let playerName = "";
  let teamName = "";
  
  for (const team of gameInfo.teams || []) {
    for (const player of team.players || []) {
      if (player.player_id === playerId) {
        playerName = player.player_name || "";
        teamName = team.team_name;
        break;
      }
    }
    if (playerName) break;
  }
  
  if (!playerName || !teamName) {
    return "/assets/player icons/celtics24/default.png";
  }
  
  // Format player name: "First Last" -> "first-last"
  const formattedName = playerName
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/\./g, '') // Remove periods
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, ""); // Remove diacritics
  
  // Split team name to just the last part, e.g., "Boston Celtics" -> "celtics"
  const formattedTeamName = teamName.split(' ').pop().toLowerCase();
  const playerImagePath = `/assets/player icons/${formattedTeamName}/${formattedName}.png`;

  // Check if the player's icon exists
  const img = new Image();
  img.src = playerImagePath;
  img.onerror = () => {
    return `/assets/player icons/${formattedTeamName}/default.png`;
  };

  return playerImagePath;
};

const BroadcastEventFeed = ({ events, gameInfo }) => {
  const feedRef = useRef(null);
  const eventsEndRef = useRef(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [highlightedEvent, setHighlightedEvent] = useState(null);
  
  // Auto-scroll to the bottom when new events come in
  useEffect(() => {
    if (eventsEndRef.current && events.length > 0) {
      eventsEndRef.current.scrollIntoView({ behavior: 'smooth' });
      
      // Highlight the latest event
      setHighlightedEvent(events.length - 1);
      setTimeout(() => setHighlightedEvent(null), 3000);
    }
  }, [events.length]);

  // Helper to get team info from team_id
  const getTeamInfo = (teamId) => {
    if (!gameInfo || !gameInfo.teams) return { name: 'Team', shortName: 'TEAM' };
    
    const team = gameInfo.teams[teamId];
    return {
      name: team.team_name,
      shortName: team.abbreviation || team.team_name.substring(0, 3).toUpperCase()
    };
  };

  // Helper to get player name from player_id
  const getPlayerName = (playerId) => {
    if (!playerId) return '';
    
    // Try to find player in game info
    for (const team of gameInfo.teams || []) {
      for (const player of team.players || []) {
        if (player.player_id === playerId) {
          return player.player_name || `Player ${playerId}`;
        }
      }
    }
    
    // If not found, return the ID as a fallback
    return `Player ${playerId}`;
  };

  // Format event description in a broadcast style
  const formatEventDescription = (event) => {
    if (!event) return '';

    const team = getTeamInfo(event.team_id);
    const playerName = getPlayerName(event.player_id);
    
    switch (event.event_type) {
      case 'shot_made':
        if (event.details.shot_type === 'fga_threepoint') {
          return (
            <span className="event-highlight">
              <span className="player-name">{playerName}</span> knocks down a three pointer!
              {event.details.assist_player_id && 
                <span className="assist"> (Assist: {getPlayerName(event.details.assist_player_id)})</span>}
            </span>
          );
        } else if (event.details.points === 2) {
          const isInside = event.details.shot_type === 'fga_inside';
          return (
            <span>
              <span className="player-name">{playerName}</span> 
              {isInside ? ' scores in the paint' : ' hits the jumper'}
              {event.details.assist_player_id && 
                <span className="assist"> (Assist: {getPlayerName(event.details.assist_player_id)})</span>}
            </span>
          );
        }
        return (
          <span>
            <span className="player-name">{playerName}</span> scores
            {event.details.assist_player_id && 
              <span className="assist"> (Assist: {getPlayerName(event.details.assist_player_id)})</span>}
          </span>
        );
      
      case 'shot_missed':
        return (
          <span>
            <span className="player-name">{playerName}</span> misses 
            {event.details.shot_type === 'fga_threepoint' ? ' the three-point attempt' : ' the shot'}
          </span>
        );
      
      case 'free_throw':
        return (
          <span>
            <span className="player-name">{playerName}</span> 
            {event.details.made ? ' makes' : ' misses'} free throw {event.details.free_throw_num} of {event.details.total_free_throws}
          </span>
        );
      
      case 'rebound':
        const reboundType = event.details.rebound_type === 'offensive' ? 'offensive' : 'defensive';
        return (
          <span>
            <span className="player-name">{playerName}</span> grabs the {reboundType} rebound
          </span>
        );
      
      case 'turnover':
        if (event.details.steal_player_id) {
          return (
            <span>
              <span className="player-name">{playerName}</span> turns it over, 
              stolen by <span className="player-name">{getPlayerName(event.details.steal_player_id)}</span>
            </span>
          );
        }
        return <span><span className="player-name">{playerName}</span> turnover</span>;
      
      case 'quarter_end':
        return (
          <span className="period-marker">
            End of Quarter {event.details.quarter}
          </span>
        );
      
      case 'game_over':
        const winningTeamId = event.details.home_score > event.details.away_score ? 0 : 1;
        const winningTeam = getTeamInfo(winningTeamId);
        const winningScore = Math.max(event.details.home_score, event.details.away_score);
        const losingScore = Math.min(event.details.home_score, event.details.away_score);
        
        return (
          <span className="period-marker">
            GAME OVER - {winningTeam.name} wins {winningScore}-{losingScore}
          </span>
        );
      
      case 'tip_off':
        return <span><span className="player-name">{playerName}</span> wins the tip-off</span>;
      
      case 'substitution':
        return (
          <span>
            <span className="player-name">{getPlayerName(event.details.player_in_id)}</span> checks in for 
            <span className="player-name"> {getPlayerName(event.details.player_out_id)}</span>
          </span>
        );
        
      default:
        return <span>{event.event_type} by {playerName}</span>;
    }
  };

  const getEventClassNames = (event, index) => {
    let classNames = 'broadcast-event';
    
    if (highlightedEvent === index) {
      classNames += ' event-highlight-animation';
    }
    
    if (event.event_type === 'quarter_end' || event.event_type === 'game_over') {
      classNames += ' event-period';
    } else if (event.event_type === 'shot_made') {
      classNames += ' event-score';
      
      if (event.details.shot_type === 'fga_threepoint') {
        classNames += ' event-three';
      }
    } else if (event.event_type === 'turnover' && event.details.steal_player_id) {
      classNames += ' event-steal';
    }
    
    return classNames;
  };

  // Get icon for event type
  const getEventIcon = (event) => {
    return ''; // Removed emojis
  };

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div className={`broadcast-feed-container ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="broadcast-header" onClick={toggleCollapse}>
        <h3>BROADCAST</h3>
        <div className="live-indicator">
          <span className="live-dot"></span>
          LIVE
        </div>
      </div>
      
      <div className="broadcast-content" ref={feedRef}>
        <div className="broadcast-events">
          {events.map((event, index) => {
            let playerId = event.player_id;
            let teamShortName = getTeamInfo(event.team_id).shortName;
            if (event.event_type === 'turnover') {
              playerId = event.details.steal_player_id;
              teamShortName = getTeamInfo(1 - +event.team_id).shortName;
            } else if (event.event_type === 'substitution') {
              playerId = event.details.player_in_id;
            }
            return (
            <div 
              key={index} 
              className={getEventClassNames(event, index)}
            >
              {event.player_id && (
                <img 
                  src={getPlayerImagePath(playerId, gameInfo)} 
                  alt="Player" 
                  className="player-icon"
                  onError={(e) => {
                    e.target.onerror = null; 
                    e.target.src = "/assets/players/default.png";
                  }} 
                />
              )}
              <div className="event-time">
                {event.quarter}Q {event.timestamp}
              </div>
              <div className="event-icon">{getEventIcon(event)}</div>
              <div className="event-team">
                {teamShortName}
              </div>
              <div className="event-description">
                {formatEventDescription(event)}
              </div>
            </div>
          )})}
          <div ref={eventsEndRef} />
        </div>
      </div>
    </div>
  );
};

export default BroadcastEventFeed;
