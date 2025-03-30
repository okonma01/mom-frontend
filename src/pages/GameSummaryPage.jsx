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
  const [activeTab, setActiveTab] = useState("summary");

  useEffect(() => {
    const fetchGame = async () => {
      try {
        const response = await fetch(getAssetPath(`game_${gameId}.json`));
        const data = await response.json();
        setGameData(data);
        setLoading(false);
      } catch (error) {
        console.error("Error loading game summary data:", error);
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
    if (!gameData) return null; // Find the game_over event to get final scores

    // Find the game_over event to get final scores
    const gameOverEvent = gameData.events.find(
      (event) => event.event_type === "game_over"
    );
    if (!gameOverEvent) return null;

    const lastCheckpoint =
      gameData.checkpoints[gameData.checkpoints.length - 1];

    const quarterScores = [];
    let homeTotal = 0;
    let awayTotal = 0;

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

    return {
      homeScore: gameOverEvent.details.home_score,
      awayScore: gameOverEvent.details.away_score,
      quarterScores,
      teamStats: lastCheckpoint.team_stats,
      playerStats: lastCheckpoint.player_states,
    };
  }, [gameData]);

  // Format player stats for BoxScore component
  const formattedPlayerStats = useMemo(() => {
    if (!finalStats || !finalStats.playerStats || !gameData) return {};
    
    const formattedStats = {};
    
    // Process each player's stats from the checkpoint data
    gameData.game_info.teams.forEach((team, teamIndex) => {
      team.players.forEach((player) => {
        const playerId = player.player_id || `p${player.player_index}`;
        
        if (finalStats.playerStats[playerId]) {
          const playerState = finalStats.playerStats[playerId];
          
          formattedStats[playerId] = {
            points: playerState.pts || 0,
            rebounds: (playerState.orb || 0) + (playerState.drb || 0),
            assists: playerState.ast || 0,
            steals: playerState.stl || 0,
            turnovers: playerState.tov || 0,
            fieldGoalMade: playerState.fg || 0,
            fieldGoalAttempted: playerState.fga || 0,
            threePointMade: playerState.tp || 0,
            threePointAttempted: playerState.tpa || 0,
            freeThrowsMade: playerState.ft || 0,
            freeThrowsAttempted: playerState.fta || 0,
            minutes: Math.round(playerState.mp / 60) || 0,
            blocks: playerState.blk || 0,
            fouls: playerState.pf || 0
          };
        }
      });
    });
    
    return formattedStats;
  }, [finalStats, gameData]);

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

  const advancedStats = useMemo(() => {
    if (!finalStats) return null;

    const home = finalStats.teamStats[0];
    const away = finalStats.teamStats[1];

    return {
      home: {
        efgPct:
          home.fg > 0
            ? Math.round(((home.fg + 0.5 * home.tp) / home.fga) * 1000) / 10
            : 0,
        tsPct:
          home.pts > 0
            ? Math.round(
                (home.pts / (2 * (home.fga + 0.44 * home.fta))) * 1000
              ) / 10
            : 0,
        possessions: Math.round(
          home.fga - home.orb + home.tov + 0.44 * home.fta
        ),
        pace: Math.round(
          ((home.fga - home.orb + home.tov + 0.44 * home.fta) * 48) / 40
        ),
        ortg: Math.round(
          (home.pts / (home.fga - home.orb + home.tov + 0.44 * home.fta)) * 100
        ),
        astRatio: home.fg > 0 ? Math.round((home.ast / home.fg) * 100) : 0,
        drtg: Math.round(
          (away.pts / (away.fga - away.orb + away.tov + 0.44 * away.fta)) * 100
        ),
      },
      away: {
        efgPct:
          away.fg > 0
            ? Math.round(((away.fg + 0.5 * away.tp) / away.fga) * 1000) / 10
            : 0,
        tsPct:
          away.pts > 0
            ? Math.round(
                (away.pts / (2 * (away.fga + 0.44 * away.fta))) * 1000
              ) / 10
            : 0,
        possessions: Math.round(
          away.fga - away.orb + away.tov + 0.44 * away.fta
        ),
        pace: Math.round(
          ((away.fga - away.orb + away.tov + 0.44 * away.fta) * 48) / 40
        ),
        ortg: Math.round(
          (away.pts / (away.fga - away.orb + away.tov + 0.44 * away.fta)) * 100
        ),
        astRatio: away.fg > 0 ? Math.round((away.ast / away.fg) * 100) : 0,
        drtg: Math.round(
          (home.pts / (home.fga - home.orb + home.tov + 0.44 * home.fta)) * 100
        ),
      },
    };
  }, [finalStats]);

  const getTeamAbbreviation = (teamName) => {
    if (!teamName) return "";

    if (teamName.toLowerCase().includes("trail blazers")) return "POR";
    if (teamName.toLowerCase().includes("timberwolves")) return "MIN";

    const words = teamName.split(" ");
    if (words.length === 1) {
      return teamName.substring(0, 3).toUpperCase();
    }

    return words
      .slice(0, 3)
      .map((word) => word[0])
      .join("")
      .toUpperCase();
  };

  if (loading) {
    return <div className={styles.loading}>Loading summary...</div>;
  }

  if (!gameData || !finalStats) {
    return <div className={styles.error}>Failed to load game summary</div>;
  }

  const homeTeam = gameData.game_info.teams[0];
  const awayTeam = gameData.game_info.teams[1];
  const winner = finalStats.homeScore > finalStats.awayScore ? 0 : 1;
  const homeAbbr = homeTeam.abbreviation;
  const awayAbbr = awayTeam.abbreviation;

  return (
    <div
      className={styles.game_summary_container}
      style={{
        backgroundImage: courtImagePath ? `url(${courtImagePath})` : "none",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        backgroundAttachment: "fixed",
        backgroundBlendMode: "overlay",
      }}
    >
      <div className={styles.final_score_banner}>
        <div className={styles.team_logo_container}>
          <img
            src={getTeamLogoPath(homeTeam.team_name)}
            alt={`${homeTeam.team_name} logo`}
            className={styles.team_logo}
            onError={(e) => {
              e.target.src = "/assets/logos/default.png";
            }}
          />
        </div>

        <div
          className={cx(styles.score_display, {
            [styles.winner_home]: winner === 0,
          })}
        >
          <span
            className={styles.team_abbr}
            style={{ color: teamColors[0]?.primary }}
          >
            {homeAbbr}
          </span>
          <span className={styles.score_value}>{finalStats.homeScore}</span>
        </div>

        <div className={styles.score_separator}>FINAL</div>

        <div
          className={cx(styles.score_display, {
            [styles.winner_away]: winner === 1,
          })}
        >
          <span className={styles.score_value}>{finalStats.awayScore}</span>
          <span
            className={styles.team_abbr}
            style={{ color: teamColors[1]?.primary }}
          >
            {awayAbbr}
          </span>
        </div>

        <div className={styles.team_logo_container}>
          <img
            src={getTeamLogoPath(awayTeam.team_name)}
            alt={`${awayTeam.team_name} logo`}
            className={styles.team_logo}
            onError={(e) => {
              e.target.src = "/assets/logos/default.png";
            }}
          />
        </div>
      </div>

      <div className={styles.tabs}>
        <button
          className={cx(
            styles.tab,
            activeTab === "summary" ? styles.active : ""
          )}
          onClick={() => handleTabChange("summary")}
        >
          Summary
        </button>
        <button
          className={cx(
            styles.tab,
            activeTab === "boxscore" ? styles.active : ""
          )}
          onClick={() => handleTabChange("boxscore")}
        >
          Box Score
        </button>
        <button
          className={cx(
            styles.tab,
            activeTab === "advanced" ? styles.active : ""
          )}
          onClick={() => handleTabChange("advanced")}
        >
          Advanced Stats
        </button>
      </div>

      <div className={styles.tab_content}>
        {activeTab === "summary" && (
          <div className={styles.summary_tab}>
            <div className={styles.quarter_scores}>
              <table className={styles.quarters_table}>
                <thead>
                  <tr>
                    <th></th>
                    {finalStats.quarterScores.map((q) => (
                      <th key={q.quarter}>Q{q.quarter}</th>
                    ))}
                    <th>F</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ color: teamColors[0]?.primary }}>
                    <td className={styles.team_name}>{homeAbbr}</td>
                    {finalStats.quarterScores.map((q) => (
                      <td key={q.quarter}>{q.home}</td>
                    ))}
                    <td className={styles.final_score_cell}>
                      {finalStats.homeScore}
                    </td>
                  </tr>
                  <tr style={{ color: teamColors[1]?.primary }}>
                    <td className={styles.team_name}>{awayAbbr}</td>
                    {finalStats.quarterScores.map((q) => (
                      <td key={q.quarter}>{q.away}</td>
                    ))}
                    <td className={styles.final_score_cell}>
                      {finalStats.awayScore}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className={styles.key_stats}>
              <div className={styles.stat_row}>
                <div
                  className={cx(styles.team_stat, styles.home_stat, {
                    [styles.stat_winner]:
                      finalStats.teamStats[0].fg_pct >
                      finalStats.teamStats[1].fg_pct,
                  })}
                  style={{ color: teamColors[0]?.primary }}
                >
                  {finalStats.teamStats[0].fg_pct}%
                </div>
                <div className={styles.stat_name}>FG%</div>
                <div
                  className={cx(styles.team_stat, styles.away_stat, {
                    [styles.stat_winner]:
                      finalStats.teamStats[1].fg_pct >
                      finalStats.teamStats[0].fg_pct,
                  })}
                  style={{ color: teamColors[1]?.primary }}
                >
                  {finalStats.teamStats[1].fg_pct}%
                </div>
              </div>

              <div className={styles.stat_row}>
                <div
                  className={cx(styles.team_stat, styles.home_stat, {
                    [styles.stat_winner]:
                      finalStats.teamStats[0].tp_pct >
                      finalStats.teamStats[1].tp_pct,
                  })}
                  style={{ color: teamColors[0]?.primary }}
                >
                  {finalStats.teamStats[0].tp_pct}%
                </div>
                <div className={styles.stat_name}>3PT%</div>
                <div
                  className={cx(styles.team_stat, styles.away_stat, {
                    [styles.stat_winner]:
                      finalStats.teamStats[1].tp_pct >
                      finalStats.teamStats[0].tp_pct,
                  })}
                  style={{ color: teamColors[1]?.primary }}
                >
                  {finalStats.teamStats[1].tp_pct}%
                </div>
              </div>

              <div className={styles.stat_row}>
                <div
                  className={cx(styles.team_stat, styles.home_stat, {
                    [styles.stat_winner]:
                      finalStats.teamStats[0].ft_pct >
                      finalStats.teamStats[1].ft_pct,
                  })}
                  style={{ color: teamColors[0]?.primary }}
                >
                  {finalStats.teamStats[0].ft_pct}%
                </div>
                <div className={styles.stat_name}>FT%</div>
                <div
                  className={cx(styles.team_stat, styles.away_stat, {
                    [styles.stat_winner]:
                      finalStats.teamStats[1].ft_pct >
                      finalStats.teamStats[0].ft_pct,
                  })}
                  style={{ color: teamColors[1]?.primary }}
                >
                  {finalStats.teamStats[1].ft_pct}%
                </div>
              </div>

              <div className={styles.stat_row}>
                <div
                  className={cx(styles.team_stat, styles.home_stat, {
                    [styles.stat_winner]:
                      finalStats.teamStats[0].orb +
                        finalStats.teamStats[0].drb >
                      finalStats.teamStats[1].orb +
                        finalStats.teamStats[1].drb,
                  })}
                  style={{ color: teamColors[0]?.primary }}
                >
                  {finalStats.teamStats[0].orb + finalStats.teamStats[0].drb}
                </div>
                <div className={styles.stat_name}>REB</div>
                <div
                  className={cx(styles.team_stat, styles.away_stat, {
                    [styles.stat_winner]:
                      finalStats.teamStats[1].orb +
                        finalStats.teamStats[1].drb >
                      finalStats.teamStats[0].orb +
                        finalStats.teamStats[0].drb,
                  })}
                  style={{ color: teamColors[1]?.primary }}
                >
                  {finalStats.teamStats[1].orb + finalStats.teamStats[1].drb}
                </div>
              </div>

              <div className={styles.stat_row}>
                <div
                  className={cx(styles.team_stat, styles.home_stat, {
                    [styles.stat_winner]:
                      finalStats.teamStats[0].ast >
                      finalStats.teamStats[1].ast,
                  })}
                  style={{ color: teamColors[0]?.primary }}
                >
                  {finalStats.teamStats[0].ast}
                </div>
                <div className={styles.stat_name}>AST</div>
                <div
                  className={cx(styles.team_stat, styles.away_stat, {
                    [styles.stat_winner]:
                      finalStats.teamStats[1].ast >
                      finalStats.teamStats[0].ast,
                  })}
                  style={{ color: teamColors[1]?.primary }}
                >
                  {finalStats.teamStats[1].ast}
                </div>
              </div>

              <div className={styles.stat_row}>
                <div
                  className={cx(styles.team_stat, styles.home_stat, {
                    [styles.stat_winner]:
                      finalStats.teamStats[0].stl >
                      finalStats.teamStats[1].stl,
                  })}
                  style={{ color: teamColors[0]?.primary }}
                >
                  {finalStats.teamStats[0].stl}
                </div>
                <div className={styles.stat_name}>STL</div>
                <div
                  className={cx(styles.team_stat, styles.away_stat, {
                    [styles.stat_winner]:
                      finalStats.teamStats[1].stl >
                      finalStats.teamStats[0].stl,
                  })}
                  style={{ color: teamColors[1]?.primary }}
                >
                  {finalStats.teamStats[1].stl}
                </div>
              </div>

              <div className={styles.stat_row}>
                <div
                  className={cx(styles.team_stat, styles.home_stat, {
                    [styles.stat_winner]:
                      finalStats.teamStats[0].blk >
                      finalStats.teamStats[1].blk,
                  })}
                  style={{ color: teamColors[0]?.primary }}
                >
                  {finalStats.teamStats[0].blk}
                </div>
                <div className={styles.stat_name}>BLK</div>
                <div
                  className={cx(styles.team_stat, styles.away_stat, {
                    [styles.stat_winner]:
                      finalStats.teamStats[1].blk >
                      finalStats.teamStats[0].blk,
                  })}
                  style={{ color: teamColors[1]?.primary }}
                >
                  {finalStats.teamStats[1].blk}
                </div>
              </div>

              <div className={styles.stat_row}>
                <div
                  className={cx(styles.team_stat, styles.home_stat, {
                    [styles.stat_winner]:
                      finalStats.teamStats[0].tov <
                      finalStats.teamStats[1].tov,
                  })}
                  style={{ color: teamColors[0]?.primary }}
                >
                  {finalStats.teamStats[0].tov}
                </div>
                <div className={styles.stat_name}>TOV</div>
                <div
                  className={cx(styles.team_stat, styles.away_stat, {
                    [styles.stat_winner]:
                      finalStats.teamStats[1].tov <
                      finalStats.teamStats[0].tov,
                  })}
                  style={{ color: teamColors[1]?.primary }}
                >
                  {finalStats.teamStats[1].tov}
                </div>
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
              <div className={styles.stat_row}>
                <div
                  className={cx(styles.team_stat, styles.home_stat, {
                    [styles.stat_winner]:
                      advancedStats.home.efgPct > advancedStats.away.efgPct,
                  })}
                  style={{ color: teamColors[0]?.primary }}
                >
                  {advancedStats.home.efgPct}%
                </div>
                <div className={styles.stat_name}>Effective FG%</div>
                <div
                  className={cx(styles.team_stat, styles.away_stat, {
                    [styles.stat_winner]:
                      advancedStats.away.efgPct > advancedStats.home.efgPct,
                  })}
                  style={{ color: teamColors[1]?.primary }}
                >
                  {advancedStats.away.efgPct}%
                </div>
              </div>

              <div className={styles.stat_row}>
                <div
                  className={cx(styles.team_stat, styles.home_stat, {
                    [styles.stat_winner]:
                      advancedStats.home.tsPct > advancedStats.away.tsPct,
                  })}
                  style={{ color: teamColors[0]?.primary }}
                >
                  {advancedStats.home.tsPct}%
                </div>
                <div className={styles.stat_name}>True Shooting%</div>
                <div
                  className={cx(styles.team_stat, styles.away_stat, {
                    [styles.stat_winner]:
                      advancedStats.away.tsPct > advancedStats.home.tsPct,
                  })}
                  style={{ color: teamColors[1]?.primary }}
                >
                  {advancedStats.away.tsPct}%
                </div>
              </div>

              <div className={styles.stat_row}>
                <div
                  className={cx(styles.team_stat, styles.home_stat, {
                    [styles.stat_winner]:
                      advancedStats.home.astRatio > advancedStats.away.astRatio,
                  })}
                  style={{ color: teamColors[0]?.primary }}
                >
                  {advancedStats.home.astRatio}%
                </div>
                <div className={styles.stat_name}>Assist Ratio</div>
                <div
                  className={cx(styles.team_stat, styles.away_stat, {
                    [styles.stat_winner]:
                      advancedStats.away.astRatio > advancedStats.home.astRatio,
                  })}
                  style={{ color: teamColors[1]?.primary }}
                >
                  {advancedStats.away.astRatio}%
                </div>
              </div>

              <div className={styles.stat_row}>
                <div
                  className={cx(styles.team_stat, styles.home_stat, {
                    [styles.stat_winner]:
                      advancedStats.home.possessions >
                      advancedStats.away.possessions,
                  })}
                  style={{ color: teamColors[0]?.primary }}
                >
                  {advancedStats.home.possessions}
                </div>
                <div className={styles.stat_name}>Possessions</div>
                <div
                  className={cx(styles.team_stat, styles.away_stat, {
                    [styles.stat_winner]:
                      advancedStats.away.possessions >
                      advancedStats.home.possessions,
                  })}
                  style={{ color: teamColors[1]?.primary }}
                >
                  {advancedStats.away.possessions}
                </div>
              </div>

              <div className={styles.stat_row}>
                <div
                  className={cx(styles.team_stat, styles.home_stat, {
                    [styles.stat_winner]:
                      advancedStats.home.pace > advancedStats.away.pace,
                  })}
                  style={{ color: teamColors[0]?.primary }}
                >
                  {advancedStats.home.pace}
                </div>
                <div className={styles.stat_name}>Pace</div>
                <div
                  className={cx(styles.team_stat, styles.away_stat, {
                    [styles.stat_winner]:
                      advancedStats.away.pace > advancedStats.home.pace,
                  })}
                  style={{ color: teamColors[1]?.primary }}
                >
                  {advancedStats.away.pace}
                </div>
              </div>

              <div className={styles.stat_row}>
                <div
                  className={cx(styles.team_stat, styles.home_stat, {
                    [styles.stat_winner]:
                      advancedStats.home.ortg > advancedStats.away.ortg,
                  })}
                  style={{ color: teamColors[0]?.primary }}
                >
                  {advancedStats.home.ortg}
                </div>
                <div className={styles.stat_name}>Offensive Rating</div>
                <div
                  className={cx(styles.team_stat, styles.away_stat, {
                    [styles.stat_winner]:
                      advancedStats.away.ortg > advancedStats.home.ortg,
                  })}
                  style={{ color: teamColors[1]?.primary }}
                >
                  {advancedStats.away.ortg}
                </div>
              </div>

              <div className={styles.stat_row}>
                <div
                  className={cx(styles.team_stat, styles.home_stat, {
                    [styles.stat_winner]:
                      advancedStats.home.drtg < advancedStats.away.drtg,
                  })}
                  style={{ color: teamColors[0]?.primary }}
                >
                  {advancedStats.home.drtg}
                </div>
                <div className={styles.stat_name}>Defensive Rating</div>
                <div
                  className={cx(styles.team_stat, styles.away_stat, {
                    [styles.stat_winner]:
                      advancedStats.away.drtg < advancedStats.home.drtg,
                  })}
                  style={{ color: teamColors[1]?.primary }}
                >
                  {advancedStats.away.drtg}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className={styles.summary_actions}>
        <button onClick={handlePlayAgain} className={styles.play_again_button}>
          New Game
        </button>
        <button
          onClick={handleWatchReplay}
          className={styles.watch_replay_button}
        >
          Watch Replay
        </button>
      </div>

      <Footer />
    </div>
  );
}

export default GameSummaryPage;
