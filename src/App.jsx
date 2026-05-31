import React, { useState, useEffect } from 'react';

// =============================================================================
// BRACKET STRUCTURE CONFIGS
// =============================================================================
const BRACKET_CONFIGS = {
  ACC: {
    rounds: [
      { name: 'Round 1',       slots: 4, ghosts: [2] },
      { name: 'Round 2',       slots: 4, ghosts: []  },
      { name: 'Quarterfinals', slots: 4, ghosts: []  },
      { name: 'Semifinals',    slots: 2, ghosts: []  },
      { name: 'Championship',  slots: 1, ghosts: []  },
    ],
  },
  A10: {
    rounds: [
      { name: 'Round 1',       slots: 4, ghosts: [0, 3] },
      { name: 'Round 2',       slots: 4, ghosts: []  },
      { name: 'Quarterfinals', slots: 4, ghosts: []  },
      { name: 'Semifinals',    slots: 2, ghosts: []  },
      { name: 'Championship',  slots: 1, ghosts: []  },
    ],
  },
  SEC_BIG12: {
    rounds: [
      { name: 'Round 1',       slots: 4, ghosts: [] },
      { name: 'Round 2',       slots: 4, ghosts: [] },
      { name: 'Quarterfinals', slots: 4, ghosts: [] },
      { name: 'Semifinals',    slots: 2, ghosts: [] },
      { name: 'Championship',  slots: 1, ghosts: [] },
    ],
  },
  BIG_EAST: {
    rounds: [
      { name: 'Round 1',      slots: 4, ghosts: [1] },
      { name: 'Quarterfinals', slots: 4, ghosts: []  },
      { name: 'Semifinals',    slots: 2, ghosts: []  },
      { name: 'Championship',  slots: 1, ghosts: []  },
    ],
  },
  BIG_TEN: {
    rounds: [
      { name: 'Round 1',       slots: 4, ghosts: [0, 3] },
      { name: 'Round 2',       slots: 4, ghosts: []     },
      { name: 'Round 3',       slots: 4, ghosts: []     },
      { name: 'Quarterfinals', slots: 4, ghosts: []     },
      { name: 'Semifinals',    slots: 2, ghosts: []     },
      { name: 'Championship',  slots: 1, ghosts: []     },
    ],
  },
  GENERIC_4: {
    rounds: [
      { name: 'Quarterfinals', slots: 4, ghosts: [] },
      { name: 'Semifinals',    slots: 2, ghosts: [] },
      { name: 'Championship',  slots: 1, ghosts: [] },
    ],
  },
};

// =============================================================================
// CONFERENCE DEFINITIONS
// =============================================================================
const CONFERENCES = [
  { id: '2',  name: 'ACC',      config: 'ACC',       dateRange: '20260310-20260314' }, 
  { id: '4',  name: 'Big East', config: 'BIG_EAST',  dateRange: '20260311-20260314' }, 
  { id: '7',  name: 'Big Ten',  config: 'BIG_TEN',   dateRange: '20260310-20260315' },
  { id: '8',  name: 'Big 12',   config: 'SEC_BIG12', dateRange: '20260310-20260314' },
  { id: '3',  name: 'A10',      config: 'A10',       dateRange: '20260311-20260315' },
  { id: '23', name: 'SEC',      config: 'SEC_BIG12', dateRange: '20260311-20260315' },
];

// =============================================================================
// DATA TRANSFORMATION
// =============================================================================
const buildBracketRounds = (games, conferenceId) => {
  if (!games || games.length === 0) return [];

  const conf = CONFERENCES.find(c => c.id === conferenceId);
  if (!conf) return [];

  const config = BRACKET_CONFIGS[conf.config];
  if (!config) return [];

  const sortedGames = [...games].sort((a, b) => new Date(a.date) - new Date(b.date));
  
  let gamePointer = 0;

  return config.rounds.map((roundConfig) => {
    const { name: roundName, slots, ghosts } = roundConfig;
    const expectedGames = slots - ghosts.length;
    
    const gamesForRound = sortedGames.slice(gamePointer, gamePointer + expectedGames);
    gamePointer += expectedGames;

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
                isLive: rawGame.is_live, // <-- Grab the live boolean from Python
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
    <div className={`flex justify-between items-center px-4 py-3 h-10 md:h-12 transition-colors ${
      team.winner ? 'bg-blue-50 font-bold text-slate-900' : 'bg-white text-slate-600'
    }`}>
      <div className="flex items-center space-x-3 overflow-hidden">
        <span className="text-xs text-slate-400 w-4 text-right shrink-0">
          {!isTBD && team.seed !== '-' ? team.seed : ''}
        </span>
        <span className={`text-sm md:text-base truncate ${isTBD ? 'italic text-slate-400 font-normal' : ''}`}>
          {team.name}
        </span>
      </div>
      <span className="text-sm md:text-base font-medium ml-2 shrink-0">
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
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden flex flex-col w-full shrink-0 relative z-10">
        
        {/* --- LIVE HEADER BOX --- */}
        <div className="bg-slate-50 px-3 py-1 text-[10px] uppercase tracking-wider font-bold border-b border-slate-200 h-6 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {/* The Pulsing Red Dot for Live Games */}
            {game.isLive && (
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
            )}
            <span className={game.isLive ? 'text-red-600' : 'text-slate-500'}>
              {game.status}
            </span>
          </div>

          {game.network && (
            <span className="text-blue-600 truncate max-w-[80px] text-right">
              {game.network}
            </span>
          )}
        </div>

        <TeamRow team={game.topTeam} />
        <div className="h-px w-full bg-slate-200" />
        <TeamRow team={game.bottomTeam} />
      </div>
    </div>
  );
};

const TournamentBracket = ({ roundsData }) => {
  if (roundsData.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-slate-500 font-medium bg-white px-6 py-4 rounded-lg border border-slate-200 shadow-sm">
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
            <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest bg-slate-200 py-2 rounded-md">
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
    // --- THE SILENT POLLING LOGIC ---
    const fetchTournamentData = async (isBackground = false) => {
      // Only show the loading spinner if this is an active tab click
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
        // Only show the fatal error state if it wasn't a background ping
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

    // 1. Initial fetch on tab change
    fetchTournamentData(false);

    // 2. Set up the polling interval (every 30 seconds)
    const intervalId = setInterval(() => {
      fetchTournamentData(true);
    }, 30000);

    // 3. Cleanup on unmount or tab change
    return () => clearInterval(intervalId);
  }, [activeTab]);

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans h-screen">
      <header className="bg-slate-900 text-white px-0 pt-4 pb-2 shadow-md z-10 shrink-0">
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
          <p className="text-slate-500 font-bold animate-pulse">Loading Tournament Data...</p>
        </div>
      ) : error ? (
        <div className="flex-1 flex justify-center items-center">
          <p className="text-red-500 font-medium bg-white px-6 py-4 rounded-lg border border-red-200 shadow-sm">
            {error}
          </p>
        </div>
      ) : (
        <TournamentBracket roundsData={bracketData} />
      )}
    </div>
  );
}