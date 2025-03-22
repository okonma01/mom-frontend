import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  memo,
} from "react";
import { useParams, useNavigate } from "react-router-dom";
import Scoreboard from "../components/Scoreboard";
import EventFeed from "../components/EventFeed";
import DVRControls from "../components/DVRControls";
import "../styles/GameSimulationPage.css";

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

function GameSimulationPage() {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const [gameData, setGameData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentEventIndex, setCurrentEventIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [currentTime, setCurrentTime] = useState({
    quarter: 1,
    timestamp: "12:00",
  });
  const prevEventRef = useRef(null);
  const { scores, updateScores, incrementScore } = useScoreState();

  const MemoScoreboard = memo(Scoreboard);
  const MemoEventFeed = memo(EventFeed);
  const MemoDVRControls = memo(DVRControls);

  // Load game data
  useEffect(() => {
    const fetchGame = async () => {
      try {
        // In a real app, this would be an API call
        // For now, we'll use the JSON file directly
        const response = await fetch(`/game_${gameId}.json`);
        const data = await response.json();
        setGameData(data);
        setLoading(false);

        // Initialize with first event
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

  // Optimize updateScoresForEvent with useCallback
  const updateScoresForEvent = useCallback((event) => {
    // Only update scores for specific scoring events
    if (event.event_type === "shot_made") {
      incrementScore(event.team_id, event.details.points);
    } else if (event.event_type === "free_throw" && event.details.made) {
      incrementScore(event.team_id, 1);
    }
    // Don't use quarter_end events for incremental score updates
    // This is a critical change to prevent double-counting
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
      updateScoresForEvent(event); // only called once here
    }
  }, [currentEventIndex, gameData, updateScoresForEvent]);

  // Optimize skip handlers with useCallback
  const handleSkipToNext = useCallback(() => {
    // Find the next checkpoint or quarter boundary
    if (!gameData) return;

    const events = gameData.events;
    let nextIndex = currentEventIndex;

    while (nextIndex < events.length - 1) {
      nextIndex++;
      if (events[nextIndex].event_type === "quarter_end") {
        // When using a checkpoint, SET the scores directly from the checkpoint
        // rather than incrementally updating them
        setCurrentEventIndex(nextIndex);
        const event = events[nextIndex];
        setCurrentTime({ quarter: event.quarter, timestamp: event.timestamp });

        // Set scores directly from the checkpoint data
        updateScores(event.details.home_score, event.details.away_score);
        break;
      }
    }
  }, [gameData, currentEventIndex, updateScores]);

  const handleSkipToPrevious = useCallback(() => {
    // Find the previous checkpoint or quarter boundary
    if (!gameData) return;

    const events = gameData.events;
    let prevIndex = currentEventIndex;

    while (prevIndex > 0) {
      prevIndex--;
      if (events[prevIndex].event_type === "quarter_end" || prevIndex === 0) {
        setCurrentEventIndex(prevIndex);
        const event = events[prevIndex];
        setCurrentTime({ quarter: event.quarter, timestamp: event.timestamp });

        // When rewinding, SET the scores directly from checkpoint
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

    // Find the game_over event
    const events = gameData.events;
    let endIndex = events.length - 1;

    for (let i = 0; i < events.length; i++) {
      if (events[i].event_type === "game_over") {
        endIndex = i;
        break;
      }
    }

    // Set to final state directly
    setCurrentEventIndex(endIndex);
    const event = events[endIndex];
    setCurrentTime({ quarter: event.quarter, timestamp: event.timestamp });
    updateScores(event.details.home_score, event.details.away_score);
    setIsPlaying(false);
  }, [gameData, updateScores]);

  const handleSkipToStart = useCallback(() => {
    if (!gameData || !gameData.events.length) return;

    // Reset to initial state
    setCurrentEventIndex(0);
    const event = gameData.events[0];
    setCurrentTime({ quarter: event.quarter, timestamp: event.timestamp });
    updateScores(0, 0);
    setIsPlaying(false);
  }, [gameData, updateScores]);

  // Optimize handlePlayPause with useCallback
  const handlePlayPause = useCallback(() => {
    setIsPlaying((prevState) => !prevState);
  }, []);

  // Use useMemo for derived values
  const currentEvent = useMemo(
    () => gameData?.events?.[currentEventIndex] || null,
    [gameData, currentEventIndex]
  );

  const visibleEvents = useMemo(() => {
    if (!gameData || !gameData.events || !currentEvent) return [];
    return gameData.events.filter((e, idx) => {
      return e.quarter === currentEvent.quarter && idx <= currentEventIndex;
    });
  }, [gameData, currentEventIndex, currentEvent]);

  // Log only when the event changes
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

  if (loading) {
    return <div className="loading">Loading game data...</div>;
  }

  if (!gameData) {
    console.error("Game data is null or undefined");
    return <div className="error">Failed to load game data</div>;
  }

  return (
    <div className="game-simulation-container">
      <MemoScoreboard
        homeTeam={gameData.game_info.teams[0].team_name}
        awayTeam={gameData.game_info.teams[1].team_name}
        homeScore={scores.home}
        awayScore={scores.away}
        quarter={currentTime.quarter}
        timeRemaining={currentTime.timestamp}
        possession={currentEvent ? currentEvent.team_id : 0}
      />
      <MemoEventFeed
        events={visibleEvents}
        gameInfo={gameData.game_info}
      />
      <MemoDVRControls
        isPlaying={isPlaying}
        playbackSpeed={playbackSpeed}
        onPlayPause={handlePlayPause}
        onSkipToNext={handleSkipToNext}
        onSkipToPrevious={handleSkipToPrevious}
        onSkipToEnd={handleSkipToEnd}
        onSkipToStart={handleSkipToStart}
        onSpeedChange={setPlaybackSpeed}
      />
    </div>
  );
}

export default GameSimulationPage;
