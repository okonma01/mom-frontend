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

function usePlayerStats() {
  const [playerStats, setPlayerStats] = useState({});
  const updatePlayerStats = useCallback((playerStates, gameData) => {
    const stats = {};
    
    gameData.game_info.teams.forEach((team, teamIndex) => {
      team.players.forEach((player) => {
        const playerId = player.player_id || `p${player.player_index}`;
        
        if (playerStates[playerId]) {
          stats[playerId] = {
            ...playerStates[playerId],
            team_id: teamIndex,
            name: player.player_name || `Player ${playerId}`,
            // Use the correct abbreviated field names from the game_gKiL4.json schema
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
    
    setPlayerStats(stats);
  }, []);
  
  return { playerStats, updatePlayerStats };
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
  const [activeTab, setActiveTab] = useState("play-by-play");

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  const currentEvent = useMemo(
    () => gameData?.events?.[currentEventIndex] || null,
    [gameData, currentEventIndex]
  );

  const teamColors = useMemo(() => {
    if (!gameData || !gameData.game_info) return [null, null];
    return [
      getTeamColors(gameData.game_info.teams[0].team_name),
      getTeamColors(gameData.game_info.teams[1].team_name),
    ];
  }, [gameData]);

  const courtImagePath = useMemo(() => {
    if (!gameData || !gameData.game_info) return null;
    const homeTeam = gameData.game_info.teams[0];
    return getCourtImagePath(homeTeam.team_name);
  }, [gameData]);

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
          if (firstEvent.details && firstEvent.details.player_states) {
            updatePlayerStats(firstEvent.details.player_states, data);
          }
        }
      } catch (error) {
        console.error("Error loading game data:", error);
        setLoading(false);
      }
    };
    fetchGame();
  }, [gameId, updatePlayerStats]);

  const updateScoresForEvent = useCallback(
    (event) => {
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
    },
    [incrementScore]
  );

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
      if (event.details && event.details.player_states) {
        updatePlayerStats(event.details.player_states, gameData);
      }
    }
  }, [currentEventIndex, gameData, updateScoresForEvent, updatePlayerStats]);

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
        if (event.details && event.details.player_states) {
          updatePlayerStats(event.details.player_states, gameData);
        }
        break;
      }
    }
  }, [gameData, currentEventIndex, updateScores, updatePlayerStats]);

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
        if (event.details && event.details.player_states) {
          updatePlayerStats(event.details.player_states, gameData);
        }
        break;
      }
    }
  }, [gameData, currentEventIndex, updateScores, updatePlayerStats]);

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
    if (event.details && event.details.player_states) {
      updatePlayerStats(event.details.player_states, gameData);
    }
    setIsPlaying(false);
  }, [gameData, updateScores, updatePlayerStats]);

  const handleSkipToStart = useCallback(() => {
    if (!gameData || !gameData.events.length) return;
    setCurrentEventIndex(0);
    const event = gameData.events[0];
    setCurrentTime({ quarter: event.quarter, timestamp: event.timestamp });
    updateScores(0, 0);
    if (event.details && event.details.player_states) {
      updatePlayerStats(event.details.player_states, gameData);
    }
    setIsPlaying(false);
  }, [gameData, updateScores, updatePlayerStats]);

  const handlePlayPause = useCallback(() => {
    setIsPlaying((prev) => !prev);
  }, []);

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

  const toggleBoxScore = useCallback(() => {
    setDisplayBoxScore((prev) => !prev);
  }, []);

  if (loading) {
    return <div className={styles.loading}>Loading game data...</div>;
  }
  if (!gameData) {
    console.error("Game data is null or undefined");
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
        backgroundAttachment: "fixed",
        backgroundBlendMode: "overlay",
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
          <BroadcastEventFeed
            events={gameData.events.slice(0, currentEventIndex + 1)}
            gameInfo={gameData.game_info}
          />
        )}
        {activeTab === "box-score" && (
          <BoxScore gameInfo={gameData.game_info} playerStats={playerStats} />
        )}
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
      <Footer />
    </div>
  );
}

export default GameSimulationPage;
