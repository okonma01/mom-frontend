import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/WelcomePage.css';
import Footer from "../components/Footer";

function WelcomePage() {
  return (
    <div className="welcome-container">
      <div className="welcome-content">
        <h1>Make or Miss</h1>
        <p>Basketball Simulation</p>
        <Link to="/select-teams" className="start-button">
          Start
        </Link>
        <Footer />
      </div>
    </div>
  );
}

export default WelcomePage;
