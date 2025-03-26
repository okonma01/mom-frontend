// Placeholder team data until connected to a real backend
const TEAMS_DATA = [
  {
    team_id: "celtics",
    team_name: "Boston Celtics",
    abbreviation: "BOS", // Keep for UI purposes
    season: 2024,
    coach: "Joe Mazzulla",
    record: "64-18",
    players: {
      "p1": { 
        player_id: "p1", 
        first_name: "Jayson", 
        last_name: "Tatum", 
        position: "SF", 
        rating: 94,
        jersey_number: 0
      },
      "p2": { 
        player_id: "p2", 
        first_name: "Jaylen", 
        last_name: "Brown", 
        position: "SG", 
        rating: 89,
        jersey_number: 7
      },
      "p3": { 
        player_id: "p3", 
        first_name: "Kristaps", 
        last_name: "Porzingis", 
        position: "C", 
        rating: 86,
        jersey_number: 8
      }
    },
    // Additional UI properties
    colors: {
      primary: "#007A33",
      secondary: "#BA9653"
    },
    logoUrl: "/assets/logos/celtics.png",
    ppg: "118.3",
    rpg: "44.5",
    apg: "26.4"
  },
  {
    team_id: "nuggets",
    team_name: "Denver Nuggets",
    abbreviation: "DEN",
    season: 2024,
    coach: "Michael Malone",
    record: "53-29",
    players: {
      "p4": { 
        player_id: "p4", 
        first_name: "Nikola", 
        last_name: "Jokić", 
        position: "C", 
        rating: 96,
        jersey_number: 15
      },
      "p5": { 
        player_id: "p5", 
        first_name: "Jamal", 
        last_name: "Murray", 
        position: "PG", 
        rating: 87,
        jersey_number: 27
      },
      "p6": { 
        player_id: "p6", 
        first_name: "Aaron", 
        last_name: "Gordon", 
        position: "PF", 
        rating: 83,
        jersey_number: 50
      }
    },
    // Additional UI properties
    colors: {
      primary: "#0E2240",
      secondary: "#FEC524"
    },
    logoUrl: "/assets/logos/nuggets.png",
    ppg: "113.6",
    rpg: "44.3",
    apg: "29.2"
  },
  {
    team_id: "lakers",
    team_name: "Los Angeles Lakers",
    abbreviation: "LAL",
    season: 2024,
    coach: "JJ Redick",
    record: "47-35",
    players: {
      "p7": { 
        player_id: "p7", 
        first_name: "LeBron", 
        last_name: "James", 
        position: "SF", 
        rating: 93,
        jersey_number: 23
      },
      "p8": { 
        player_id: "p8", 
        first_name: "Anthony", 
        last_name: "Davis", 
        position: "PF", 
        rating: 92,
        jersey_number: 3
      },
      "p9": { 
        player_id: "p9", 
        first_name: "D'Angelo", 
        last_name: "Russell", 
        position: "PG", 
        rating: 82,
        jersey_number: 1
      }
    },
    // Additional UI properties
    colors: {
      primary: "#552583",
      secondary: "#FDB927"
    },
    logoUrl: "/assets/logos/lakers.png",
    ppg: "117.2",
    rpg: "43.5",
    apg: "27.1"
  },
  {
    team_id: "bucks",
    team_name: "Milwaukee Bucks",
    abbreviation: "MIL",
    season: 2024,
    coach: "Doc Rivers",
    record: "49-33",
    players: {
      "p10": { 
        player_id: "p10", 
        first_name: "Giannis", 
        last_name: "Antetokounmpo", 
        position: "PF", 
        rating: 95,
        jersey_number: 34
      },
      "p11": { 
        player_id: "p11", 
        first_name: "Damian", 
        last_name: "Lillard", 
        position: "PG", 
        rating: 90,
        jersey_number: 0
      },
      "p12": { 
        player_id: "p12", 
        first_name: "Brook", 
        last_name: "Lopez", 
        position: "C", 
        rating: 83,
        jersey_number: 11
      }
    },
    // Additional UI properties
    colors: {
      primary: "#00471B",
      secondary: "#EEE1C6"
    },
    logoUrl: "/assets/logos/bucks.png",
    ppg: "115.9",
    rpg: "42.8",
    apg: "25.3"
  }
];

// This function fetches teams and adapts them for UI usage
export const fetchTeams = async () => {
  // Simulate API call
  return new Promise((resolve) => {
    setTimeout(() => {
      // Transform the data to be compatible with the UI components
      const uiReadyTeams = TEAMS_DATA.map(team => {
        // Extract key players for the UI
        const keyPlayers = Object.values(team.players)
          .sort((a, b) => b.rating - a.rating)
          .slice(0, 3)
          .map(p => ({
            id: p.player_id,
            name: `${p.first_name} ${p.last_name}`,
            rating: p.rating
          }));
        
        return {
          id: team.team_id,
          name: team.team_name,
          abbreviation: team.abbreviation,
          season: team.season,
          coach: team.coach,
          record: team.record,
          colors: team.colors,
          logoUrl: team.logoUrl,
          ppg: team.ppg,
          rpg: team.rpg,
          apg: team.apg,
          keyPlayers: keyPlayers,
          // Include raw data for other uses
          rawData: team
        };
      });
      
      resolve(uiReadyTeams);
    }, 500);
  });
};

// Additional functions to work with the team data
export const getPlayersByTeam = (teamId) => {
  const team = TEAMS_DATA.find(t => t.team_id === teamId);
  if (!team) return [];
  return Object.values(team.players);
};

export const getTeamById = (teamId) => {
  return TEAMS_DATA.find(t => t.team_id === teamId);
};
