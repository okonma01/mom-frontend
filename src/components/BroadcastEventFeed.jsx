import React, { useRef, useState, useMemo, memo, useEffect } from "react";
import styles from "../styles/BroadcastEventFeed.module.css";

// Move player image path generation outside the component to avoid recalculations
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

  const formattedTeamName = teamName.split(" ").pop().toLowerCase();

  if (!playerName || !formattedTeamName) {
    // return `/assets/player icons/${formattedTeamName}/default.png`;
  }

  // Format player name: "First Last" -> "first-last"
  const formattedName = playerName
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/\./g, "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

    return `/assets/player icons/${formattedTeamName}/${formattedName}.png`;

};

// Helper function to get team default image path
const getTeamDefaultPath = (playerId, gameInfo) => {
  let teamName = "";

  for (const team of gameInfo?.teams || []) {
    for (const player of team?.players || []) {
      if (player.player_id === playerId) {
        teamName = team.team_name;
        break;
      }
    }
    if (teamName) break;
  }

  const formattedTeamName = teamName ? 
    teamName.split(" ").pop().toLowerCase().replace(/\d+/g, '') : "";
  
  return formattedTeamName ? 
    `/assets/player icons/${formattedTeamName}/default.png` :
    `/assets/player icons/default.png`;
};

// Memoize the event description component to prevent unnecessary re-renders
const EventDescription = memo(({ event, getPlayerName, gameInfo }) => {
  const playerName = getPlayerName(event.player_id);

  switch (event.event_type) {
    case "shot_made":
      if (event.details.shot_type === "fga_threepoint") {
        return (
          <span className={styles.event_description}>
            <span className={styles.player_name}>{playerName}</span> knocks down
            a three pointer!
            {event.details.assist_player_id && (
              <span className={styles.assist}>
                {" "}
                (Assist: {getPlayerName(event.details.assist_player_id)})
              </span>
            )}
          </span>
        );
      } else if (event.details.points === 2) {
        const isInside = event.details.shot_type === "fga_inside";
        return (
          <span>
            <span className={styles.player_name}>{playerName}</span>
            {isInside ? " scores in the paint" : " hits the jumper"}
            {event.details.assist_player_id && (
              <span className={styles.assist}>
                {" "}
                (Assist: {getPlayerName(event.details.assist_player_id)})
              </span>
            )}
          </span>
        );
      }
      return (
        <span>
          <span className={styles.player_name}>{playerName}</span> scores
          {event.details.assist_player_id && (
            <span className={styles.assist}>
              {" "}
              (Assist: {getPlayerName(event.details.assist_player_id)})
            </span>
          )}
        </span>
      );

    case "shot_missed":
      return (
        <span>
          <span className={styles.player_name}>{playerName}</span> misses
          {event.details.shot_type === "fga_threepoint"
            ? " the three-point attempt"
            : " the shot"}
        </span>
      );

    case "free_throw":
      return (
        <span>
          <span className={styles.player_name}>{playerName}</span>
          {event.details.made ? " makes" : " misses"} free throw{" "}
          {event.details.free_throw_num} of {event.details.total_free_throws}
        </span>
      );

    case "rebound":
      const reboundType =
        event.details.rebound_type === "offensive" ? "offensive" : "defensive";
      return (
        <span>
          <span className={styles.player_name}>{playerName}</span> grabs the{" "}
          {reboundType} rebound
        </span>
      );

    case "turnover":
      if (event.details.steal_player_id) {
        return (
          <span>
            <span className={styles.player_name}>{playerName}</span> turns it
            over, stolen by{" "}
            <span className={styles.player_name}>
              {getPlayerName(event.details.steal_player_id)}
            </span>
          </span>
        );
      }
      return (
        <span>
          <span className={styles.player_name}>{playerName}</span> turnover
        </span>
      );

    case "quarter_end":
      return (
        <span className={styles.period_marker}>
          End of Q{event.details.quarter}
        </span>
      );

    case "game_over":
      const winningTeamId =
        event.details.home_score > event.details.away_score ? 0 : 1;
      const winningScore = Math.max(
        event.details.home_score,
        event.details.away_score
      );
      const losingScore = Math.min(
        event.details.home_score,
        event.details.away_score
      );
      const winningTeam =
        gameInfo?.teams?.[winningTeamId]?.team_name || "Home Team";

      return (
        <span className={styles.period_marker}>
          Game Over - {winningTeam} win {winningScore}-{losingScore}
        </span>
      );

    case "tip_off":
      return (
        <span>
          <span className={styles.player_name}>{playerName}</span> wins the
          tip-off
        </span>
      );

    case "substitution":
      return (
        <span>
          <span className={styles.player_name}>
            {getPlayerName(event.details.player_in_id)}
          </span>{" "}
          checks in for
          <span className={styles.player_name}>
            {" "}
            {getPlayerName(event.details.player_out_id)}
          </span>
        </span>
      );

    default:
      return (
        <span>
          {event.event_type} by {playerName}
        </span>
      );
  }
});

// Memoize the individual event item to prevent unnecessary re-renders
const EventItem = memo(
  ({ event, index, getPlayerName, getTeamInfo, gameInfo }) => {
    // Determine player ID and team based on event type
    let playerId = event.player_id;
    let teamShortName = getTeamInfo(event.team_id).shortName;

    if (event.event_type === "turnover" && event.details?.steal_player_id) {
      playerId = event.details.steal_player_id;
      teamShortName = getTeamInfo(1 - event.team_id).shortName;
    } else if (
      event.event_type === "substitution" &&
      event.details?.player_in_id
    ) {
      playerId = event.details.player_in_id;
    }

    // Compute class names for the event
    let classNames = styles.broadcast_event;
    if (
      event.event_type === "quarter_end" ||
      event.event_type === "game_over"
    ) {
      classNames += " event_period";
    } else if (event.event_type === "shot_made") {
      classNames += " event_score";
      if (event.details?.shot_type === "fga_threepoint") {
        classNames += " event_three";
      }
    } else if (
      event.event_type === "turnover" &&
      event.details?.steal_player_id
    ) {
      classNames += " event_steal";
    }

    return (
      <div className={classNames}>
        {playerId && (
            <img
              src={getPlayerImagePath(playerId, gameInfo)}
              alt="Player"
              className={styles.player_icon}
              onError={(e) => {
                const teamDefaultPath = getTeamDefaultPath(playerId, gameInfo);
                
                // If current src is already the team default, try global default
                if (e.target.src.includes(teamDefaultPath)) {
                  e.target.src = `/assets/player icons/default.png`;
                } else {
                  // Otherwise try the team default
                  e.target.src = teamDefaultPath;
                }
                
                // Prevent infinite error loops
                e.target.onerror = null;
              }}
            />
        )}
        <div className={styles.event_time}>
          {event.quarter}Q {event.timestamp}
        </div>
        <div className={styles.event_team}>{teamShortName}</div>
        <div className={styles.event_description}>
          <EventDescription
            event={event}
            getPlayerName={getPlayerName}
            gameInfo={gameInfo}
          />
        </div>
      </div>
    );
  }
);

const BroadcastEventFeed = ({ events, gameInfo, isLive }) => {
  const feedRef = useRef(null);
  const feedEndRef = useRef(null);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Memoize helper functions to avoid recreation on every render
  const getTeamInfo = useMemo(
    () => (teamId) => {
      if (!gameInfo || !gameInfo.teams)
        return { name: "Team", shortName: "TEAM" };

      const team = gameInfo.teams[teamId];
      return {
        name: team.team_name,
        shortName:
          team.abbreviation || team.team_name.substring(0, 3).toUpperCase(),
      };
    },
    [gameInfo]
  );

  const getPlayerName = useMemo(
    () => (playerId) => {
      if (!playerId) return "";

      // Try to find player in game info
      for (const team of gameInfo?.teams || []) {
        for (const player of team.players || []) {
          if (player.player_id === playerId) {
            return player.player_name || `Player ${playerId}`;
          }
        }
      }

      return `Player ${playerId}`;
    },
    [gameInfo]
  );

  // Only reverse the events array once
  const reversedEvents = useMemo(() => {
    return events ? events.slice().reverse() : [];
  }, [events]);

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div
      className={`${styles.broadcast_feed_container} ${
        isCollapsed ? styles.collapsed : ""
      }`}
    >
      <div className={styles.broadcast_header} onClick={toggleCollapse}>
        <h3>
          Play-by-Play
          {isLive && (
            <span className={styles.live_indicator}>
              <span className={styles.live_dot}></span>
              LIVE
            </span>
          )}
        </h3>
      </div>
      <div className={styles.broadcast_content}>
        <div className={styles.broadcast_events} style={{ maxHeight: "420px" }}>
          {reversedEvents.map((event, index) => (
            <EventItem
              key={`${event.quarter}-${event.timestamp}-${index}`}
              event={event}
              index={index}
              getPlayerName={getPlayerName}
              getTeamInfo={getTeamInfo}
              gameInfo={gameInfo}
            />
          ))}
          <div ref={feedEndRef} />
        </div>
      </div>
    </div>
  );
};

export default memo(BroadcastEventFeed);
