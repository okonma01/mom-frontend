import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/WelcomePage.css';
import Footer from "../components/Footer";

function WelcomePage() {
  return (
    <div className="welcome-container">
      <video className="background-video" autoPlay loop muted>
        <source src="/assets/bg.mov" type="video/quicktime" />
      </video>
      <div className="welcome-content">
        <h1>Make or Miss</h1>
        <p>Basketball Simulation</p>
        <Link to="/select-teams" className="start-button">
          Play
        </Link>
        <div className="version-info">v3.0</div>
      </div>
      <Footer />
    </div>
  );
}

export default WelcomePage;
