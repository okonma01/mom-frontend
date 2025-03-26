import React from "react";
import "../styles/BroadcastControls.css";

const BroadcastControls = ({ 
  isPlaying, 
  playbackSpeed, 
  onPlayPause, 
  onSpeedChange, 
  onSkipToPrevious, 
  onSkipToNext, 
  onSkipToStart, 
  onSkipToEnd 
}) => {
  return (
    <div className="broadcast-controls-panel">
      <button onClick={onSkipToStart} className="control-btn">|&lt;</button>
      <button onClick={onSkipToPrevious} className="control-btn">&lt;&lt;</button>
      <button onClick={onPlayPause} className="control-btn">
        {isPlaying ? "Pause" : "Play"}
      </button>
      <button onClick={onSkipToNext} className="control-btn">&gt;&gt;</button>
      <button onClick={onSkipToEnd} className="control-btn">&gt;|</button>
      <div className="speed-control">
        <label>Speed:</label>
        <input 
          type="range" 
          min="0.5" 
          max="2" 
          step="0.25" 
          value={playbackSpeed} 
          onChange={(e) => onSpeedChange(Number(e.target.value))} 
        />
      </div>
    </div>
  );
};

export default BroadcastControls;
