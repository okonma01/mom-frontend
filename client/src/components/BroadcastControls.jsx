import React from "react";
import styles from "../styles/BroadcastControls.module.css";
import { memo } from "react";

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
  // Format speed display with one decimal place
  const displaySpeed = playbackSpeed.toFixed(1) + "x";
  
  return (
    <div className={styles.broadcast_controls_panel}>
      <div className={styles.main_controls}>
        <button 
          onClick={onSkipToStart} 
          className={styles.control_btn}
          disabled={isPlaying}
          aria-label="Skip to start"
          title="Skip to start"
        >
          <span className={styles.control_icon}>⏮</span>
        </button>
        
        <button 
          onClick={onSkipToPrevious} 
          className={styles.control_btn}
          disabled={isPlaying}
          aria-label="Previous quarter"
          title="Previous quarter"
        >
          <span className={styles.control_icon}>⏪</span>
        </button>
        
        <button 
          onClick={onPlayPause} 
          className={`${styles.control_btn} ${styles.play_btn}`}
          aria-label={isPlaying ? "Pause" : "Play"}
          title={isPlaying ? "Pause" : "Play"}
        >
          <span className={styles.control_icon}>
            {isPlaying ? "⏸" : "▶"}
          </span>
        </button>
        
        <button 
          onClick={onSkipToNext} 
          className={styles.control_btn}
          disabled={isPlaying}
          aria-label="Next quarter"
          title="Next quarter"
        >
          <span className={styles.control_icon}>⏩</span>
        </button>
        
        <button 
          onClick={onSkipToEnd} 
          className={styles.control_btn}
          disabled={isPlaying}
          aria-label="Skip to end"
          title="Skip to end"
        >
          <span className={styles.control_icon}>⏭</span>
        </button>
      </div>
      
      <div className={styles.speed_control}>
        <label htmlFor="playback-speed">Speed: <span className={styles.speed_value}>{displaySpeed}</span></label>
        <input 
          id="playback-speed"
          type="range" 
          min="0.5" 
          max="2" 
          step="0.25" 
          value={playbackSpeed} 
          onChange={(e) => onSpeedChange(Number(e.target.value))} 
          aria-label="Playback speed"
        />
      </div>
    </div>
  );
};

export default memo(BroadcastControls);
