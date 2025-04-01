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
import styles from "../styles/GameSimulationPage.module.css";
import { getAssetPath } from "../utils/paths";
import { getTeamColors, getCourtImagePath } from "../utils/teamUtils";
import Footer from "../components/Footer";
import { cx } from "../utils/moduleUtils";

// Extracted score state hook
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

// Extracted player stats hook
function usePlayerStats() {
  const [playerStats, setPlayerStats] = useState({});

  const updatePlayerStats = useCallback((playerStates, gameData) => {
    if (!playerStates || !gameData?.game_info?.teams) return;

    setPlayerStats((prevStats) => {
      const stats = {};

      gameData.game_info.teams.forEach((team, teamIndex) => {
        team.players.forEach((player) => {
          const playerId = player.player_id || `p${player.player_index}`;

          if (playerStates[playerId]) {
            stats[playerId] = {
              ...playerStates[playerId],
              team_id: teamIndex,
              name: player.player_name || `Player ${playerId}`,
              points: playerStates[playerId].pts || 0,
              rebounds:
                (playerStates[playerId].orb || 0) +
                (playerStates[playerId].drb || 0),
              assists: playerStates[playerId].ast || 0,
              steals: playerStates[playerId].stl || 0,
              turnovers: playerStates[playerId].tov || 0,
              fieldGoalMade: playerStates[playerId].fg || 0,
              fieldGoalAttempted: playerStates[playerId].fga || 0,
              threePointMade: playerStates[playerId].fg_threepoint || 0,
              threePointAttempted: playerStates[playerId].fga_threepoint || 0,
              freeThrowsMade: playerStates[playerId].ft || 0,
              freeThrowsAttempted: playerStates[playerId].fta || 0,
              minutes: Math.round(playerStates[playerId].mp / 60) || 0,
              blocks: playerStates[playerId].blk || 0,
              fouls: playerStates[playerId].pf || 0,
              offensive_rebounds: playerStates[playerId].orb || 0,
              defensive_rebounds: playerStates[playerId].drb || 0,
            };
          }
        });
      });

      // Only update state if something actually changed
      if (JSON.stringify(stats) !== JSON.stringify(prevStats)) {
        return stats;
      }
      return prevStats;
    });
  }, []);

  return { playerStats, updatePlayerStats };
}

// Memoized event feed component
const MemoizedEventFeed = memo(BroadcastEventFeed);
const MemoizedBoxScore = memo(BoxScore);
const MemoizedScoreboard = memo(BroadcastScoreboard);
const MemoizedControls = memo(BroadcastControls);

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
  const prevEventRef = useRef(null);
  const playbackIntervalRef = useRef(null);
  const { scores, updateScores, incrementScore } = useScoreState();
  const { playerStats, updatePlayerStats } = usePlayerStats();
  const [homeScoreUpdated, setHomeScoreUpdated] = useState(false);
  const [awayScoreUpdated, setAwayScoreUpdated] = useState(false);
  const [activeTab, setActiveTab] = useState("play-by-play");

  // Optimized tab change handler - memoized
  const handleTabChange = useCallback((tab) => {
    setActiveTab(tab);
  }, []);

  // Memoized current event
  const currentEvent = useMemo(
    () => gameData?.events?.[currentEventIndex] || null,
    [gameData, currentEventIndex]
  );

  // Memoized team colors
  const teamColors = useMemo(() => {
    if (!gameData?.game_info?.teams) return [null, null];
    return [
      getTeamColors(gameData.game_info.teams[0].team_name),
      getTeamColors(gameData.game_info.teams[1].team_name),
    ];
  }, [gameData?.game_info?.teams]);

  // Memoized court image path
  const courtImagePath = useMemo(() => {
    if (!gameData?.game_info?.teams) return null;
    const homeTeam = gameData.game_info.teams[0];
    return getCourtImagePath(homeTeam.team_name);
  }, [gameData?.game_info?.teams]);

  // Memoized events slice for the event feed
  const currentEvents = useMemo(() => {
    if (!gameData?.events || currentEventIndex < 0) return [];
    return gameData.events.slice(0, currentEventIndex + 1);
  }, [gameData?.events, currentEventIndex]);

  // Data fetching effect
  useEffect(() => {
    const fetchGame = async () => {
      try {
        // Use AbortController to allow cancellation of fetch if component unmounts
        const controller = new AbortController();
        const response = await fetch(getAssetPath(`game_${gameId}.json`), {
          signal: controller.signal,
        });
        const data = await response.json();
        setGameData(data);
        setLoading(false);

        if (data.events?.length > 0) {
          const firstEvent = data.events[0];
          setCurrentTime({
            quarter: firstEvent.quarter,
            timestamp: firstEvent.timestamp,
          });
          if (firstEvent.details?.player_states) {
            updatePlayerStats(firstEvent.details.player_states, data);
          }
        }

        return () => controller.abort();
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error("Error loading game data:", error);
          setLoading(false);
        }
      }
    };

    fetchGame();
  }, [gameId, updatePlayerStats]);

  // Score update handler - memoized
  const updateScoresForEvent = useCallback(
    (event) => {
      if (!event?.event_type) return;

      if (event.event_type === "shot_made" && event.details?.points) {
        incrementScore(event.team_id, event.details.points);
        if (event.team_id === 0) {
          setHomeScoreUpdated(true);
          setTimeout(() => setHomeScoreUpdated(false), 500);
        } else {
          setAwayScoreUpdated(true);
          setTimeout(() => setAwayScoreUpdated(false), 500);
        }
      } else if (event.event_type === "free_throw" && event.details?.made) {
        incrementScore(event.team_id, 1);
        if (event.team_id === 0) {
          setHomeScoreUpdated(true);
          setTimeout(() => setHomeScoreUpdated(false), 500);
        } else {
          setAwayScoreUpdated(true);
          setTimeout(() => setAwayScoreUpdated(false), 500);
        }
      }
    },
    [incrementScore]
  );

  // Playback interval effect - with cleanup
  useEffect(() => {
    if (isPlaying && gameData?.events) {
      // Clear any existing interval first
      if (playbackIntervalRef.current) {
        clearInterval(playbackIntervalRef.current);
      }

      playbackIntervalRef.current = setInterval(() => {
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

    // Cleanup function
    return () => {
      if (playbackIntervalRef.current) {
        clearInterval(playbackIntervalRef.current);
        playbackIntervalRef.current = null;
      }
    };
  }, [isPlaying, gameData?.events?.length, playbackSpeed, gameId, navigate]);

  // Event processing effect
  useEffect(() => {
    if (
      gameData?.events &&
      currentEventIndex >= 0 &&
      currentEventIndex < gameData.events.length
    ) {
      const event = gameData.events[currentEventIndex];

      // Use functional updates to prevent dependency issues
      setCurrentTime({ quarter: event.quarter, timestamp: event.timestamp });

      // Process event for scoring
      updateScoresForEvent(event);

      // Update player stats if available
      if (event.details?.player_states) {
        updatePlayerStats(event.details.player_states, gameData);
      }
    }
  }, [currentEventIndex, gameData, updateScoresForEvent, updatePlayerStats]);

  // Skip to next quarter - memoized
  const handleSkipToNext = useCallback(() => {
    if (!gameData?.events || isPlaying) return;

    const events = gameData.events;
    let nextIndex = currentEventIndex;

    while (nextIndex < events.length - 1) {
      nextIndex++;
      if (events[nextIndex].event_type === "quarter_end") {
        setCurrentEventIndex(nextIndex);
        const event = events[nextIndex];
        setCurrentTime({ quarter: event.quarter, timestamp: event.timestamp });

        if (event.details) {
          updateScores(event.details.home_score, event.details.away_score);

          if (event.details.player_states) {
            updatePlayerStats(event.details.player_states, gameData);
          }
        }
        break;
      }
    }
  }, [gameData, currentEventIndex, updateScores, updatePlayerStats, isPlaying]);

  // Skip to previous quarter - memoized
  const handleSkipToPrevious = useCallback(() => {
    if (!gameData?.events || isPlaying) return;

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
        } else if (event.details) {
          updateScores(event.details.home_score, event.details.away_score);
        }

        if (event.details?.player_states) {
          updatePlayerStats(event.details.player_states, gameData);
        }
        break;
      }
    }
  }, [gameData, currentEventIndex, updateScores, updatePlayerStats, isPlaying]);

  // Skip to end - memoized
  const handleSkipToEnd = useCallback(() => {
    if (!gameData?.events?.length || isPlaying) return;

    const events = gameData.events;
    let endIndex = events.length - 1;

    if (events[endIndex].event_type !== "game_over") {
      for (let i = 0; i < events.length; i++) {
        if (events[i].event_type === "game_over") {
          endIndex = i;
          break;
        }
      }
    }

    setCurrentEventIndex(endIndex);
    const event = events[endIndex];
    setCurrentTime({ quarter: event.quarter, timestamp: event.timestamp });

    if (event.details) {
      updateScores(event.details.home_score, event.details.away_score);

      if (event.details.player_states) {
        updatePlayerStats(event.details.player_states, gameData);
      }
    }
  }, [gameData, updateScores, updatePlayerStats, isPlaying]);

  // Skip to start - memoized
  const handleSkipToStart = useCallback(() => {
    if (!gameData?.events?.length || isPlaying) return;

    setCurrentEventIndex(0);
    const event = gameData.events[0];
    setCurrentTime({ quarter: event.quarter, timestamp: event.timestamp });
    updateScores(0, 0);

    if (event.details?.player_states) {
      updatePlayerStats(event.details.player_states, gameData);
    }
  }, [gameData, updateScores, updatePlayerStats, isPlaying]);

  // Play/pause handler - memoized
  const handlePlayPause = useCallback(() => {
    setIsPlaying((prev) => !prev);
  }, []);

  // Playback speed handler - memoized
  const handleSpeedChange = useCallback((speed) => {
    setPlaybackSpeed(speed);
  }, []);

  // Track current event for reference
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

  // Loading state
  if (loading) {
    return <div className={styles.loading}>Loading game data...</div>;
  }

  // Error state
  if (!gameData) {
    return <div className={styles.error}>Failed to load game data</div>;
  }

  return (
    <div
      className={styles.game_simulation_container}
      style={{
        backgroundImage: courtImagePath ? `url(${courtImagePath})` : "none",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        // backgroundAttachment: "fixed",
        backgroundBlendMode: "overlay",
      }}
    >
      <MemoizedScoreboard
        gameInfo={gameData.game_info}
        scores={scores}
        currentTime={currentTime}
        teamColors={teamColors}
        homeScoreUpdated={homeScoreUpdated}
        awayScoreUpdated={awayScoreUpdated}
      />

      <div className={styles.lower_section}>
        <div className={styles.tabs}>
          <button
            className={cx(
              styles.tab,
              activeTab === "play-by-play" ? styles.active : ""
            )}
            onClick={() => handleTabChange("play-by-play")}
          >
            Play-by-Play
          </button>
          <button
            className={cx(
              styles.tab,
              activeTab === "box-score" ? styles.active : ""
            )}
            onClick={() => handleTabChange("box-score")}
          >
            Box Score
          </button>
        </div>

        {activeTab === "play-by-play" && (
          <MemoizedEventFeed events={currentEvents} gameInfo={gameData.game_info} />
        )}

        {activeTab === "box-score" && (
          <MemoizedBoxScore
            gameInfo={gameData.game_info}
            playerStats={playerStats}
          />
        )}

        <MemoizedControls
          isPlaying={isPlaying}
          playbackSpeed={playbackSpeed}
          onPlayPause={handlePlayPause}
          onSpeedChange={handleSpeedChange}
          onSkipToPrevious={handleSkipToPrevious}
          onSkipToNext={handleSkipToNext}
          onSkipToStart={handleSkipToStart}
          onSkipToEnd={handleSkipToEnd}
        />
      </div>

      <Footer />
    </div>
  );
}

export default memo(GameSimulationPage);
