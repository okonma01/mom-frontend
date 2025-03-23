import React from "react";
import "../styles/BoxScore.css";

const BoxScore = ({ gameInfo }) => {
  return (
    <div className="boxscore">
      <h3>Box Score</h3>
      <table>
        <thead>
          <tr>
            <th>Player</th>
            <th>PTS</th>
            <th>REB</th>
            <th>AST</th>
          </tr>
        </thead>
        <tbody>
          {gameInfo.teams.map((team) =>
            (team.players || []).map((player) => (
              <tr key={player.player_id}>
                <td>{player.player_name || player.player_id}</td>
                <td>{player.stats?.points || 0}</td>
                <td>{player.stats?.rebounds || 0}</td>
                <td>{player.stats?.assists || 0}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default BoxScore;
