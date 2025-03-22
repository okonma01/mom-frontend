import React from 'react';
import { Routes, Route } from 'react-router-dom';
import WelcomePage from './pages/WelcomePage';
import TeamSelectionPage from './pages/TeamSelectionPage';
import GameSimulationPage from './pages/GameSimulationPage';
import GameSummaryPage from './pages/GameSummaryPage';
import './styles/App.css';

function App() {
  return (
    <div className="app">
      <Routes>
        <Route path="/" element={<WelcomePage />} />
        <Route path="/select-teams" element={<TeamSelectionPage />} />
        <Route path="/game/:gameId" element={<GameSimulationPage />} />
        <Route path="/summary/:gameId" element={<GameSummaryPage />} />
      </Routes>
    </div>
  );
}

export default App;
