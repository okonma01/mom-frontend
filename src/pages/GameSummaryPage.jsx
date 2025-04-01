import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import styles from "../styles/GameSummaryPage.module.css";
import { getAssetPath } from "../utils/paths";
import {
  getTeamColors,
  getCourtImagePath,
  getTeamLogoPath,
} from "../utils/teamUtils";
import Footer from "../components/Footer";
import BoxScore from "../components/BoxScore";
import cx from "classnames";

function GameSummaryPage() {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const [gameData, setGameData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("summary");
  const [backgroundImage, setBackgroundImage] = useState(null);

  useEffect(() => {
    const fetchGame = async () => {
      try {
        const response = await fetch(getAssetPath(`game_${gameId}.json`));
        if (!response.ok) {
          throw new Error("Game data not found");
        }
        const data = await response.json();
        setGameData(data);

        // Set background image based on home team
        if (data.game_info?.teams?.length > 0) {
          const homeTeam = data.game_info.teams[0].team_name;
          setBackgroundImage(getCourtImagePath(homeTeam));
        }

        setLoading(false);
      } catch (error) {
        console.error("Error loading game summary data:", error);
        setError(error.message || "Failed to load game data");
        setLoading(false);
      }
    };
    fetchGame();
  }, [gameId]);

  const handlePlayAgain = () => {
    navigate("/select-teams");
  };

  const handleWatchReplay = () => {
    navigate(`/game/${gameId}`);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  const finalStats = useMemo(() => {
    if (!gameData) return null;

    const gameOverEvent = gameData.events.find(
      (event) => event.event_type === "game_over"
    );
    if (!gameOverEvent) return null;

    const lastCheckpoint = gameData.checkpoints[gameData.checkpoints.length - 1];
    const quarterScores = [];
    let homeTotal = 0;
    let awayTotal = 0;

    // Quarter scores calculation
    gameData.events
      .filter((event) => event.event_type === "quarter_end")
      .forEach((event) => {
        const { quarter, home_score, away_score } = event.details;
        const homeQuarterScore = home_score - homeTotal;
        const awayQuarterScore = away_score - awayTotal;
        quarterScores.push({
          quarter,
          home: homeQuarterScore,
          away: awayQuarterScore,
        });
        homeTotal = home_score;
        awayTotal = away_score;
      });

    // Initialize team stats with proper calculations
    const calculateTeamStats = (teamId) => {
      let stats = {
        fieldGoalMade: 0,
        fieldGoalAttempted: 0,
        threePointMade: 0,
        threePointAttempted: 0,
        freeThrowsMade: 0,
        freeThrowsAttempted: 0,
        rebounds: 0,
        assists: 0,
        steals: 0,
        blocks: 0,
        turnovers: 0,
        possessions: 0,
      };

      // Count all events to calculate stats
      gameData.events.forEach(event => {
        if (event.team_id === teamId) {
          switch (event.event_type) {
            case 'shot_made':
              stats.fieldGoalMade++;
              stats.fieldGoalAttempted++;
              if (event.details?.shot_type === 'fga_threepoint') {
                stats.threePointMade++;
                stats.threePointAttempted++;
              }
              if (event.details?.assist_player_id) {
                stats.assists++;
              }
              break;
            case 'shot_missed':
              stats.fieldGoalAttempted++;
              if (event.details?.shot_type === 'fga_threepoint') {
                stats.threePointAttempted++;
              }
              break;
            case 'free_throw':
              if (event.details?.made) {
                stats.freeThrowsMade++;
              }
              stats.freeThrowsAttempted++;
              break;
            case 'rebound':
              stats.rebounds++;
              break;
            case 'block':
              stats.blocks++;
              break;
            case 'turnover':
              stats.turnovers++;
              break;
          }
        }
      });

      // Calculate possessions using the NBA formula:
      // Possessions = FGA + (0.44 * FTA) - OREB + TOV
      stats.possessions = (stats.fieldGoalAttempted + 
        (0.44 * stats.freeThrowsAttempted) - 
        (stats.rebounds * 0.25) + 
        stats.turnovers).toFixed(1);

      // Calculate pace (possessions per game normalized to 48 minutes)
      const totalMinutes = 48; // Standard game length
      stats.pace = Math.round((stats.possessions * (48 / totalMinutes)) * 10) / 10;

      // Calculate Offensive Rating (points per 100 possessions)
      const points = teamId === 0 ? gameOverEvent.details.home_score : gameOverEvent.details.away_score;
      stats.ortg = Math.round((points / stats.possessions) * 100);

      // Calculate Defensive Rating (opponent points per 100 possessions)
      const oppPoints = teamId === 0 ? gameOverEvent.details.away_score : gameOverEvent.details.home_score;
      stats.drtg = Math.round((oppPoints / stats.possessions) * 100);

      // Calculate Effective Field Goal Percentage (eFG%)
      // eFG% = (FGM + 0.5 * 3PM) / FGA
      stats.efg = stats.fieldGoalAttempted > 0 
        ? Math.round(((stats.fieldGoalMade + 0.5 * stats.threePointMade) / stats.fieldGoalAttempted) * 1000) / 10
        : 0;

      // Calculate True Shooting Percentage (TS%)
      // TS% = Points / (2 * (FGA + 0.44 * FTA))
      stats.ts = (stats.fieldGoalAttempted > 0 || stats.freeThrowsAttempted > 0)
        ? Math.round((points / (2 * (stats.fieldGoalAttempted + 0.44 * stats.freeThrowsAttempted))) * 1000) / 10
        : 0;

      // Calculate Assist Ratio (percentage of possessions ending in assist)
      // AST_Ratio = (AST * 100) / Possessions
      stats.astRatio = stats.possessions > 0
        ? Math.round((stats.assists / stats.possessions) * 1000) / 10
        : 0;

      return stats;
    };

    // Calculate stats for both teams
    const teamStats = {
      home: calculateTeamStats(0),
      away: calculateTeamStats(1)
    };

    teamStats.home.steals = teamStats.away.turnovers || 0;
    teamStats.away.steals = teamStats.home.turnovers || 0;

    return {
      homeScore: gameOverEvent.details.home_score,
      awayScore: gameOverEvent.details.away_score,
      quarterScores,
      teamStats,
      playerStats: lastCheckpoint?.player_states || {},
    };
  }, [gameData]);

  // Extract player stats from the game_over event
  const formattedPlayerStats = useMemo(() => {
    if (!gameData || !gameData.events) return {};
    
    // Find the game_over event
    const gameOverEvent = gameData.events.find(event => event.event_type === "game_over");
    
    if (!gameOverEvent || !gameOverEvent.details.player_states) return {};
    
    // Format player stats from player_states
    const playerStats = {};
    Object.entries(gameOverEvent.details.player_states).forEach(([playerId, stats]) => {
      playerStats[playerId] = {
        points: stats.pts || 0,
        rebounds: (stats.orb + stats.drb) || 0,
        assists: stats.ast || 0,
        steals: stats.stl || 0,
        blocks: stats.blk || 0,
        turnovers: stats.tov || 0,
        minutes: stats.mp || 0,
        fieldGoalMade: stats.fg || 0,
        fieldGoalAttempted: stats.fga || 0,
        threePointMade: stats.fg_threepoint || 0,
        threePointAttempted: stats.fga_threepoint || 0,
        freeThrowsMade: stats.ft || 0,
        freeThrowsAttempted: stats.fta || 0
      };
    });
    
    return playerStats;
  }, [gameData]);

  // Helper function to determine which team has better stats in a category
  const getBetterTeam = (home, away) => {
    if (home > away) return "home";
    if (away > home) return "away";
    return null;
  };

  if (loading) {
    return (
      <div className={styles.game_summary_container}>
        <div className={styles.loading}>
          <span>Loading game summary...</span>
        </div>
      </div>
    );
  }

  if (error || !gameData || !finalStats) {
    return (
      <div className={styles.game_summary_container}>
        <div className={styles.error}>
          <h3>Error Loading Game Data</h3>
          <p>{error || "Game data could not be loaded"}</p>
          <button
            onClick={() => navigate("/select-teams")}
            className={styles.play_again_button}
          >
            Start New Game
          </button>
        </div>
      </div>
    );
  }

  const homeTeam = gameData.game_info.teams[0];
  const awayTeam = gameData.game_info.teams[1];
  const homeColors = getTeamColors(homeTeam.team_name);
  const awayColors = getTeamColors(awayTeam.team_name);
  const winner = finalStats.homeScore > finalStats.awayScore ? "home" : "away";

  return (
    <div
      className={styles.game_summary_container}
      style={{
        backgroundImage: backgroundImage ? `url(${getAssetPath(backgroundImage)})` : undefined,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        // backgroundAttachment: "fixed",
        backgroundBlendMode: "overlay",
      }}
    >
      <div className={styles.final_score_banner}>
        <div className={styles.team_logo_container}>
          <img
            src={getAssetPath(getTeamLogoPath(homeTeam.team_name))}
            alt={`${homeTeam.team_name} logo`}
            className={styles.team_logo}
          />
        </div>
        
        <div className={styles.team_info}>
          <div
            className={styles.team_name}
            style={{ color: homeColors?.primary }}
          >
            {homeTeam.team_name}
          </div>
          <div className={styles.team_record}>{homeTeam.record || "0-0"}</div>
        </div>
        
        <div className={styles.score_display}>
          <div className={styles.final_text}>Final</div>
          <div className={styles.scores}>
            <div
              className={styles.score_value}
              style={{ 
                color: winner === "home" ? homeColors?.primary : "#1d1d1f",
                opacity: winner === "home" ? 1 : 0.8
              }}
            >
              {finalStats.homeScore}
            </div>
            <div className={styles.score_separator}>-</div>
            <div
              className={styles.score_value}
              style={{ 
                color: winner === "away" ? awayColors?.primary : "#1d1d1f",
                opacity: winner === "away" ? 1 : 0.8
              }}
            >
              {finalStats.awayScore}
            </div>
          </div>
          {winner && (
            <div className={styles.winner_indicator}>
              {winner === "home" ? homeTeam.team_name : awayTeam.team_name}
            </div>
          )}
        </div>
        
        <div className={styles.team_info} style={{ textAlign: "right" }}>
          <div
            className={styles.team_name}
            style={{ color: awayColors?.primary }}
          >
            {awayTeam.team_name}
          </div>
          <div className={styles.team_record}>{awayTeam.record || "0-0"}</div>
        </div>
        
        <div className={styles.team_logo_container}>
          <img
            src={getAssetPath(getTeamLogoPath(awayTeam.team_name))}
            alt={`${awayTeam.team_name} logo`}
            className={styles.team_logo}
          />
        </div>
      </div>

      <div className={styles.tabs}>
        <button
          className={cx(styles.tab, { [styles.active]: activeTab === "summary" })}
          onClick={() => handleTabChange("summary")}
        >
          Game Summary
        </button>
        <button
          className={cx(styles.tab, { [styles.active]: activeTab === "boxscore" })}
          onClick={() => handleTabChange("boxscore")}
        >
          Box Score
        </button>
        <button
          className={cx(styles.tab, { [styles.active]: activeTab === "advanced" })}
          onClick={() => handleTabChange("advanced")}
        >
          Advanced Stats
        </button>
      </div>

      <div className={styles.tab_content}>
        {activeTab === "summary" && (
          <div className={styles.summary_tab}>
            <div className={styles.quarter_scores}>
              <h3 className={styles.section_title}>Scoring by Quarter</h3>
              <table className={styles.quarters_table}>
                <thead>
                  <tr>
                    <th>Team</th>
                    {finalStats.quarterScores.map((q) => (
                      <th key={`q${q.quarter}`}>Q{q.quarter}</th>
                    ))}
                    <th>Final</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className={styles.team_row}>
                    <td
                      className={styles.team_name_cell}
                      style={{ color: homeColors?.primary }}
                    >
                      {homeTeam.team_name}
                    </td>
                    {finalStats.quarterScores.map((q) => (
                      <td key={`home_q${q.quarter}`}>{q.home}</td>
                    ))}
                    <td
                      className={styles.final_score_cell}
                      style={{
                        color: winner === "home" ? homeColors?.primary : "#212529",
                        fontWeight: winner === "home" ? "700" : "600",
                      }}
                    >
                      {finalStats.homeScore}
                    </td>
                  </tr>
                  <tr className={styles.team_row}>
                    <td
                      className={styles.team_name_cell}
                      style={{ color: awayColors?.primary }}
                    >
                      {awayTeam.team_name}
                    </td>
                    {finalStats.quarterScores.map((q) => (
                      <td key={`away_q${q.quarter}`}>{q.away}</td>
                    ))}
                    <td
                      className={styles.final_score_cell}
                      style={{
                        color: winner === "away" ? awayColors?.primary : "#212529",
                        fontWeight: winner === "away" ? "700" : "600",
                      }}
                    >
                      {finalStats.awayScore}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className={styles.key_stats}>
              <h3 className={styles.section_title}>Key Team Stats</h3>
              <div className={styles.stat_container}>
                {finalStats.teamStats && (
                  <>
                    <div className={styles.stat_row}>
                      <div
                        className={cx(
                          styles.team_stat,
                          styles.home_stat,
                          {
                            [styles.stat_winner]: getBetterTeam(
                              finalStats.teamStats.home.fieldGoalMade /
                                Math.max(1, finalStats.teamStats.home.fieldGoalAttempted),
                              finalStats.teamStats.away.fieldGoalMade /
                                Math.max(1, finalStats.teamStats.away.fieldGoalAttempted)
                            ) === "home",
                          }
                        )}
                        style={{ color: homeColors?.primary }}
                      >
                        {finalStats.teamStats.home.fieldGoalMade}/{finalStats.teamStats.home.fieldGoalAttempted}
                        <div className={styles.stat_percent}>
                          {finalStats.teamStats.home.fieldGoalAttempted > 0
                            ? `${((finalStats.teamStats.home.fieldGoalMade / finalStats.teamStats.home.fieldGoalAttempted) * 100).toFixed(1)}%`
                            : "0.0%"}
                        </div>
                      </div>
                      <div className={styles.stat_name}>Field Goals</div>
                      <div
                        className={cx(
                          styles.team_stat,
                          styles.away_stat,
                          {
                            [styles.stat_winner]: getBetterTeam(
                              finalStats.teamStats.away.fieldGoalMade /
                                Math.max(1, finalStats.teamStats.away.fieldGoalAttempted),
                              finalStats.teamStats.home.fieldGoalMade /
                                Math.max(1, finalStats.teamStats.home.fieldGoalAttempted)
                            ) === "away",
                          }
                        )}
                        style={{ color: awayColors?.primary }}
                      >
                        {finalStats.teamStats.away.fieldGoalMade}/{finalStats.teamStats.away.fieldGoalAttempted}
                        <div className={styles.stat_percent}>
                          {finalStats.teamStats.away.fieldGoalAttempted > 0
                            ? `${((finalStats.teamStats.away.fieldGoalMade / finalStats.teamStats.away.fieldGoalAttempted) * 100).toFixed(1)}%`
                            : "0.0%"}
                        </div>
                      </div>
                    </div>

                    <div className={styles.stat_row}>
                      <div
                        className={cx(
                          styles.team_stat,
                          styles.home_stat,
                          {
                            [styles.stat_winner]: getBetterTeam(
                              finalStats.teamStats.home.threePointMade /
                                Math.max(1, finalStats.teamStats.home.threePointAttempted),
                              finalStats.teamStats.away.threePointMade /
                                Math.max(1, finalStats.teamStats.away.threePointAttempted)
                            ) === "home",
                          }
                        )}
                        style={{ color: homeColors?.primary }}
                      >
                        {finalStats.teamStats.home.threePointMade}/{finalStats.teamStats.home.threePointAttempted}
                        <div className={styles.stat_percent}>
                          {finalStats.teamStats.home.threePointAttempted > 0
                            ? `${((finalStats.teamStats.home.threePointMade / finalStats.teamStats.home.threePointAttempted) * 100).toFixed(1)}%`
                            : "0.0%"}
                        </div>
                      </div>
                      <div className={styles.stat_name}>3-Pointers</div>
                      <div
                        className={cx(
                          styles.team_stat,
                          styles.away_stat,
                          {
                            [styles.stat_winner]: getBetterTeam(
                              finalStats.teamStats.away.threePointMade /
                                Math.max(1, finalStats.teamStats.away.threePointAttempted),
                              finalStats.teamStats.home.threePointMade /
                                Math.max(1, finalStats.teamStats.home.threePointAttempted)
                            ) === "away",
                          }
                        )}
                        style={{ color: awayColors?.primary }}
                      >
                        {finalStats.teamStats.away.threePointMade}/{finalStats.teamStats.away.threePointAttempted}
                        <div className={styles.stat_percent}>
                          {finalStats.teamStats.away.threePointAttempted > 0
                            ? `${((finalStats.teamStats.away.threePointMade / finalStats.teamStats.away.threePointAttempted) * 100).toFixed(1)}%`
                            : "0.0%"}
                        </div>
                      </div>
                    </div>

                    <div className={styles.stat_row}>
                      <div
                        className={cx(
                          styles.team_stat,
                          styles.home_stat,
                          {
                            [styles.stat_winner]: getBetterTeam(
                              finalStats.teamStats.home.freeThrowsMade /
                                Math.max(1, finalStats.teamStats.home.freeThrowsAttempted),
                              finalStats.teamStats.away.freeThrowsMade /
                                Math.max(1, finalStats.teamStats.away.freeThrowsAttempted)
                            ) === "home",
                          }
                        )}
                        style={{ color: homeColors?.primary }}
                      >
                        {finalStats.teamStats.home.freeThrowsMade}/{finalStats.teamStats.home.freeThrowsAttempted}
                        <div className={styles.stat_percent}>
                          {finalStats.teamStats.home.freeThrowsAttempted > 0
                            ? `${((finalStats.teamStats.home.freeThrowsMade / finalStats.teamStats.home.freeThrowsAttempted) * 100).toFixed(1)}%`
                            : "0.0%"}
                        </div>
                      </div>
                      <div className={styles.stat_name}>Free Throws</div>
                      <div
                        className={cx(
                          styles.team_stat,
                          styles.away_stat,
                          {
                            [styles.stat_winner]: getBetterTeam(
                              finalStats.teamStats.away.freeThrowsMade /
                                Math.max(1, finalStats.teamStats.away.freeThrowsAttempted),
                              finalStats.teamStats.home.freeThrowsMade /
                                Math.max(1, finalStats.teamStats.home.freeThrowsAttempted)
                            ) === "away",
                          }
                        )}
                        style={{ color: awayColors?.primary }}
                      >
                        {finalStats.teamStats.away.freeThrowsMade}/{finalStats.teamStats.away.freeThrowsAttempted}
                        <div className={styles.stat_percent}>
                          {finalStats.teamStats.away.freeThrowsAttempted > 0
                            ? `${((finalStats.teamStats.away.freeThrowsMade / finalStats.teamStats.away.freeThrowsAttempted) * 100).toFixed(1)}%`
                            : "0.0%"}
                        </div>
                      </div>
                    </div>

                    <div className={styles.stat_row}>
                      <div
                        className={cx(
                          styles.team_stat,
                          styles.home_stat,
                          {
                            [styles.stat_winner]: getBetterTeam(
                              finalStats.teamStats.home.rebounds,
                              finalStats.teamStats.away.rebounds
                            ) === "home",
                          }
                        )}
                        style={{ color: homeColors?.primary }}
                      >
                        {finalStats.teamStats.home.rebounds}
                      </div>
                      <div className={styles.stat_name}>Rebounds</div>
                      <div
                        className={cx(
                          styles.team_stat,
                          styles.away_stat,
                          {
                            [styles.stat_winner]: getBetterTeam(
                              finalStats.teamStats.away.rebounds,
                              finalStats.teamStats.home.rebounds
                            ) === "away",
                          }
                        )}
                        style={{ color: awayColors?.primary }}
                      >
                        {finalStats.teamStats.away.rebounds}
                      </div>
                    </div>

                    <div className={styles.stat_row}>
                      <div
                        className={cx(
                          styles.team_stat,
                          styles.home_stat,
                          {
                            [styles.stat_winner]: getBetterTeam(
                              finalStats.teamStats.home.assists,
                              finalStats.teamStats.away.assists
                            ) === "home",
                          }
                        )}
                        style={{ color: homeColors?.primary }}
                      >
                        {finalStats.teamStats.home.assists}
                      </div>
                      <div className={styles.stat_name}>Assists</div>
                      <div
                        className={cx(
                          styles.team_stat,
                          styles.away_stat,
                          {
                            [styles.stat_winner]: getBetterTeam(
                              finalStats.teamStats.away.assists,
                              finalStats.teamStats.home.assists
                            ) === "away",
                          }
                        )}
                        style={{ color: awayColors?.primary }}
                      >
                        {finalStats.teamStats.away.assists}
                      </div>
                    </div>

                    <div className={styles.stat_row}>
                      <div
                        className={cx(
                          styles.team_stat,
                          styles.home_stat,
                          {
                            [styles.stat_winner]: getBetterTeam(
                              finalStats.teamStats.home.steals,
                              finalStats.teamStats.away.steals
                            ) === "home",
                          }
                        )}
                        style={{ color: homeColors?.primary }}
                      >
                        {finalStats.teamStats.home.steals}
                      </div>
                      <div className={styles.stat_name}>Steals</div>
                      <div
                        className={cx(
                          styles.team_stat,
                          styles.away_stat,
                          {
                            [styles.stat_winner]: getBetterTeam(
                              finalStats.teamStats.away.steals,
                              finalStats.teamStats.home.steals
                            ) === "away",
                          }
                        )}
                        style={{ color: awayColors?.primary }}
                      >
                        {finalStats.teamStats.away.steals}
                      </div>
                    </div>

                    <div className={styles.stat_row}>
                      <div
                        className={cx(
                          styles.team_stat,
                          styles.home_stat,
                          {
                            [styles.stat_winner]: getBetterTeam(
                              finalStats.teamStats.home.blocks,
                              finalStats.teamStats.away.blocks
                            ) === "home",
                          }
                        )}
                        style={{ color: homeColors?.primary }}
                      >
                        {finalStats.teamStats.home.blocks}
                      </div>
                      <div className={styles.stat_name}>Blocks</div>
                      <div
                        className={cx(
                          styles.team_stat,
                          styles.away_stat,
                          {
                            [styles.stat_winner]: getBetterTeam(
                              finalStats.teamStats.away.blocks,
                              finalStats.teamStats.home.blocks
                            ) === "away",
                          }
                        )}
                        style={{ color: awayColors?.primary }}
                      >
                        {finalStats.teamStats.away.blocks}
                      </div>
                    </div>

                    <div className={styles.stat_row}>
                      <div
                        className={cx(
                          styles.team_stat,
                          styles.home_stat,
                          {
                            [styles.stat_winner]: getBetterTeam(
                              finalStats.teamStats.away.turnovers,
                              finalStats.teamStats.home.turnovers
                            ) === "home",
                          }
                        )}
                        style={{ color: homeColors?.primary }}
                      >
                        {finalStats.teamStats.home.turnovers}
                      </div>
                      <div className={styles.stat_name}>Turnovers</div>
                      <div
                        className={cx(
                          styles.team_stat,
                          styles.away_stat,
                          {
                            [styles.stat_winner]: getBetterTeam(
                              finalStats.teamStats.home.turnovers,
                              finalStats.teamStats.away.turnovers
                            ) === "away",
                          }
                        )}
                        style={{ color: awayColors?.primary }}
                      >
                        {finalStats.teamStats.away.turnovers}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === "boxscore" && (
          <div className={styles.boxscore_tab}>
            <BoxScore
              gameInfo={gameData.game_info}
              playerStats={formattedPlayerStats}
            />
          </div>
        )}

        {activeTab === "advanced" && (
          <div className={styles.advanced_tab}>
            <div className={styles.advanced_stats}>
              <h3 className={styles.section_title}>Advanced Team Statistics</h3>
              <div className={styles.stat_container}>
                {finalStats.teamStats && (
                  <>
                    <div className={styles.stat_row}>
                      <div
                        className={cx(
                          styles.team_stat,
                          styles.home_stat,
                          {
                            [styles.stat_winner]: getBetterTeam(
                              finalStats.homeScore / Math.max(1, finalStats.teamStats.home.possessions),
                              finalStats.awayScore / Math.max(1, finalStats.teamStats.away.possessions)
                            ) === "home",
                          }
                        )}
                        style={{ color: homeColors?.primary }}
                      >
                        {finalStats.teamStats.home.possessions}
                      </div>
                      <div className={styles.stat_name}>Possessions</div>
                      <div
                        className={cx(
                          styles.team_stat,
                          styles.away_stat,
                          {
                            [styles.stat_winner]: getBetterTeam(
                              finalStats.awayScore / Math.max(1, finalStats.teamStats.away.possessions),
                              finalStats.homeScore / Math.max(1, finalStats.teamStats.home.possessions)
                            ) === "away",
                          }
                        )}
                        style={{ color: awayColors?.primary }}
                      >
                        {finalStats.teamStats.away.possessions}
                      </div>
                    </div>

                    <div className={styles.stat_row}>
                      <div
                        className={cx(
                          styles.team_stat,
                          styles.home_stat,
                          {
                            [styles.stat_winner]: getBetterTeam(
                              finalStats.teamStats.home.pace,
                              finalStats.teamStats.away.pace
                            ) === "home",
                          }
                        )}
                        style={{ color: homeColors?.primary }}
                      >
                        {finalStats.teamStats.home.pace}
                      </div>
                      <div className={styles.stat_name}>Pace</div>
                      <div
                        className={cx(
                          styles.team_stat,
                          styles.away_stat,
                          {
                            [styles.stat_winner]: getBetterTeam(
                              finalStats.teamStats.away.pace,
                              finalStats.teamStats.home.pace
                            ) === "away",
                          }
                        )}
                        style={{ color: awayColors?.primary }}
                      >
                        {finalStats.teamStats.away.pace}
                      </div>
                    </div>

                    <div className={styles.stat_row}>
                      <div
                        className={cx(
                          styles.team_stat,
                          styles.home_stat,
                          {
                            [styles.stat_winner]: getBetterTeam(
                              finalStats.teamStats.home.ortg,
                              finalStats.teamStats.away.ortg
                            ) === "home",
                          }
                        )}
                        style={{ color: homeColors?.primary }}
                      >
                        {finalStats.teamStats.home.ortg}
                      </div>
                      <div className={styles.stat_name}>Offensive Rating</div>
                      <div
                        className={cx(
                          styles.team_stat,
                          styles.away_stat,
                          {
                            [styles.stat_winner]: getBetterTeam(
                              finalStats.teamStats.away.ortg,
                              finalStats.teamStats.home.ortg
                            ) === "away",
                          }
                        )}
                        style={{ color: awayColors?.primary }}
                      >
                        {finalStats.teamStats.away.ortg}
                      </div>
                    </div>

                    <div className={styles.stat_row}>
                      <div
                        className={cx(
                          styles.team_stat,
                          styles.home_stat,
                          {
                            [styles.stat_winner]: getBetterTeam(
                              finalStats.teamStats.away.drtg,
                              finalStats.teamStats.home.drtg
                            ) === "home",
                          }
                        )}
                        style={{ color: homeColors?.primary }}
                      >
                        {finalStats.teamStats.home.drtg}
                      </div>
                      <div className={styles.stat_name}>Defensive Rating</div>
                      <div
                        className={cx(
                          styles.team_stat,
                          styles.away_stat,
                          {
                            [styles.stat_winner]: getBetterTeam(
                              finalStats.teamStats.home.drtg,
                              finalStats.teamStats.away.drtg
                            ) === "away",
                          }
                        )}
                        style={{ color: awayColors?.primary }}
                      >
                        {finalStats.teamStats.away.drtg}
                      </div>
                    </div>

                    <div className={styles.stat_row}>
                      <div
                        className={cx(
                          styles.team_stat,
                          styles.home_stat,
                          {
                            [styles.stat_winner]: getBetterTeam(
                              finalStats.teamStats.home.efg,
                              finalStats.teamStats.away.efg
                            ) === "home",
                          }
                        )}
                        style={{ color: homeColors?.primary }}
                      >
                        {finalStats.teamStats.home.efg}%
                      </div>
                      <div className={styles.stat_name}>Effective FG%</div>
                      <div
                        className={cx(
                          styles.team_stat,
                          styles.away_stat,
                          {
                            [styles.stat_winner]: getBetterTeam(
                              finalStats.teamStats.away.efg,
                              finalStats.teamStats.home.efg
                            ) === "away",
                          }
                        )}
                        style={{ color: awayColors?.primary }}
                      >
                        {finalStats.teamStats.away.efg}%
                      </div>
                    </div>

                    <div className={styles.stat_row}>
                      <div
                        className={cx(
                          styles.team_stat,
                          styles.home_stat,
                          {
                            [styles.stat_winner]: getBetterTeam(
                              finalStats.teamStats.home.ts,
                              finalStats.teamStats.away.ts
                            ) === "home",
                          }
                        )}
                        style={{ color: homeColors?.primary }}
                      >
                        {finalStats.teamStats.home.ts}%
                      </div>
                      <div className={styles.stat_name}>True Shooting%</div>
                      <div
                        className={cx(
                          styles.team_stat,
                          styles.away_stat,
                          {
                            [styles.stat_winner]: getBetterTeam(
                              finalStats.teamStats.away.ts,
                              finalStats.teamStats.home.ts
                            ) === "away",
                          }
                        )}
                        style={{ color: awayColors?.primary }}
                      >
                        {finalStats.teamStats.away.ts}%
                      </div>
                    </div>

                    <div className={styles.stat_row}>
                      <div
                        className={cx(
                          styles.team_stat,
                          styles.home_stat,
                          {
                            [styles.stat_winner]: getBetterTeam(
                              finalStats.teamStats.home.astRatio,
                              finalStats.teamStats.away.astRatio
                            ) === "home",
                          }
                        )}
                        style={{ color: homeColors?.primary }}
                      >
                        {finalStats.teamStats.home.astRatio}%
                      </div>
                      <div className={styles.stat_name}>Assist Ratio</div>
                      <div
                        className={cx(
                          styles.team_stat,
                          styles.away_stat,
                          {
                            [styles.stat_winner]: getBetterTeam(
                              finalStats.teamStats.away.astRatio,
                              finalStats.teamStats.home.astRatio
                            ) === "away",
                          }
                        )}
                        style={{ color: awayColors?.primary }}
                      >
                        {finalStats.teamStats.away.astRatio}%
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className={styles.summary_actions}>
        <button
          onClick={handlePlayAgain}
          className={`${styles.action_button} ${styles.play_again_button}`}
          aria-label="New Game"
        >
          New Game
        </button>
        <button
          onClick={handleWatchReplay}
          className={`${styles.action_button} ${styles.watch_replay_button}`}
          aria-label="Watch Replay"
        >
          Watch Replay
        </button>
      </div>

      <Footer />
    </div>
  );
}

export default GameSummaryPage;
