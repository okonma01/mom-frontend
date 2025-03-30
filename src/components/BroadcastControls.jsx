import React from "react";
import styles from "../styles/BroadcastControls.module.css";

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
    <div className={styles.broadcast_controls_panel}>
      <button 
        onClick={onSkipToStart} 
        className={styles.control_btn}
        disabled={isPlaying}
      >
        |&lt;
      </button>
      <button 
        onClick={onSkipToPrevious} 
        className={styles.control_btn}
        disabled={isPlaying}
      >
        &lt;&lt;
      </button>
      <button onClick={onPlayPause} className={styles.control_btn}>
        {isPlaying ? "Pause" : "Play"}
      </button>
      <button 
        onClick={onSkipToNext} 
        className={styles.control_btn}
        disabled={isPlaying}
      >
        &gt;&gt;
      </button>
      <button 
        onClick={onSkipToEnd} 
        className={styles.control_btn}
        disabled={isPlaying}
      >
        &gt;|
      </button>
      <div className={styles.speed_control}>
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
