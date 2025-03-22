import React from 'react';
import '../styles/DVRControls.css';

function DVRControls({
  isPlaying,
  playbackSpeed,
  onPlayPause,
  onSkipToNext,
  onSkipToPrevious,
  onSkipToEnd,
  onSkipToStart,
  onSpeedChange
}) {
  return (
    <div className="dvr-controls">
      <button 
        className="control-button start-button" 
        onClick={onSkipToStart}
        aria-label="Skip to start"
      >
        <span>⏮</span>
      </button>
      
      <button 
        className="control-button prev-button" 
        onClick={onSkipToPrevious}
        aria-label="Previous quarter"
      >
        <span>⏪</span>
      </button>
      
      <button 
        className="control-button play-pause-button" 
        onClick={onPlayPause}
        aria-label={isPlaying ? "Pause" : "Play"}
      >
        <span>{isPlaying ? "⏸" : "▶"}</span>
      </button>
      
      <button 
        className="control-button next-button" 
        onClick={onSkipToNext}
        aria-label="Next quarter"
      >
        <span>⏩</span>
      </button>
      
      <button 
        className="control-button end-button" 
        onClick={onSkipToEnd}
        aria-label="Skip to end"
      >
        <span>⏭</span>
      </button>
      
      <div className="speed-control">
        <label htmlFor="speed-select">Speed:</label>
        <select 
          id="speed-select"
          value={playbackSpeed} 
          onChange={(e) => onSpeedChange(Number(e.target.value))}
        >
          <option value={0.5}>0.5x</option>
          <option value={1}>1x</option>
          <option value={2}>2x</option>
          <option value={4}>4x</option>
        </select>
      </div>
    </div>
  );
}

export default DVRControls;
