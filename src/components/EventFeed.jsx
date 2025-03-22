import React, { useEffect, useRef } from 'react';
import '../styles/EventFeed.css';

function EventFeed({ events, gameInfo }) {
  const eventsEndRef = useRef(null);

  // Automatically scroll to the most recent event when events change
  useEffect(() => {
    if (eventsEndRef.current) {
      eventsEndRef.current.scrollIntoView(); // remove smooth scrolling
    }
  }, [events]);

  if (!events || events.length === 0) {
    return <div className="event-feed">No events to display</div>;
  }

  // Build a map of player IDs to player names
  const playerMap = gameInfo.teams.reduce((acc, team) => {
    team.players.forEach((p) => {
      acc[p.player_id] = p.player_name;
    });
    return acc;
  }, {});

  const formatEventDescription = (event) => {
    const teamName = event.team_id === 0 
      ? gameInfo.teams[0].team_name 
      : gameInfo.teams[1].team_name;
    
    const teamNameCapitalized = teamName.charAt(0).toUpperCase() + teamName.slice(1);
    const playerName = playerMap[event.player_id] || event.player_id;
    
    switch (event.event_type) {
      case 'tip_off':
        return `${teamNameCapitalized} win the tip-off`;
      
      case 'shot_made':
        const pointsText = event.details.points === 3 ? '3-pointer' : 
                         event.details.points === 2 && event.details.shot_type === 'fga_midrange' ? 'mid-range jumper' : 
                         'layup';
        
        if (event.details.assist_player_id) {
          const assistPlayerName = playerMap[event.details.assist_player_id] || event.details.assist_player_id;
          return `${teamNameCapitalized}: ${playerName} makes a ${pointsText} (Assist: ${assistPlayerName})`;
        }
        return `${teamNameCapitalized}: ${playerName} makes a ${pointsText}`;
      
      case 'shot_missed':
        const missType = event.details.shot_type === 'fga_threepoint' ? '3-pointer' : 
                      event.details.shot_type === 'fga_midrange' ? 'mid-range jumper' : 
                      'shot';
        return `${teamNameCapitalized}: ${playerName} misses a ${missType}`;
      
      case 'rebound':
        const reboundType = event.details.rebound_type === 'offensive' ? 'offensive' : 'defensive';
        return `${teamNameCapitalized}: ${playerName} grabs a ${reboundType} rebound`;
      
      case 'free_throw':
        const ftResult = event.details.made ? 'makes' : 'misses';
        return `${teamNameCapitalized}: ${playerName} ${ftResult} free throw ${event.details.free_throw_num} of ${event.details.total_free_throws}`;
      
      case 'turnover':
        if (event.details.steal_player_id) {
          const stealPlayerName = playerMap[event.details.steal_player_id] || event.details.steal_player_id;
          return `${teamNameCapitalized}: ${playerName} turns the ball over (stolen by ${stealPlayerName})`;
        }
        return `${teamNameCapitalized}: ${playerName} turns the ball over`;
      
      case 'quarter_end':
        return `End of Quarter ${event.details.quarter}`;
      
      case 'game_over':
        return 'Game Over';
      
      default:
        return `${event.event_type} by ${playerName}`;
    }
  };

  return (
    <div className="event-feed">
      <h3>Play-by-Play</h3>
      <div className="events-list">
        {events.map((event, index) => (
          <div key={index} className="event-item">
            <div className="event-time">
              {event.quarter}Q {event.timestamp}
            </div>
            <div className="event-description">
              {formatEventDescription(event)}
            </div>
          </div>
        ))}
        <div ref={eventsEndRef} />
      </div>
    </div>
  );
}

export default EventFeed;
