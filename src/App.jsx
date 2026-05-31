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
        {/* Force font-normal on the seed so it doesn't inherit the winner's bold weight */}
        <span className="text-xs text-slate-500 w-4 text-right shrink-0 font-normal">
          {!isTBD && team.seed !== '-' ? team.seed : ''}
        </span>
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
              {game.status}
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