import React, { useState, useEffect } from 'react';

// --- CONFIGURATION ---
const CONFERENCES = [
  { id: '2', name: 'ACC' },
  { id: '4', name: 'Big East' },
  { id: '5', name: 'Big Ten' },
  { id: '21', name: 'SEC' }
];

// --- THE SECRET SAUCE: BRACKET LAYOUT MAPS ---
// We explicitly tell React which slots the games belong in for irregular rounds.
const BRACKET_LAYOUTS = {
  '4': { // Big East (11 teams)
    'Round 1': [0, 2, 3] // Game 1 -> Slot 0, Ghost -> Slot 1, Game 2 -> Slot 2, Game 3 -> Slot 3
  },
  '2': { // ACC (15 teams)
    'Round 1': [1, 2, 3], // The 1st slot is a Ghost, games go in slots 1, 2, 3
    'Round 2': [0, 1, 2, 3] // Round 2 has all 4 games, so no ghosts needed
  }
};

// --- HELPER FUNCTION: DATA TRANSFORMATION ---
const groupGamesIntoRounds = (games, conferenceId) => {
  if (!games || games.length === 0) return [];

  const groupedByDate = {};
  
  games.forEach(game => {
    const dateObj = new Date(game.date);
    const dateKey = dateObj.toLocaleDateString();

    if (!groupedByDate[dateKey]) {
      groupedByDate[dateKey] = [];
    }
    
    groupedByDate[dateKey].push({
      id: game.id,
      status: game.status,
      topTeam: game.teams[0] || { name: "TBD", seed: "-", score: "0", winner: false },
      bottomTeam: game.teams[1] || { name: "TBD", seed: "-", score: "0", winner: false }
    });
  });

  const sortedDates = Object.keys(groupedByDate).sort((a, b) => new Date(a) - new Date(b));
  const rounds = [];

  sortedDates.forEach((date, index) => {
    const gamesRemaining = sortedDates.length - index - 1;
    
    let roundName = `Round ${index + 1}`;
    if (gamesRemaining === 0) roundName = "Championship";
    if (gamesRemaining === 1) roundName = "Semifinals";
    if (gamesRemaining === 2) roundName = "Quarterfinals";

    let matchups = groupedByDate[date];
    const layoutMap = BRACKET_LAYOUTS[conferenceId]?.[roundName];

    // INJECT GHOST MATCHES: If a layout map exists for this round, build a padded array
    if (layoutMap) {
      const targetLength = layoutMap[layoutMap.length - 1] + 1; // Find the highest slot index
      const paddedMatchups = new Array(targetLength).fill({ isGhost: true, id: `ghost-${Math.random()}` });
      
      matchups.forEach((game, i) => {
        const slotIndex = layoutMap[i];
        if (slotIndex !== undefined) {
          paddedMatchups[slotIndex] = game;
        }
      });
      matchups = paddedMatchups;
    }

    rounds.push({
      roundName: roundName,
      matchups: matchups
    });
  });

  return rounds;
};

// --- SUB-COMPONENTS ---
const TeamRow = ({ team, isGhost }) => {
  if (isGhost) {
    return <div className="px-4 py-3 h-10 md:h-12 w-full"></div>; // Exact height of a real row, but empty
  }
  return (
    <div className={`flex justify-between items-center px-4 py-3 h-10 md:h-12 ${team.winner ? 'bg-blue-50 font-bold text-slate-900' : 'bg-white text-slate-600'}`}>
      <div className="flex items-center space-x-3">
        <span className="text-xs text-slate-400 w-4 text-right">{team.seed !== "-" ? team.seed : ""}</span>
        <span className="text-sm md:text-base truncate">{team.name}</span>
      </div>
      <span className="text-sm md:text-base font-medium">{team.score !== "0" ? team.score : '-'}</span>
    </div>
  );
};

const Matchup = ({ game, index, isLastRound }) => {
  const isTop = index % 2 === 0;

  // IF IT IS A GHOST MATCH, RENDER AN INVISIBLE BOX
  if (game.isGhost) {
    return (
      <div className="relative flex items-center w-full my-2">
        <div className="border border-transparent flex flex-col w-full shrink-0 relative z-10">
          <div className="py-1 text-[10px] h-6"></div> {/* Invisible Header */}
          <TeamRow isGhost={true} />
          <div className="h-px w-full bg-transparent"></div> {/* Invisible Divider */}
          <TeamRow isGhost={true} />
        </div>
        {/* Notice we DO NOT draw connecting lines for Ghost matches! */}
      </div>
    );
  }

  // IF IT IS A REAL MATCH, RENDER NORMALLY
  return (
    <div className="relative flex items-center w-full my-2">
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden flex flex-col w-full shrink-0 relative z-10">
        <div className="bg-slate-50 px-3 py-1 text-[10px] uppercase tracking-wider text-slate-500 font-bold border-b border-slate-200 flex justify-between h-6">
          <span>{game.status}</span>
        </div>
        <TeamRow team={game.topTeam} />
        <div className="h-px w-full bg-slate-200"></div>
        <TeamRow team={game.bottomTeam} />
      </div>

      {!isLastRound && (
        <div 
          className={`absolute -right-8 w-8 border-slate-300 border-r-2 z-0
            ${isTop ? 'border-t-2 top-1/2 h-[calc(50%+1rem)]' : 'border-b-2 bottom-1/2 h-[calc(50%+1rem)]'}
          `}
        ></div>
      )}
      
      {!isLastRound && (
        <div className="absolute -right-8 w-8 top-1/2 border-t-2 border-slate-300 z-0"></div>
      )}
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
      {roundsData.map((round, roundIndex) => {
        const isLastRound = roundIndex === roundsData.length - 1;

        return (
          <div key={roundIndex} className="flex-none w-[85vw] md:w-72 snap-center flex flex-col relative">
            <div className="mb-6 text-center shrink-0">
              <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest bg-slate-200 py-2 rounded-md">
                {round.roundName}
              </h2>
            </div>

            <div className="flex-1 flex flex-col justify-around relative">
              {round.matchups.map((game, gameIndex) => (
                <Matchup 
                  key={game.id} 
                  game={game} 
                  index={gameIndex} 
                  isLastRound={isLastRound} 
                />
              ))}
            </div>
          </div>
        );
      })}
      <div className="flex-none w-8"></div>
    </div>
  );
};

// --- MAIN APP ---
export default function App() {
  const [activeTab, setActiveTab] = useState(CONFERENCES[1]); // Default Big East
  const [bracketData, setBracketData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTournamentData = async () => {
      setLoading(true);
      try {
        const response = await fetch(`http://localhost:8000/api/bracket/${activeTab.id}?date=20240312-20240317`);
        const data = await response.json();
        
        // Notice we now pass the activeTab.id into the grouping function so it knows which layout map to use!
        const groupedRounds = groupGamesIntoRounds(data.games, activeTab.id);
        setBracketData(groupedRounds);
      } catch (error) {
        console.error("Error fetching from Python API:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTournamentData();
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
      ) : (
        <TournamentBracket roundsData={bracketData} />
      )}
    </div>
  );
}