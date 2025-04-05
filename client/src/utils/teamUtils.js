/**
 * Utility functions for teams
 */

// Team colors mapping (surprise element - professional team colors)
export const TEAM_COLORS = {
  // Eastern Conference
  'Boston Celtics': {
    primary: '#007A33',
    secondary: '#FFFFFF',
    accent: '#BA9653'
  },
  'Brooklyn Nets': {
    primary: '#000000',
    secondary: '#FFFFFF',
    accent: '#707070'
  },
  'New York Knicks': {
    primary: '#006BB6',
    secondary: '#F58426',
    accent: '#BEC0C2'
  },
  'Philadelphia 76ers': {
    primary: '#006BB6',
    secondary: '#ED174C',
    accent: '#002B5C'
  },
  'Toronto Raptors': {
    primary: '#CE1141',
    secondary: '#000000',
    accent: '#A1A1A4'
  },
  'Chicago Bulls': {
    primary: '#CE1141',
    secondary: '#000000',
    accent: '#FFFFFF'
  },
  'Cleveland Cavaliers': {
    primary: '#860038',
    secondary: '#041E42',
    accent: '#FDBB30'
  },
  'Detroit Pistons': {
    primary: '#1D428A',
    secondary: '#C8102E',
    accent: '#BEC0C2'
  },
  'Indiana Pacers': {
    primary: '#002D62',
    secondary: '#FDBB30',
    accent: '#BEC0C2'
  },
  'Milwaukee Bucks': {
    primary: '#00471B',
    secondary: '#EEE1C6',
    accent: '#0077C0'
  },
  'Atlanta Hawks': {
    primary: '#E03A3E',
    secondary: '#FFFFFF',
    accent: '#C1D32F'
  },
  'Charlotte Hornets': {
    primary: '#1D1160',
    secondary: '#00788C',
    accent: '#A1A1A4'
  },
  'Miami Heat': {
    primary: '#98002E',
    secondary: '#F9A01B',
    accent: '#000000'
  },
  'Orlando Magic': {
    primary: '#0077C0',
    secondary: '#000000',
    accent: '#C4CED4'
  },
  'Washington Wizards': {
    primary: '#002B5C',
    secondary: '#E31837',
    accent: '#C4CED4'
  },

  // Western Conference
  'Denver Nuggets': {
    primary: '#0E2240',
    secondary: '#FEC524',
    accent: '#8B2131'
  },
  'Minnesota Timberwolves': {
    primary: '#0C2340',
    secondary: '#236192',
    accent: '#78BE20'
  },
  'Oklahoma City Thunder': {
    primary: '#007AC1',
    secondary: '#EF3B24',
    accent: '#002D62'
  },
  'Portland Trail Blazers': {
    primary: '#E03A3E',
    secondary: '#000000',
    accent: '#FFFFFF'
  },
  'Utah Jazz': {
    primary: '#002B5C',
    secondary: '#00471B',
    accent: '#F9A01B'
  },
  'Golden State Warriors': {
    primary: '#1D428A',
    secondary: '#FFC72C',
    accent: '#26282A'
  },
  'LA Clippers': {
    primary: '#C8102E',
    secondary: '#1D428A',
    accent: '#000000'
  },
  'Los Angeles Lakers': {
    primary: '#552583',
    secondary: '#FDB927',
    accent: '#000000'
  },
  'Phoenix Suns': {
    primary: '#1D1160',
    secondary: '#E56020',
    accent: '#000000'
  },
  'Sacramento Kings': {
    primary: '#5A2D81',
    secondary: '#63727A',
    accent: '#000000'
  },
  'Dallas Mavericks': {
    primary: '#00538C',
    secondary: '#002B5E',
    accent: '#B8C4CA'
  },
  'Houston Rockets': {
    primary: '#CE1141',
    secondary: '#000000',
    accent: '#FFFFFF'
  },
  'Memphis Grizzlies': {
    primary: '#5D76A9',
    secondary: '#12173F',
    accent: '#F5B112'
  },
  'New Orleans Pelicans': {
    primary: '#0C2340',
    secondary: '#C8102E',
    accent: '#85714D'
  },
  'San Antonio Spurs': {
    primary: '#000000',
    secondary: '#FFFFFF',
    accent: '#C4CED4'
  }
};

// Get team colors, with fallback colors
export const getTeamColors = (teamName) => {
  if (!teamName) return { primary: '#333', secondary: '#888', accent: '#ccc' };
  
  // Try to match the team name directly
  if (TEAM_COLORS[teamName]) {
    return TEAM_COLORS[teamName];
  }
  
  // If the exact name isn't found, try to find a partial match
  // This helps with variations like "celtics24" matching to "Boston Celtics"
  const teamLower = teamName.toLowerCase();
  for (const [key, value] of Object.entries(TEAM_COLORS)) {
    if (key.toLowerCase().includes(teamLower) || teamLower.includes(key.toLowerCase())) {
      return value;
    }
  }
  
  // Fallback colors
  return { primary: '#333', secondary: '#888', accent: '#ccc' };
};

// Get path to team logo
export const getTeamLogoPath = (teamName) => {
  if (!teamName) return null;
  
  // Strip any year numbers (e.g., "celtics24" becomes "celtics")
  const baseTeamName = teamName.replace(/\d+$/, '').split(' ').pop().toLowerCase();
  
  return `/assets/logos/${baseTeamName}-alt.webp`;
};

// Get path to court image
export const getCourtImagePath = (teamName) => {
  if (!teamName) return null;
  
  // Strip any year numbers (e.g., "celtics24" becomes "celtics")
  const baseTeamName = teamName.replace(/\d+$/, '').split(' ').pop().toLowerCase();
  
  return `/assets/courts/${baseTeamName}.jpg`;
};

export const getTeamDefaultImagePath = (playerId, gameInfo) => {
  let teamName = "";

  for (const team of gameInfo?.teams || []) {
    for (const player of team?.players || []) {
      if (player.player_id === playerId) {
        teamName = team.team_name;
        break;
      }
    }
    if (teamName) break;
  }

  const formattedTeamName = teamName ? 
    teamName.split(" ").pop().toLowerCase().replace(/\d+/g, '') : "";
  
  return formattedTeamName ? 
    `/assets/player icons/${formattedTeamName}/default.png` :
    `/assets/player icons/default.png`;
};