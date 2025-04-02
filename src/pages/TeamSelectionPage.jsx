import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import styles from "../styles/TeamSelectionPage.module.css";
import Footer from "../components/Footer";
import { fetchTeams, simulateGame } from "../utils/api";
import {
  getPlayerImagePath,
  getPlayerFirstName,
  getPlayerLastName,
} from "../utils/playerUtils";

function TeamSelectionPage() {
  const [teams, setTeams] = useState([]);
  const [homeTeamIndex, setHomeTeamIndex] = useState(0);
  const [awayTeamIndex, setAwayTeamIndex] = useState(1);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("home");
  const navigate = useNavigate();
  const teamSelectorRef = useRef(null);

  useEffect(() => {
    const loadTeams = async () => {
      try {
        setLoading(true);
        const teamsData = await fetchTeams();
        const teamsArray = Object.values(teamsData);

        setTeams(teamsArray);

        // Initialize with Celtics and Nuggets by default
        const celticsIndex = teamsArray.findIndex(
          (t) => t.team_id === "celtics24"
        );
        const nuggetsIndex = teamsArray.findIndex(
          (t) => t.team_id === "nuggets23"
        );

        setHomeTeamIndex(celticsIndex >= 0 ? celticsIndex : 0);
        setAwayTeamIndex(
          nuggetsIndex >= 0 ? nuggetsIndex : teamsArray.length > 1 ? 1 : 0
        );

        setLoading(false);
      } catch (error) {
        console.error("Error loading teams:", error);
        setLoading(false);
      }
    };

    loadTeams();
  }, []);

  const changeTeam = (direction, side) => {
    if (side === "home") {
      const newIndex =
        (homeTeamIndex + direction + teams.length) % teams.length;
      // Don't allow both teams to be the same
      if (newIndex !== awayTeamIndex) {
        setHomeTeamIndex(newIndex);
      } else {
        // Skip to the next team if they would be the same
        setHomeTeamIndex((newIndex + direction + teams.length) % teams.length);
      }
    } else {
      const newIndex =
        (awayTeamIndex + direction + teams.length) % teams.length;
      // Don't allow both teams to be the same
      if (newIndex !== homeTeamIndex) {
        setAwayTeamIndex(newIndex);
      } else {
        // Skip to the next team if they would be the same
        setAwayTeamIndex((newIndex + direction + teams.length) % teams.length);
      }
    }
  };

  // Update handleStartSimulation function
  const handleStartSimulation = async (mode) => {
    if (teams.length === 0) return;

    setLoading(true);
    try {
      const homeTeam = teams[homeTeamIndex];
      const awayTeam = teams[awayTeamIndex];

      localStorage.setItem("simulationMode", mode);
      localStorage.setItem("homeTeamId", homeTeam.team_id);
      localStorage.setItem("awayTeamId", awayTeam.team_id);

      // Simulate the game and get back a game ID
      const result = await simulateGame(homeTeam.id, awayTeam.id);
      const gameId = result.gameId;

      if (mode === "quick") {
        navigate(`/summary/${gameId}`);
      } else {
        navigate(`/game/${gameId}`);
      }
    } catch (error) {
      console.error("Error starting simulation:", error);
      // Show error message to user
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loader}></div>
        <p>Loading teams...</p>
      </div>
    );
  }

  if (teams.length === 0) {
    return (
      <div className={styles.errorContainer}>
        <p>Unable to load teams. Please try again later.</p>
      </div>
    );
  }

  const homeTeam = teams[homeTeamIndex];
  const awayTeam = teams[awayTeamIndex];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Team Selection</h1>
      </div>

      <div className={styles.tabs}>
        <button
          className={`${styles.tabButton} ${
            activeTab === "home" ? styles.activeTab : ""
          }`}
          onClick={() => setActiveTab("home")}
          style={{
            color: activeTab === "home" ? homeTeam.colors?.primary : "#000",
            borderBottomColor:
              activeTab === "home" ? homeTeam.colors?.primary : "transparent",
          }}
        >
          Home Team
        </button>
        <button
          className={`${styles.tabButton} ${
            activeTab === "away" ? styles.activeTab : ""
          }`}
          onClick={() => setActiveTab("away")}
          style={{
            color: activeTab === "away" ? awayTeam.colors?.primary : "#000",
            borderBottomColor:
              activeTab === "away" ? awayTeam.colors?.primary : "transparent",
          }}
        >
          Away Team
        </button>
      </div>

      <div className={styles.teamSelectorContainer} ref={teamSelectorRef}>
        {activeTab === "home" ? (
          <div className={styles.teamSelector}>
            <button
              className={styles.navButton}
              onClick={() => changeTeam(-1, "home")}
              aria-label="Previous team"
            >
              ‹
            </button>

            <div className={styles.teamCard}>
              <div className={styles.teamInfo}>
                <img
                  src={
                    homeTeam.logoUrl || `/assets/logos/${homeTeam.team_id}.png`
                  }
                  alt={`${homeTeam.team_name} logo`}
                  className={styles.teamLogo}
                  onError={(e) => {
                    e.target.src = "/assets/logos/default.png";
                  }}
                />
                <div className={styles.teamDetails}>
                  <h2>{homeTeam.team_name}</h2>
                  <div className={styles.teamMeta}>
                    <span>{homeTeam.season}</span>
                    <span>•</span>
                    <span>{homeTeam.record}</span>
                  </div>
                  <div className={styles.teamCoach}>
                    Coach: {homeTeam.coach}
                  </div>
                </div>
              </div>
            </div>

            <button
              className={styles.navButton}
              onClick={() => changeTeam(1, "home")}
              aria-label="Next team"
            >
              ›
            </button>
          </div>
        ) : (
          <div className={styles.teamSelector}>
            <button
              className={styles.navButton}
              onClick={() => changeTeam(-1, "away")}
              aria-label="Previous team"
            >
              ‹
            </button>

            <div className={styles.teamCard}>
              <div className={styles.teamInfo}>
                <img
                  src={
                    awayTeam.logoUrl || `/assets/logos/${awayTeam.team_id}.png`
                  }
                  alt={`${awayTeam.team_name} logo`}
                  className={styles.teamLogo}
                  onError={(e) => {
                    e.target.src = "/assets/logos/default.png";
                  }}
                />
                <div className={styles.teamDetails}>
                  <h2>{awayTeam.team_name}</h2>
                  <div className={styles.teamMeta}>
                    <span>{awayTeam.season}</span>
                    <span>•</span>
                    <span>{awayTeam.record}</span>
                  </div>
                  <div className={styles.teamCoach}>
                    Coach: {awayTeam.coach}
                  </div>
                </div>
              </div>
            </div>

            <button
              className={styles.navButton}
              onClick={() => changeTeam(1, "away")}
              aria-label="Next team"
            >
              ›
            </button>
          </div>
        )}
      </div>

      <div className={styles.matchupSection}>
        <div className={styles.matchupHeader}>
          <div
            className={styles.matchupTeam}
            style={{ color: homeTeam.colors?.primary }}
          >
            {homeTeam.abbreviation}
          </div>
          <div className={styles.matchupLabel}>Matchup</div>
          <div
            className={styles.matchupTeam}
            style={{ color: awayTeam.colors?.primary }}
          >
            {awayTeam.abbreviation}
          </div>
        </div>

        <div className={styles.matchupContent}>
          {["PG", "SG", "SF", "PF", "C"].map((position, index) => {
            const homePlayerId = homeTeam.starting_lineup?.[index];
            const awayPlayerId = awayTeam.starting_lineup?.[index];
            const homePlayer = homeTeam.players?.[homePlayerId];
            const awayPlayer = awayTeam.players?.[awayPlayerId];

            return (
              <div className={styles.positionRow} key={position}>
                <div className={styles.playerCell}>
                  {homePlayer ? (
                    <div className={styles.playerInfo}>
                      <div className={styles.playerNumber}>
                        {homePlayer.jersey_number.toString().padStart(2, " ")}
                      </div>
                      <div className={styles.playerName}>
                        <div className={styles.playerLastName}>
                          {getPlayerLastName(homePlayer.player_name)}
                        </div>
                        <div className={styles.playerFirstName}>
                          {getPlayerFirstName(homePlayer.player_name)}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className={styles.emptyPlayer}>-</div>
                  )}
                </div>

                <div className={styles.positionCell}>{position}</div>

                <div className={styles.playerCell}>
                  {awayPlayer ? (
                    <div className={styles.playerInfo}>
                      <div className={styles.playerNumber}>
                        {awayPlayer.jersey_number.toString().padStart(2, " ")}
                      </div>
                      <div className={styles.playerName}>
                        <div className={styles.playerLastName}>
                          {getPlayerLastName(awayPlayer.player_name)}
                        </div>
                        <div className={styles.playerFirstName}>
                          {getPlayerFirstName(awayPlayer.player_name)}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className={styles.emptyPlayer}>-</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className={styles.actions}>
        <button
          className={`${styles.actionButton} ${styles.quickSim}`}
          onClick={() => handleStartSimulation("quick")}
          style={{
            backgroundColor: "#f5f5f7",
            color: "#1d1d1f",
          }}
        >
          Quick Simulation
          <span className={styles.buttonDesc}>Skip to final results</span>
        </button>

        <button
          className={`${styles.actionButton} ${styles.fullSim}`}
          onClick={() => handleStartSimulation("full")}
          style={{
            backgroundColor: "#1d1d1f",
            color: "#ffffff",
          }}
        >
          Full Simulation
          <span className={styles.buttonDesc}>Watch play-by-play action</span>
        </button>
      </div>

      <Footer />
    </div>
  );
}

export default TeamSelectionPage;
