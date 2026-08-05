import React, { useState, useEffect } from 'react';


// =============================================================================
// UNIVERSAL BRACKET STRUCTURE CONFIGS
// =============================================================================
const BRACKET_CONFIGS = {
  // 18 Teams (Big Ten Behemoth - 6 Rounds)
  TRIPLE_BYE_18: {
    rounds: [
      { name: 'Round 1',       slots: 4, ghosts: [1, 3] }, // Pushes games to top and bottom paths
      { name: 'Round 2',       slots: 4, ghosts: [] },
      { name: 'Round 3',       slots: 4, ghosts: [] },
      { name: 'Quarterfinals', slots: 4, ghosts: [] },
      { name: 'Semifinals',    slots: 2, ghosts: [] },
      { name: 'Championship',  slots: 1, ghosts: [] },
    ],
  },
  // 16 Teams (SEC, Big 12)
  DOUBLE_BYE_16: {
    rounds: [
      { name: 'Round 1',       slots: 4, ghosts: [] },
      { name: 'Round 2',       slots: 4, ghosts: [] },
      { name: 'Quarterfinals', slots: 4, ghosts: [] },
      { name: 'Semifinals',    slots: 2, ghosts: [] },
      { name: 'Championship',  slots: 1, ghosts: [] },
    ],
  },
  // 15 Teams (ACC)
  DOUBLE_BYE_15: {
    rounds: [
      { name: 'Round 1',       slots: 4, ghosts: [2] }, // Leaves top slot empty for the 8/9 game in Rd 2
      { name: 'Round 2',       slots: 4, ghosts: []  },
      { name: 'Quarterfinals', slots: 4, ghosts: []  },
      { name: 'Semifinals',    slots: 2, ghosts: []  },
      { name: 'Championship',  slots: 1, ghosts: []  },
    ],
  },
  // 14 Teams (A-10, Sun Belt, AAC, CAA)
  DOUBLE_BYE_14: {
    rounds: [
      { name: 'Round 1',       slots: 4, ghosts: [0, 3] }, // Centers the 2 games in slots 1 and 2
      { name: 'Round 2',       slots: 4, ghosts: []     },
      { name: 'Quarterfinals', slots: 4, ghosts: []     },
      { name: 'Semifinals',    slots: 2, ghosts: []     },
      { name: 'Championship',  slots: 1, ghosts: []     },
    ],
  },
  // 13 Teams (MAAC, CAA)
  DOUBLE_BYE_13: {
    rounds: [
      { name: 'Round 1',       slots: 4, ghosts: [0, 2, 3] }, // Only 1 game played in Rd 1
      { name: 'Round 2',       slots: 4, ghosts: [] },
      { name: 'Quarterfinals', slots: 4, ghosts: [] },
      { name: 'Semifinals',    slots: 2, ghosts: [] },
      { name: 'Championship',  slots: 1, ghosts: [] },
    ],
  },
  // 12 Teams (MWC)
  SINGLE_BYE_12: {
    rounds: [
      { name: 'Round 1',       slots: 4, ghosts: [] },
      { name: 'Quarterfinals', slots: 4, ghosts: [] },
      { name: 'Semifinals',    slots: 2, ghosts: [] },
      { name: 'Championship',  slots: 1, ghosts: [] },
    ],
  },
  // UNIQUE 12 Teams (SWAC)
  DOUBLE_BYE_12: {
    rounds: [
      { name: 'Round 1',       slots: 4, ghosts: [1, 2] },
      { name: 'Round 2',       slots: 4, ghosts: [1, 2] },    // 2 Games
      { name: 'Quarterfinals', slots: 4, ghosts: [] },
      { name: 'Semifinals',    slots: 2, ghosts: [] },        // 2 Games
      { name: 'Championship',  slots: 1, ghosts: [] },        // 1 Game
    ],
  },
  // 11 Teams (Big East, Mountain West, Horizon)
  SINGLE_BYE_11: {
    rounds: [
      { name: 'Round 1',       slots: 4, ghosts: [1] }, // Pushes the 3 games to the bottom slots
      { name: 'Quarterfinals', slots: 4, ghosts: []  },
      { name: 'Semifinals',    slots: 2, ghosts: []  },
      { name: 'Championship',  slots: 1, ghosts: []  },
    ],
  },
  // 10 Teams (Big Sky, CUSA, SoCon, Patriot)
  SINGLE_BYE_10: {
    rounds: [
      { name: 'Round 1',       slots: 4, ghosts: [1, 2] }, // Centers the 2 games
      { name: 'Quarterfinals', slots: 4, ghosts: []     },
      { name: 'Semifinals',    slots: 2, ghosts: []     },
      { name: 'Championship',  slots: 1, ghosts: []     },
    ],
  },
  // 9 Teams (Big South)
  SINGLE_BYE_9: {
    rounds: [
      { name: 'Round 1',       slots: 4, ghosts: [1, 2, 3] }, // 1 game played at the bottom
      { name: 'Quarterfinals', slots: 4, ghosts: [] },
      { name: 'Semifinals',    slots: 2, ghosts: [] },
      { name: 'Championship',  slots: 1, ghosts: [] },
    ],
  },
  // Single Bye 7 Teams (MEAC)
  SINGLE_BYE_7: {
    rounds: [
      { name: 'Round 1',       slots: 4, ghosts: [1] },
      { name: 'Semifinals',    slots: 2, ghosts: [] },        // 2 Games
      { name: 'Championship',  slots: 1, ghosts: [] },        // 1 Game
    ],
  },
  // 8 Teams (MAC, Big West, Summit, ASUN, MEAC, SWAC, WAC, America East, NEC)
  ELITE_8: {
    rounds: [
      { name: 'Quarterfinals', slots: 4, ghosts: [] },
      { name: 'Semifinals',    slots: 2, ghosts: [] },
      { name: 'Championship',  slots: 1, ghosts: [] },
    ],
  },
  // Unique 8 Teams (OVC, Southland, Big West)
  DOUBLE_BYE_8: {
    rounds: [
      { name: 'Round 1',       slots: 4, ghosts: [1, 2] },
      { name: 'Round 2',       slots: 4, ghosts: [1, 2] },    // 2 Games
      { name: 'Semifinals',    slots: 2, ghosts: [] },        // 2 Games
      { name: 'Championship',  slots: 1, ghosts: [] },        // 1 Game
    ],
  },
  // Unique 7 Teams (WAC)
  DOUBLE_BYE_7: {
    rounds: [
      { name: 'Round 1',       slots: 4, ghosts: [0, 1, 2] },
      { name: 'Round 2',       slots: 4, ghosts: [1, 2] },    // 2 Games
      { name: 'Semifinals',    slots: 2, ghosts: [] },        // 2 Games
      { name: 'Championship',  slots: 1, ghosts: [] },        // 1 Game
    ],
  },
  // 4 Teams (Ivy League)
  FINAL_4: {
    rounds: [
      { name: 'Semifinals',    slots: 2, ghosts: [] },
      { name: 'Championship',  slots: 1, ghosts: [] },
    ],
  },
  // The Stepladder (WCC)
  STEPLADDER_WCC: {
    rounds: [
      { name: 'Round 1',       slots: 4, ghosts: [1, 2] },
      { name: 'Round 2',       slots: 4, ghosts: [1, 2] },    // 2 Games
      { name: 'Round 3',       slots: 4, ghosts: [1, 2] },    // 2 Games
      { name: 'Round 4',       slots: 4, ghosts: [1, 2] },    // 2 Games
      { name: 'Semifinals',    slots: 2, ghosts: [] },        // 2 Games
      { name: 'Championship',  slots: 1, ghosts: [] },        // 1 Game
    ],
  },
  // The Death Stepladder (Sun Belt)
  STEPLADDER_SBELT: {
    rounds: [
      { name: 'Round 1',       slots: 4, ghosts: [1, 2] },
      { name: 'Round 2',       slots: 4, ghosts: [1, 2] },    // 2 Games
      { name: 'Round 3',       slots: 4, ghosts: [1, 2] },    // 2 Games
      { name: 'Round 4',       slots: 4, ghosts: [1, 2] },    // 2 Games
      { name: 'Round 5',       slots: 4, ghosts: [1, 2] },    // 2 Games
      { name: 'Semifinals',    slots: 2, ghosts: [] },        // 2 Games
      { name: 'Championship',  slots: 1, ghosts: [] },        // 1 Game
    ],
  },
  // Awkward Stepladder (American)
  STEPLADDER_AMER: {
    rounds: [
      { name: 'Round 1',       slots: 4, ghosts: [1, 2] },
      { name: 'Round 2',       slots: 4, ghosts: [1, 2] },    // 2 Games
      { name: 'Round 3',       slots: 4, ghosts: [1, 2] },    // 2 Games
      { name: 'Semifinals',    slots: 2, ghosts: [] },        // 2 Games
      { name: 'Championship',  slots: 1, ghosts: [] },        // 1 Game
    ],
  },
  // Absurd 11 (Horizon)
  HORIZON: {
    rounds: [
      { name: 'Round 1',       slots: 5, ghosts: [1, 2, 3, 4] },
      { name: 'Round 2',       slots: 5, ghosts: [] },    
      { name: 'Round 3',       slots: 4, ghosts: [0, 2, 3] },    // 2 Games
      { name: 'Semifinals',    slots: 2, ghosts: [] },        // 2 Games
      { name: 'Championship',  slots: 1, ghosts: [] },        // 1 Game
    ],
  },
};

// =============================================================================
// CONFERENCE DEFINITIONS (ALL 31 DIVISION I CONFERENCES)
// =============================================================================
const CONFERENCES = [
  // === MAJOR CONFERENCES (Dates: 20260309-20260316) ===
  { id: '2',  name: 'ACC',           config: 'DOUBLE_BYE_15',  dateRange: '20260309-20260316' },
  { id: '4',  name: 'Big East',      config: 'SINGLE_BYE_11',  dateRange: '20260309-20260316' },
  { id: '7',  name: 'Big Ten',       config: 'TRIPLE_BYE_18',  dateRange: '20260309-20260316' },
  { id: '8',  name: 'Big 12',        config: 'DOUBLE_BYE_16',  dateRange: '20260309-20260316' },
  { id: '23', name: 'SEC',           config: 'DOUBLE_BYE_16',  dateRange: '20260309-20260316' },

  // === MULTI-BYE FORMATS (13-14 Teams) ===
  { id: '3',  name: 'A-10',          config: 'DOUBLE_BYE_14',  dateRange: '20260309-20260316' },
  { id: '10', name: 'CAA',           config: 'DOUBLE_BYE_13',  dateRange: '20260304-20260316' },
  { id: '62', name: 'American',      config: 'STEPLADDER_AMER',  dateRange: '20260309-20260316' },

  // === SINGLE BYE FORMATS (9-12 Teams) ===
  { id: '13', name: 'MAAC',          config: 'SINGLE_BYE_10',  dateRange: '20260304-20260316' }, 
  { id: '5',  name: 'Big Sky',       config: 'SINGLE_BYE_10',  dateRange: '20260304-20260316' },
  { id: '6',  name: 'Big South',     config: 'SINGLE_BYE_9',   dateRange: '20260304-20260316' },
  { id: '11', name: 'CUSA',          config: 'SINGLE_BYE_10',  dateRange: '20260309-20260316' },
  { id: '18', name: 'MVC',           config: 'SINGLE_BYE_11',  dateRange: '20260304-20260316' },
  { id: '22', name: 'Patriot',       config: 'SINGLE_BYE_10',  dateRange: '20260303-20260316' },
  { id: '24', name: 'SoCon',         config: 'SINGLE_BYE_10',  dateRange: '20260304-20260316' },
  { id: '44', name: 'Mountain West', config: 'SINGLE_BYE_12',  dateRange: '20260309-20260316' },
  { id: '45', name: 'Horizon',       config: 'HORIZON',        dateRange: '20260302-20260316' },
  { id: '46', name: 'ASUN',          config: 'SINGLE_BYE_12',  dateRange: '20260304-20260316' },
  { id: '49', name: 'Summit',        config: 'SINGLE_BYE_9',   dateRange: '20260304-20260316' },

  // === STRICT ELITE 8 FORMATS (8 Teams Qualify) ===
  { id: '1',  name: 'America East',  config: 'ELITE_8',        dateRange: '20260304-20260316' },
  { id: '9',  name: 'Big West',      config: 'DOUBLE_BYE_8',   dateRange: '20260309-20260316' },
  { id: '14', name: 'MAC',           config: 'ELITE_8',        dateRange: '20260312-20260316' },
  { id: '16', name: 'MEAC',          config: 'SINGLE_BYE_7',   dateRange: '20260311-20260316' },
  { id: '19', name: 'NEC',           config: 'ELITE_8',        dateRange: '20260304-20260316' },
  { id: '26', name: 'SWAC',          config: 'DOUBLE_BYE_12',  dateRange: '20260309-20260316' },
  { id: '30', name: 'WAC',           config: 'DOUBLE_BYE_7',   dateRange: '20260309-20260316' },

  // === FINAL 4 FORMAT (4 Teams Qualify) ===
  { id: '12', name: 'Ivy League',    config: 'FINAL_4',        dateRange: '20260314-20260316' },

  // === STEPLADDER FORMATS ===
  { id: '20', name: 'OVC',           config: 'DOUBLE_BYE_8', dateRange: '20260304-20260316' },
  { id: '25', name: 'Southland',     config: 'DOUBLE_BYE_8', dateRange: '20260304-20260316' },
  { id: '29', name: 'WCC',           config: 'STEPLADDER_WCC', dateRange: '20260304-20260316' },
  { id: '27', name: 'Sun Belt',      config: 'STEPLADDER_SBELT',  dateRange: '20260303-20260316' },
];


// =============================================================================
// DATA TRANSFORMATION
// =============================================================================
const formatGameTime = (dateString) => {
  if (!dateString) return "TBD";
  const date = new Date(dateString);
  
  // Format as "Mar 10, 2:00 PM"
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
};

// Add any conference IDs here that shuffle their brackets after early rounds!
const RESEEDING_CONFERENCES = ['1']; // '1' is America East

const getBracketOrder = (game, isReseeder = false) => {
  // Safely extract seeds (treat missing seeds as 99)
  const s1 = parseInt(game.teams?.[0]?.seed) || 99;
  const s2 = parseInt(game.teams?.[1]?.seed) || 99;

  // Find the "favored" team (lowest numerical seed) anchoring this game
  const bestSeed = Math.min(s1, s2);

  // If both teams are TBD (99), send to the bottom of the pile
  if (bestSeed === 99) return 99;

  // 🚨 THE RESEEDER INTERCEPTOR 🚨
  // If this conference re-seeds, we throw the static NCAA paths out the window.
  // The highest remaining seed is the new king and MUST go to the top slot.
  if (isReseeder) {
    return bestSeed; // e.g., A 3-seed returns 3, beating a 4-seed (4) for the top slot!
  }

  // THE MASTER STATIC BRACKET PATHS
  const verticalOrder = {
    1: 1,  16: 1,  // Top-most path (feeds #1)
    8: 2,  9: 2,   // Second path down (feeds #8)
    5: 3,  12: 3,  // Third path down (feeds #5)
    4: 4,  13: 4,  // Fourth path down (feeds #4)
    6: 5,  11: 5,  // Fifth path down (feeds #6)
    3: 6,  14: 6,  // Sixth path down (feeds #3)
    7: 7,  10: 7,  // Seventh path down (feeds #7)
    2: 8,  15: 8   // Bottom-most path (feeds #2)
  };

  return verticalOrder[bestSeed] || 99;
};

const buildBracketRounds = (games, conferenceId) => {
  if (!games || games.length === 0) return [];

  const conf = CONFERENCES.find(c => c.id === conferenceId);
  if (!conf) return [];

  const config = BRACKET_CONFIGS[conf.config];
  if (!config) return [];

  // 🚨 Determine if this specific conference requires the Reseeder Interceptor
  const isReseeder = RESEEDING_CONFERENCES.includes(conferenceId);

  const sortedGames = [...games].sort((a, b) => new Date(a.date) - new Date(b.date));
  let gamePointer = 0;

  return config.rounds.map((roundConfig) => {
    const { name: roundName, slots, ghosts } = roundConfig;
    const expectedGames = slots - ghosts.length;
    
    const gamesForRound = sortedGames.slice(gamePointer, gamePointer + expectedGames);
    gamePointer += expectedGames;

    // VISUAL FIX: Sort games using the interceptor flag!
    gamesForRound.sort((a, b) => getBracketOrder(a, isReseeder) - getBracketOrder(b, isReseeder));


    const displaySlots = [];
    let roundGamePointer = 0;

    for (let i = 0; i < slots; i++) {
      if (ghosts.includes(i)) {
        displaySlots.push({
          isGhost: true,
          id: `ghost-${conferenceId}-${roundName}-${i}`,
        });
      } else {
        const rawGame = gamesForRound[roundGamePointer];
        displaySlots.push(
          rawGame
            ? {
                id: rawGame.id,
                status: rawGame.status,
                network: rawGame.network,
                isLive: rawGame.is_live,
                topTeam: rawGame.teams[0] || { name: 'TBD', seed: '-', score: '0', winner: false },
                bottomTeam: rawGame.teams[1] || { name: 'TBD', seed: '-', score: '0', winner: false },
              }
            : {
                isGhost: true,
                id: `missing-${conferenceId}-${roundName}-${i}`,
              }
        );
        roundGamePointer++;
      }
    }

    return { roundName, slots: displaySlots };
  });
};

// =============================================================================
// COMPONENTS
// =============================================================================
const TeamRow = ({ team, isGhost }) => {
  if (isGhost) {
    return <div className="px-4 py-3 h-10 md:h-12 w-full" />;
  }

  const isTBD = team.name === 'TBD' || team.name === 'Unknown';

  return (
    // Winners get a lighter gray background (slate-700) with bold white text.
    // Standard teams get a darker background (slate-800) with off-white text.
    <div className={`flex justify-between items-center px-4 py-3 h-10 md:h-12 transition-colors ${
      team.winner ? 'bg-slate-700 font-bold text-white' : 'bg-slate-800 text-slate-200'
    }`}>
      <div className="flex items-center space-x-3 overflow-hidden">
        
        {/* NEW SEED BADGE */}
        {(!isTBD && team.seed !== '-') ? (
          <span className="text-[10px] font-bold text-slate-400 bg-slate-900 rounded px-1.5 py-0.5 min-w-[20px] flex items-center justify-center shrink-0 shadow-inner">
            {team.seed}
          </span>
        ) : (
          <span className="w-5 shrink-0" /> // Keeps spacing aligned if there is no seed
        )}

        <span className={`text-sm md:text-base truncate ${isTBD ? 'italic text-slate-500 font-normal' : ''}`}>
          {team.name}
        </span>
      </div>
      
      <span className="text-sm md:text-base ml-2 shrink-0">
        {!isTBD && team.score !== '0' ? team.score : ''}
      </span>
    </div>
  );
};

const Matchup = ({ game }) => {
  if (game.isGhost) {
    return (
      <div className="relative flex items-center w-full my-2">
        <div className="border border-transparent flex flex-col w-full shrink-0 relative z-10">
          <div className="h-6" /> 
          <TeamRow isGhost />
          <div className="h-px w-full" />
          <TeamRow isGhost />
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex items-center w-full my-2">
      {/* Changed card border and background for dark mode */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-md overflow-hidden flex flex-col w-full shrink-0 relative z-10">
        
        {/* --- LIVE HEADER BOX --- */}
        <div className="bg-slate-900/60 px-3 py-1 text-[10px] uppercase tracking-wider font-bold border-b border-slate-700 h-6 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {game.isLive && (
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
            )}
            {/* Shifted red to 500 and slate to 400 for better dark contrast */}
            <span className={game.isLive ? 'text-red-500' : 'text-slate-400'}>
              {/* If game is scheduled but hasn't started, show the time. Otherwise, show status (like "Halftime" or "Final") */}
              {(game.status === 'Scheduled' || game.status === 'TBD') && game.date
                ? formatGameTime(game.date) 
                : game.status}
            </span>
          </div>

          
          {/* Shifted blue to 400 so it glows against the dark background */}
          {game.network && (
            <span className="text-blue-400 truncate max-w-[80px] text-right">
              {game.network}
            </span>
          )}
        </div>

        <TeamRow team={game.topTeam} />
        {/* Darkened the divider line */}
        <div className="h-px w-full bg-slate-700" />
        <TeamRow team={game.bottomTeam} />
      </div>
    </div>
  );
};


const ChampionCard = ({ team }) => {
  if (!team) return null;

  return (
    <div className="flex-none w-[85vw] md:w-72 snap-center flex flex-col justify-center relative pl-4 md:pl-8">
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-yellow-500/50 rounded-xl shadow-[0_0_30px_rgba(234,179,8,0.15)] overflow-hidden flex flex-col w-full relative z-10 animate-fade-in-up">
        
        {/* Gold Header */}
        <div className="bg-yellow-500/10 px-4 py-3 text-center border-b border-yellow-500/20">
          <h3 className="text-yellow-500 font-black tracking-widest uppercase text-xs md:text-sm">
            🏆 Tournament Champion
          </h3>
        </div>
        
        {/* Team Details */}
        <div className="p-6 md:p-8 flex flex-col items-center justify-center space-y-2 text-center">
          <span className="text-2xl md:text-3xl font-black text-white tracking-tight">
            {team.name}
          </span>
          {team.seed !== '-' && (
            <span className="text-slate-400 font-bold text-sm uppercase tracking-wider">
              {team.seed} Seed
            </span>
          )}
        </div>
        
      </div>
    </div>
  );
};

const TournamentBracket = ({ roundsData }) => {
  if (roundsData.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        {/* Dark empty state box */}
        <p className="text-slate-400 font-medium bg-slate-800 px-6 py-4 rounded-lg border border-slate-700 shadow-sm">
          No games scheduled for this conference.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-x-auto no-scrollbar snap-x snap-mandatory flex py-8 px-4 space-x-8">
      {roundsData.map((round, roundIndex) => (
        <div key={roundIndex} className="flex-none w-[85vw] md:w-72 snap-center flex flex-col relative">
          <div className="mb-6 text-center shrink-0">
            {/* Darkened round headers */}
            <h2 className="text-sm font-black text-slate-300 uppercase tracking-widest bg-slate-800 border border-slate-700 py-2 rounded-md">
              {round.roundName}
            </h2>
          </div>

          <div className="flex-1 flex flex-col justify-around relative">
            {round.slots.map((game) => (
              <Matchup key={game.id} game={game} />
            ))}
          </div>
        </div>
      ))}
      <div className="flex-none w-8" />
    </div>
  );
};

// =============================================================================
// MAIN APP
// =============================================================================
export default function App() {
  const [activeTab, setActiveTab] = useState(CONFERENCES[0]);
  const [bracketData, setBracketData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTournamentData = async (isBackground = false) => {
      if (!isBackground) {
        setLoading(true);
        setError(null);
      }
      
      try {
        const response = await fetch(
          `http://localhost:8000/api/bracket/${activeTab.id}?date=${activeTab.dateRange}`
        );
        if (!response.ok) throw new Error(`API returned ${response.status}`);
        const data = await response.json();
        
        const rounds = buildBracketRounds(data.games, activeTab.id);
        setBracketData(rounds);
      } catch (err) {
        console.error('Error fetching from Python API:', err);
        if (!isBackground) {
          setError('Could not load tournament data. Is the API server running?');
          setBracketData([]);
        }
      } finally {
        if (!isBackground) {
          setLoading(false);
        }
      }
    };

    fetchTournamentData(false);

    const intervalId = setInterval(() => {
      fetchTournamentData(true);
    }, 30000);

    return () => clearInterval(intervalId);
  }, [activeTab]);

  return (
    // Changed the master background to slate-900
    <div className="min-h-screen bg-slate-900 flex flex-col font-sans h-screen text-slate-200">
      {/* Header bar darkened to slate-950 with a subtle bottom border */}
      <header className="bg-slate-950 text-white px-0 pt-4 pb-2 shadow-md z-10 shrink-0 border-b border-slate-800">
        <h1 className="text-xl font-black tracking-tight mb-4 px-6">CHAMP WEEK CENTRAL</h1>

        <div className="flex space-x-6 overflow-x-auto no-scrollbar px-6 mb-2">
          {CONFERENCES.map((conf) => (
            <button
              key={conf.id}
              onClick={() => setActiveTab(conf)}
              className={`pb-2 text-sm font-bold whitespace-nowrap transition-colors ${
                activeTab.id === conf.id
                  ? 'text-blue-400 border-b-2 border-blue-400'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {conf.name}
            </button>
          ))}
        </div>
      </header>

      {loading ? (
        <div className="flex-1 flex justify-center items-center">
          {/* Lightened the loading text for contrast */}
          <p className="text-slate-400 font-bold animate-pulse">Loading Tournament Data...</p>
        </div>
      ) : error ? (
        <div className="flex-1 flex justify-center items-center">
          {/* Darkened the error box */}
          <p className="text-red-400 font-medium bg-slate-800 px-6 py-4 rounded-lg border border-red-900/50 shadow-sm">
            {error}
          </p>
        </div>
      ) : (
        <TournamentBracket roundsData={bracketData} />
      )}
    </div>
  );
}