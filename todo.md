Broadcast-Style Requirements Document

Below is a detailed list of requirements for the “Broadcast-Style” user interface. This interface will display a basketball game simulation in a way that resembles a real sports broadcast. It will pull data from a JSON file and use various images, icons, and sounds to enhance the user experience.

1. Overall Layout

Collapsible Scoreboard (Top Bar)
Displays the following at all times (when expanded):
Team names or logos
Current score for each team
Quarter (e.g., Q1, Q2, Q3, Q4, OT)
Time remaining in the current quarter
Collapses/expands on user click.
Include a small blinking “LIVE” indicator when the game is in progress.
Play-by-Play Feed
A vertical, auto-scrolling list of play events.
Highlights scoring plays with color or icons.
Simple text descriptions (e.g., “Player X hits a 3!”).
When a scoring event occurs, a small pop-up overlay also appears briefly before the event is added to the feed.
Box Score Section
Displays starter stats (PTS, REB, AST) by default.
A button or link to expand/collapse a full box score showing all players.
Stats update after each play.
Background
Use the home team’s court image as a faded background.
Court images are in PNG/JPG format, stored in /assets/courts/.
Sound Effects & Animations
Sound effects for:
End of quarter (gym scoreboard buzzer sound).
Scoring plays (e.g., crowd cheer).
Small animations for:
Score changes (e.g., flashing the updated score).
Quarter transitions (e.g., fade in/out “End of Q1” text).
Provide a toggle button to mute/unmute sounds.
2. Data & Assets

JSON Game State
The JSON file contains all play-by-play events, the current quarter, time remaining, scores, and stats for each player.
Team information (team name, color, etc.) can be included in the JSON or referenced by filenames (e.g., "team_logo": "bulls.png").
Images
Player Head Icons: PNG/JPG in /assets/players/.
Team Court Images: PNG/JPG in /assets/courts/.
Team Logos (if used): PNG/JPG in /assets/logos/.
Preloading
Preload all key assets (player icons, court images, logos) at the start for smoother transitions and instant display.
Sound Files
Stored in /assets/sounds/.
Examples:
buzzer.mp3 for end of quarter.
crowd-cheer.mp3 for scoring.
Must have a toggle to enable/disable sounds in the UI.
3. UI Behavior Details

Collapsible Scoreboard
By default, the scoreboard is expanded.
Clicking a “collapse” icon will hide the detailed scoreboard, leaving only minimal info (like the current quarter/time).
Clicking again expands it back.
Play-by-Play Auto-Scroll
The latest play should appear at the bottom of the list (or top, depending on design preference).
Auto-scroll to the newest play whenever it’s added.
Scoring Pop-Up
When a player scores, display a quick pop-up overlay:
Show the player’s head icon and jersey number.
Display short text like “John Doe – 3PT!”
After 1–2 seconds, fade out the overlay.
Quarter Transitions
At the end of each quarter, show an overlay text (e.g., “End of Q1”) for about 2 seconds.
Play the buzzer.mp3 sound.
Transition to the next quarter automatically.
Box Score Updates
Whenever a play changes a player’s stats (points, rebounds, assists), update the displayed stats in real time.
If the user has the expanded box score open, update all players’ stats.
User Sound Toggle
Provide a simple on/off button for sound effects.
If “off,” no sounds should play at all.
4. Aesthetic & Branding

Colorful & Unique Theme
Avoid copying ESPN or NBA color schemes directly.
Use a distinctive color palette that complements the team colors.
Ensure enough contrast for readability.
Typography
Use a clear, modern font for scoreboard text and stats.
Headings and scoreboard numbers can be larger and bold.
Animations
Keep them short and smooth (0.3–0.5s).
Use transitions on scoreboard collapse, pop-up overlays, and quarter transitions.

# Project To-Do List

## Broadcast-Style UI Implementation

- [x] Create BroadcastEventFeed component
- [x] Design collapsible feed interface
- [x] Style feed with professional broadcast appearance
- [x] Implement team colors and branding
- [x] Add event-specific styling and icons
- [x] Integrate component into GameSimulationPage

## Asset Management

- [ ] Set up directory structure for assets
  - [ ] Create `/assets/courts/` directory for court images
  - [ ] Create `/assets/logos/` directory for team logos
  - [ ] Create `/assets/players/` directory for player headshots
  - [ ] Create `/assets/sounds/` directory for sound effects

## Future Enhancements

- [ ] Add sound effects for key game events
- [ ] Implement animated player markers on a court diagram
- [ ] Create a stat overlay for selected players
- [ ] Add instant replay feature for key moments
- [ ] Implement on-screen graphics for streaks and milestones
- [ ] Create a TV-style scorebug for main interface

## New Scoreboard Design Requirements

- **Overall Layout**:
  - The scoreboard should be a horizontal bar spanning the top of the screen.
  - It should be divided into three main sections: left, center, and right.

- **Left Section**:
  - Display the team logos and names.
  - Use team colors for the background of each team's section.
  - Include the team's record (e.g., "39-30") above the team name.

- **Center Section**:
  - Display the current score for each team.
  - Use a larger font size for the scores to make them stand out.
  - Include a small indicator for the current quarter and time remaining.
  - Use a clear, modern font for readability.

- **Right Section**:
  - Display additional game information such as the quarter and shot clock.
  - Include a "LIVE" indicator with a blinking dot to show the game is in progress.
  - Use a contrasting color for the "LIVE" indicator to make it noticeable.