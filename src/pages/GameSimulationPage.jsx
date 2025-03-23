import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  memo,
} from "react";
import { useParams, useNavigate } from "react-router-dom";
import BroadcastScoreboard from "../components/BroadcastScoreboard";
import BroadcastEventFeed from "../components/BroadcastEventFeed";
import BroadcastControls from "../components/BroadcastControls";
import BoxScore from "../components/BoxScore";
import "../styles/GameSimulationPage.css";
import { getAssetPath } from "../utils/paths";
import { getTeamColors, getCourtImagePath } from "../utils/teamUtils";

function useScoreState() {
  const [scores, setScores] = useState({ home: 0, away: 0 });

  const updateScores = useCallback((home, away) => {
    setScores({ home, away });
  }, []);

  const incrementScore = useCallback((team, amount) => {
    setScores((prev) => ({
      home: team === 0 ? prev.home + amount : prev.home,
      away: team === 1 ? prev.away + amount : prev.away,
    }));
  }, []);

  return { scores, updateScores, incrementScore };
}

// NEW: Hook to track player stats (moved above component)
function usePlayerStats() {
  const [playerStats, setPlayerStats] = useState({});
  const updatePlayerStats = useCallback((event) => {
    setPlayerStats((prevStats) => {
      const newStats = { ...prevStats };
      // Helper to update stats for a given player
      const updateStat = (playerId, field, amount = 1) => {
        if (!playerId) return;
        newStats[playerId] = newStats[playerId] || {
          points: 0,
          rebounds: 0,
          assists: 0,
          turnovers: 0,
          steals: 0,
          freeThrowsMade: 0,
          freeThrowsAttempted: 0,
          fieldGoalMade: 0,
          fieldGoalAttempted: 0,
          threePointMade: 0,
          threePointAttempted: 0
        };
        newStats[playerId][field] = (newStats[playerId][field] || 0) + amount;
      };
      // Process event by type
      switch (event.event_type) {
        case "shot_made":
          updateStat(event.player_id, "points", event.details.points);
          updateStat(event.player_id, "fieldGoalMade", 1);
          updateStat(event.player_id, "fieldGoalAttempted", 1);
          if (event.details.shot_type === "fga_threepoint") {
            updateStat(event.player_id, "threePointMade", 1);
            updateStat(event.player_id, "threePointAttempted", 1);
          }
          if (event.details.assist_player_id) {
            updateStat(event.details.assist_player_id, "assists", 1);
          }
          break;
        case "shot_missed":
          updateStat(event.player_id, "fieldGoalAttempted", 1);
          if (event.details.shot_type === "fga_threepoint") {
            updateStat(event.player_id, "threePointAttempted", 1);
          }
          break;
        case "free_throw":
          updateStat(event.player_id, "freeThrowsAttempted", 1);
          if (event.details.made) {
            updateStat(event.player_id, "freeThrowsMade", 1);
            updateStat(event.player_id, "points", 1);
          }
          break;
        case "rebound":
          updateStat(event.player_id, "rebounds", 1);
          break;
        case "turnover":
          updateStat(event.player_id, "turnovers", 1);
          if (event.details.steal_player_id) {
            updateStat(event.details.steal_player_id, "steals", 1);
          }
          break;
        // ...additional cases as needed...
        default:
          break;
      }
      return newStats;
    });
  }, []);
  return { playerStats, updatePlayerStats, setPlayerStats };
}

function GameSimulationPage() {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const [gameData, setGameData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentEventIndex, setCurrentEventIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [currentTime, setCurrentTime] = useState({
    quarter: 1,
    timestamp: "12:00",
  });
  const [displayBoxScore, setDisplayBoxScore] = useState(false);
  const prevEventRef = useRef(null);
  const { scores, updateScores, incrementScore } = useScoreState();
  const { playerStats, updatePlayerStats } = usePlayerStats();
  const [homeScoreUpdated, setHomeScoreUpdated] = useState(false);
  const [awayScoreUpdated, setAwayScoreUpdated] = useState(false);

  // Moved currentEvent definition before it's used in the useEffect
  const currentEvent = useMemo(
    () => gameData?.events?.[currentEventIndex] || null,
    [gameData, currentEventIndex]
  );

  // Derive team colors
  const teamColors = useMemo(() => {
    if (!gameData || !gameData.game_info) return [null, null];
    return [
      getTeamColors(gameData.game_info.teams[0].team_name),
      getTeamColors(gameData.game_info.teams[1].team_name)
    ];
  }, [gameData]);

  // Get court image for background
  const courtImagePath = useMemo(() => {
    if (!gameData || !gameData.game_info) return null;
    const homeTeam = gameData.game_info.teams[0];
    return getCourtImagePath(homeTeam.team_name);
  }, [gameData]);

  // Load game data
  useEffect(() => {
    const fetchGame = async () => {
      try {
        const response = await fetch(getAssetPath(`game_${gameId}.json`));
        const data = await response.json();
        setGameData(data);
        setLoading(false);
        if (data.events && data.events.length > 0) {
          const firstEvent = data.events[0];
          setCurrentTime({
            quarter: firstEvent.quarter,
            timestamp: firstEvent.timestamp,
          });
        }
      } catch (error) {
        console.error("Error loading game data:", error);
        setLoading(false);
      }
    };
    fetchGame();
  }, [gameId]);

  // Modified updateScores with animation
  const updateScoresForEvent = useCallback((event) => {
    if (event.event_type === "shot_made") {
      incrementScore(event.team_id, event.details.points);
      if (event.team_id === 0) {
        setHomeScoreUpdated(true);
        setTimeout(() => setHomeScoreUpdated(false), 500);
      } else {
        setAwayScoreUpdated(true);
        setTimeout(() => setAwayScoreUpdated(false), 500);
      }
    } else if (event.event_type === "free_throw" && event.details.made) {
      incrementScore(event.team_id, 1);
      if (event.team_id === 0) {
        setHomeScoreUpdated(true);
        setTimeout(() => setHomeScoreUpdated(false), 500);
      } else {
        setAwayScoreUpdated(true);
        setTimeout(() => setAwayScoreUpdated(false), 500);
      }
    }
  }, [incrementScore]);

  useEffect(() => {
    let playbackInterval;
    if (isPlaying && gameData?.events) {
      playbackInterval = setInterval(() => {
        setCurrentEventIndex((prevIndex) => {
          const nextIndex = prevIndex + 1;
          if (nextIndex >= gameData.events.length) {
            setIsPlaying(false);
            navigate(`/summary/${gameId}`);
            return prevIndex;
          }
          return nextIndex;
        });
      }, 1000 / playbackSpeed);
    }
    return () => clearInterval(playbackInterval);
  }, [isPlaying, gameData, playbackSpeed, gameId, navigate]);

  useEffect(() => {
    if (gameData?.events && currentEventIndex < gameData.events.length) {
      const event = gameData.events[currentEventIndex];
      setCurrentTime({ quarter: event.quarter, timestamp: event.timestamp });
      updateScoresForEvent(event);
      updatePlayerStats(event); // NEW: update individual stats from event
    }
  }, [currentEventIndex, gameData, updateScoresForEvent, updatePlayerStats]);

  // Skip handlers (unchanged logic)
  const handleSkipToNext = useCallback(() => {
    if (!gameData) return;
    const events = gameData.events;
    let nextIndex = currentEventIndex;
    while (nextIndex < events.length - 1) {
      nextIndex++;
      if (events[nextIndex].event_type === "quarter_end") {
        setCurrentEventIndex(nextIndex);
        const event = events[nextIndex];
        setCurrentTime({ quarter: event.quarter, timestamp: event.timestamp });
        updateScores(event.details.home_score, event.details.away_score);
        break;
      }
    }
  }, [gameData, currentEventIndex, updateScores]);

  const handleSkipToPrevious = useCallback(() => {
    if (!gameData) return;
    const events = gameData.events;
    let prevIndex = currentEventIndex;
    while (prevIndex > 0) {
      prevIndex--;
      if (events[prevIndex].event_type === "quarter_end" || prevIndex === 0) {
        setCurrentEventIndex(prevIndex);
        const event = events[prevIndex];
        setCurrentTime({ quarter: event.quarter, timestamp: event.timestamp });
        if (prevIndex === 0) {
          updateScores(0, 0);
        } else {
          updateScores(event.details.home_score, event.details.away_score);
        }
        break;
      }
    }
  }, [gameData, currentEventIndex, updateScores]);

  const handleSkipToEnd = useCallback(() => {
    if (!gameData || !gameData.events.length) return;
    const events = gameData.events;
    let endIndex = events.length - 1;
    for (let i = 0; i < events.length; i++) {
      if (events[i].event_type === "game_over") {
        endIndex = i;
        break;
      }
    }
    setCurrentEventIndex(endIndex);
    const event = events[endIndex];
    setCurrentTime({ quarter: event.quarter, timestamp: event.timestamp });
    updateScores(event.details.home_score, event.details.away_score);
    setIsPlaying(false);
  }, [gameData, updateScores]);

  const handleSkipToStart = useCallback(() => {
    if (!gameData || !gameData.events.length) return;
    setCurrentEventIndex(0);
    const event = gameData.events[0];
    setCurrentTime({ quarter: event.quarter, timestamp: event.timestamp });
    updateScores(0, 0);
    setIsPlaying(false);
  }, [gameData, updateScores]);

  const handlePlayPause = useCallback(() => {
    setIsPlaying((prev) => !prev);
  }, []);

  // Log event changes
  useEffect(() => {
    if (
      currentEvent &&
      (!prevEventRef.current ||
       prevEventRef.current.event_type !== currentEvent.event_type ||
       prevEventRef.current.timestamp !== currentEvent.timestamp)
    ) {
      prevEventRef.current = currentEvent;
    }
  }, [currentEvent]);

  // Toggling box score panel
  const toggleBoxScore = useCallback(() => {
    setDisplayBoxScore((prev) => !prev);
  }, []);

  if (loading) {
    return <div className="loading">Loading game data...</div>;
  }
  if (!gameData) {
    console.error("Game data is null or undefined");
    return <div className="error">Failed to load game data</div>;
  }

  return (
    <div 
      className="game-simulation-container"
      style={{
        backgroundImage: courtImagePath ? `url(${courtImagePath})` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed',
        backgroundBlendMode: 'overlay'
      }}
    >
      <BroadcastScoreboard 
        gameInfo={gameData.game_info}
        scores={scores}
        currentTime={currentTime}
        teamColors={teamColors}
        homeScoreUpdated={homeScoreUpdated}
        awayScoreUpdated={awayScoreUpdated}
      />
      
      <div className="upper-section">
        <button className="toggle-boxscore-btn" onClick={toggleBoxScore}>
          {displayBoxScore ? "Hide Box Score" : "Show Box Score"}
        </button>
        {displayBoxScore && <BoxScore gameInfo={gameData.game_info} playerStats={playerStats} />}
      </div>
      
      <div className="lower-section">
        <BroadcastEventFeed 
          events={gameData.events.slice(0, currentEventIndex + 1)} 
          gameInfo={gameData.game_info} 
        />
        <BroadcastControls 
          isPlaying={isPlaying}
          playbackSpeed={playbackSpeed}
          onPlayPause={handlePlayPause}
          onSpeedChange={setPlaybackSpeed}
          onSkipToPrevious={handleSkipToPrevious}
          onSkipToNext={handleSkipToNext}
          onSkipToStart={handleSkipToStart}
          onSkipToEnd={handleSkipToEnd}
        />
      </div>
    </div>
  );
}

export default GameSimulationPage;
