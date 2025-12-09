import { useState, useEffect, useCallback, useRef } from "react";
import {
  fetchStandings,
  fetchFixtures,
  fetchRounds,
} from "../services/footballApi";
import {
  Calculator,
  RotateCcw,
  TrendingUp,
  TrendingDown,
  Loader2,
  Calendar,
  Zap,
  Home,
  Plane,
  Minus,
  Save,
  Trash2,
  Share2,
  Download,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Target,
  Trophy,
  AlertTriangle,
  Check,
  X,
  Copy,
  Layers,
  ChevronRight,
} from "lucide-react";
import html2canvas from "html2canvas";

// ========== HELPER FUNCTIONS ==========

const getOrdinalSuffix = (num) => {
  const j = num % 10;
  const k = num % 100;
  if (j === 1 && k !== 11) return num + "st";
  if (j === 2 && k !== 12) return num + "nd";
  if (j === 3 && k !== 13) return num + "rd";
  return num + "th";
};

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
};

// const formatTime = (dateString) => {
//   const date = new Date(dateString);
//   return date.toLocaleTimeString("en-US", {
//     hour: "2-digit",
//     minute: "2-digit",
//   });
// };

// const calculateDifficultyRating = (homePosition, awayPosition, standings) => {
//   // Returns difficulty from home team's perspective
//   // Lower = easier for home team, Higher = harder for home team
//   const homeStrength = 21 - homePosition; // 1st = 20, 20th = 1
//   const awayStrength = 21 - awayPosition;

//   // Home advantage worth ~3 positions
//   const adjustedHomeStrength = homeStrength + 3;

//   // Difficulty for home team (how hard is it for them to win)
//   const difficulty = awayStrength - adjustedHomeStrength + 10; // Normalize to ~0-20 range

//   return Math.max(1, Math.min(10, difficulty / 2)); // Scale to 1-10
// };

const predictResult = (homePosition, awayPosition) => {
  // Auto-predict based on positions
  const homeDiff = awayPosition - homePosition;

  if (homeDiff >= 8) return "home"; // Home team much stronger
  if (homeDiff >= 4) return "home"; // Home team stronger + home advantage
  if (homeDiff >= -2) return "draw"; // Teams are close
  if (homeDiff >= -6) return "away"; // Away team stronger
  return "away"; // Away team much stronger
};

// ========== COMPONENT ==========

function Simulator({ selectedTeam }) {
  const [predictions, setPredictions] = useState({});
  const [originalStandings, setOriginalStandings] = useState([]);
  const [simulatedTable, setSimulatedTable] = useState([]);
  const [fixtures, setFixtures] = useState([]);
  // const [allFixtures, setAllFixtures] = useState([]);
  const [rounds, setRounds] = useState([]);
  const [selectedRounds, setSelectedRounds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savedScenarios, setSavedScenarios] = useState([]);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [scenarioName, setScenarioName] = useState("");
  const [compareMode, setCompareMode] = useState(false);
  const [compareScenarios, setCompareScenarios] = useState([]);
  const [multiGameweekMode, setMultiGameweekMode] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [expandedRounds, setExpandedRounds] = useState({});
  const shareCardRef = useRef(null);

  // Load saved scenarios from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(`scenarios_${selectedTeam.id}`);
    if (saved) {
      setSavedScenarios(JSON.parse(saved));
    }
  }, [selectedTeam.id]);

  useEffect(() => {
    loadSimulatorData();
  }, []);

  useEffect(() => {
    if (selectedRounds.length > 0) {
      loadFixturesForRounds(selectedRounds);
    }
  }, [selectedRounds]);

  const loadSimulatorData = async () => {
    setLoading(true);

    const [standingsData, roundsData, upcomingFixtures] = await Promise.all([
      fetchStandings(),
      fetchRounds(),
      fetchFixtures(),
    ]);

    setOriginalStandings(standingsData);
    setSimulatedTable(standingsData);
    setRounds(roundsData);
    // setAllFixtures(upcomingFixtures);

    // Auto-select the next round if available
    if (upcomingFixtures.length > 0) {
      const nextRound = upcomingFixtures[0].league.round;
      setSelectedRounds([nextRound]);
      setExpandedRounds({ [nextRound]: true });

      // Filter fixtures for the selected round
      const roundFixtures = upcomingFixtures.filter(
        (f) => f.league.round === nextRound
      );
      setFixtures(roundFixtures);
    }

    setLoading(false);
  };

  const loadFixturesForRounds = async (rounds) => {
    let allRoundFixtures = [];

    for (const round of rounds) {
      const fixturesData = await fetchFixtures(round);
      allRoundFixtures = [...allRoundFixtures, ...fixturesData];
    }

    setFixtures(allRoundFixtures);
  };

  const handleRoundToggle = (round) => {
    setSelectedRounds((prev) => {
      if (prev.includes(round)) {
        return prev.filter((r) => r !== round);
      } else {
        return [...prev, round].sort();
      }
    });

    setExpandedRounds((prev) => ({
      ...prev,
      [round]: !prev[round],
    }));
  };

  const handleResultChange = (fixtureId, result) => {
    const newPredictions = { ...predictions };

    if (newPredictions[fixtureId] === result) {
      // Clicking same result removes it
      delete newPredictions[fixtureId];
    } else {
      newPredictions[fixtureId] = result;
    }

    setPredictions(newPredictions);
    calculateSimulatedTable(newPredictions);
  };

  const calculateSimulatedTable = useCallback(
    (currentPredictions) => {
      // Deep copy of standings
      const newTable = originalStandings.map((team) => ({
        ...team,
        team: { ...team.team },
        points: team.points,
        goalsDiff: team.goalsDiff,
        all: { ...team.all },
        simulatedPoints: 0,
      }));

      // Apply each prediction
      Object.entries(currentPredictions).forEach(([fixtureId, result]) => {
        const fixture = fixtures.find(
          (f) => f.fixture.id === parseInt(fixtureId)
        );
        if (!fixture) return;

        const homeTeamIndex = newTable.findIndex(
          (t) => t.team.id === fixture.teams.home.id
        );
        const awayTeamIndex = newTable.findIndex(
          (t) => t.team.id === fixture.teams.away.id
        );

        if (homeTeamIndex === -1 || awayTeamIndex === -1) return;

        if (result === "home") {
          newTable[homeTeamIndex].points += 3;
          newTable[homeTeamIndex].simulatedPoints += 3;
          newTable[homeTeamIndex].all.win += 1;
          newTable[homeTeamIndex].all.played += 1;
          newTable[awayTeamIndex].all.lose += 1;
          newTable[awayTeamIndex].all.played += 1;
        } else if (result === "away") {
          newTable[awayTeamIndex].points += 3;
          newTable[awayTeamIndex].simulatedPoints += 3;
          newTable[awayTeamIndex].all.win += 1;
          newTable[awayTeamIndex].all.played += 1;
          newTable[homeTeamIndex].all.lose += 1;
          newTable[homeTeamIndex].all.played += 1;
        } else if (result === "draw") {
          newTable[homeTeamIndex].points += 1;
          newTable[awayTeamIndex].points += 1;
          newTable[homeTeamIndex].simulatedPoints += 1;
          newTable[awayTeamIndex].simulatedPoints += 1;
          newTable[homeTeamIndex].all.draw += 1;
          newTable[awayTeamIndex].all.draw += 1;
          newTable[homeTeamIndex].all.played += 1;
          newTable[awayTeamIndex].all.played += 1;
        }
      });

      // Sort by points, then goal difference
      newTable.sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        return b.goalsDiff - a.goalsDiff;
      });

      // Update ranks
      newTable.forEach((team, index) => {
        team.rank = index + 1;
      });

      setSimulatedTable(newTable);
    },
    [fixtures, originalStandings]
  );

  // Quick Fill Functions
  const quickFillAll = (resultType) => {
    const newPredictions = {};
    fixtures.forEach((fixture) => {
      newPredictions[fixture.fixture.id] = resultType;
    });
    setPredictions(newPredictions);
    calculateSimulatedTable(newPredictions);
  };

  const quickFillAuto = () => {
    const newPredictions = {};
    fixtures.forEach((fixture) => {
      const homeTeam = originalStandings.find(
        (t) => t.team.id === fixture.teams.home.id
      );
      const awayTeam = originalStandings.find(
        (t) => t.team.id === fixture.teams.away.id
      );

      if (homeTeam && awayTeam) {
        const homePos = originalStandings.indexOf(homeTeam) + 1;
        const awayPos = originalStandings.indexOf(awayTeam) + 1;
        newPredictions[fixture.fixture.id] = predictResult(homePos, awayPos);
      }
    });
    setPredictions(newPredictions);
    calculateSimulatedTable(newPredictions);
  };

  const quickFillFavorSelected = () => {
    const newPredictions = { ...predictions };
    fixtures.forEach((fixture) => {
      if (fixture.teams.home.id === selectedTeam.id) {
        newPredictions[fixture.fixture.id] = "home";
      } else if (fixture.teams.away.id === selectedTeam.id) {
        newPredictions[fixture.fixture.id] = "away";
      }
    });
    setPredictions(newPredictions);
    calculateSimulatedTable(newPredictions);
  };

  const resetSimulation = () => {
    setPredictions({});
    setSimulatedTable(originalStandings);
  };

  // Save Scenario
  const saveScenario = () => {
    if (!scenarioName.trim()) return;

    const scenario = {
      id: Date.now(),
      name: scenarioName,
      predictions: { ...predictions },
      rounds: [...selectedRounds],
      teamId: selectedTeam.id,
      createdAt: new Date().toISOString(),
      result: {
        originalPosition: getTeamPosition(originalStandings, selectedTeam.id),
        newPosition: getTeamPosition(simulatedTable, selectedTeam.id),
        pointsGained:
          simulatedTable.find((t) => t.team.id === selectedTeam.id)
            ?.simulatedPoints || 0,
      },
    };

    const updated = [...savedScenarios, scenario];
    setSavedScenarios(updated);
    localStorage.setItem(
      `scenarios_${selectedTeam.id}`,
      JSON.stringify(updated)
    );

    setShowSaveModal(false);
    setScenarioName("");
  };

  const loadScenario = (scenario) => {
    setSelectedRounds(scenario.rounds);
    setPredictions(scenario.predictions);

    // Need to reload fixtures for those rounds
    loadFixturesForRounds(scenario.rounds).then(() => {
      calculateSimulatedTable(scenario.predictions);
    });
  };

  const deleteScenario = (scenarioId) => {
    const updated = savedScenarios.filter((s) => s.id !== scenarioId);
    setSavedScenarios(updated);
    localStorage.setItem(
      `scenarios_${selectedTeam.id}`,
      JSON.stringify(updated)
    );
  };

  const toggleCompareScenario = (scenario) => {
    setCompareScenarios((prev) => {
      if (prev.find((s) => s.id === scenario.id)) {
        return prev.filter((s) => s.id !== scenario.id);
      }
      if (prev.length >= 3) return prev; // Max 3 comparisons
      return [...prev, scenario];
    });
  };

  // Share Card Generation
  const generateShareCard = async () => {
    if (!shareCardRef.current) return;

    try {
      const canvas = await html2canvas(shareCardRef.current, {
        backgroundColor: null,
        scale: 2,
        useCORS: true,
      });

      const blob = await new Promise((resolve) =>
        canvas.toBlob(resolve, "image/png")
      );

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${selectedTeam.name}-simulation-${
        new Date().toISOString().split("T")[0]
      }.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error generating share card:", error);
    }
  };

  const getTeamPosition = (table, teamId) => {
    return table.findIndex((t) => t.team.id === teamId) + 1;
  };

  const getPositionZone = (position) => {
    if (position <= 4) return { label: "Champions League", color: "blue" };
    if (position <= 6) return { label: "Europa League", color: "orange" };
    if (position <= 7) return { label: "Conference League", color: "green" };
    if (position >= 18) return { label: "Relegation", color: "red" };
    return { label: "Mid-table", color: "gray" };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
        <span className="ml-3 text-gray-300">Loading simulator...</span>
      </div>
    );
  }

  const originalPosition = getTeamPosition(originalStandings, selectedTeam.id);
  const newPosition = getTeamPosition(simulatedTable, selectedTeam.id);
  const positionChange = originalPosition - newPosition;
  const predictionsCount = Object.keys(predictions).length;
  const totalFixtures = fixtures.length;
  const selectedTeamSimulated = simulatedTable.find(
    (t) => t.team.id === selectedTeam.id
  );

  // Group fixtures by round
  const fixturesByRound = fixtures.reduce((acc, fixture) => {
    const round = fixture.league.round;
    if (!acc[round]) acc[round] = [];
    acc[round].push(fixture);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-6 text-center">
        <h2 className="flex items-center justify-center gap-2 mb-2 text-2xl font-bold text-white">
          <Calculator className="w-6 h-6" />
          Match Result Simulator
        </h2>
        <p className="text-gray-400">
          Predict match results and see how the table changes
        </p>
      </div>

      {/* Mode Toggle */}
      <div className="flex justify-center gap-2">
        <button
          onClick={() => setMultiGameweekMode(false)}
          className={`px-4 py-2 rounded-lg font-semibold transition-all ${
            !multiGameweekMode
              ? "bg-purple-600 text-white"
              : "bg-white/10 text-gray-400 hover:bg-white/20"
          }`}
        >
          Single Gameweek
        </button>
        <button
          onClick={() => setMultiGameweekMode(true)}
          className={`px-4 py-2 rounded-lg font-semibold transition-all flex items-center gap-2 ${
            multiGameweekMode
              ? "bg-purple-600 text-white"
              : "bg-white/10 text-gray-400 hover:bg-white/20"
          }`}
        >
          <Layers className="w-4 h-4" />
          Multi-Gameweek
        </button>
      </div>

      {/* Round Selector */}
      {!multiGameweekMode ? (
        // Single Gameweek Selector
        <div className="mb-6">
          <label className="block mb-2 text-sm font-semibold text-white">
            Select Gameweek:
          </label>
          <select
            value={selectedRounds[0] || ""}
            onChange={(e) => {
              setSelectedRounds([e.target.value]);
              setExpandedRounds({ [e.target.value]: true });
              setPredictions({});
              setSimulatedTable(originalStandings);
            }}
            className="w-full px-4 py-3 text-white border rounded-lg bg-white/10 border-white/20 focus:outline-none focus:border-purple-500"
          >
            {rounds.map((round) => (
              <option key={round} value={round} className="bg-slate-800">
                {round}
              </option>
            ))}
          </select>
        </div>
      ) : (
        // Multi-Gameweek Selector
        <div className="p-4 mb-6 border rounded-xl bg-white/5 border-white/10">
          <label className="block mb-3 text-sm font-semibold text-white">
            Select Gameweeks to Simulate:
          </label>
          <div className="flex flex-wrap gap-2 overflow-y-auto max-h-32">
            {rounds.slice(0, 15).map((round) => (
              <button
                key={round}
                onClick={() => handleRoundToggle(round)}
                className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                  selectedRounds.includes(round)
                    ? "bg-purple-600 text-white"
                    : "bg-white/10 text-gray-400 hover:bg-white/20"
                }`}
              >
                {round.replace("Regular Season - ", "GW")}
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-gray-500">
            {selectedRounds.length} gameweek(s) selected
          </p>
        </div>
      )}

      {/* Quick Fill Buttons */}
      {fixtures.length > 0 && (
        <div className="p-4 border rounded-xl bg-white/5 border-white/10">
          <h3 className="flex items-center gap-2 mb-3 text-sm font-semibold text-white">
            <Zap className="w-4 h-4 text-yellow-400" />
            Quick Fill Options
          </h3>
          <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
            <button
              onClick={() => quickFillAll("home")}
              className="flex items-center justify-center gap-2 px-3 py-2 text-sm font-semibold text-blue-400 transition-all rounded-lg bg-blue-600/20 hover:bg-blue-600/30"
            >
              <Home className="w-4 h-4" />
              All Home
            </button>
            <button
              onClick={() => quickFillAll("draw")}
              className="flex items-center justify-center gap-2 px-3 py-2 text-sm font-semibold text-yellow-400 transition-all rounded-lg bg-yellow-600/20 hover:bg-yellow-600/30"
            >
              <Minus className="w-4 h-4" />
              All Draws
            </button>
            <button
              onClick={() => quickFillAll("away")}
              className="flex items-center justify-center gap-2 px-3 py-2 text-sm font-semibold text-purple-400 transition-all rounded-lg bg-purple-600/20 hover:bg-purple-600/30"
            >
              <Plane className="w-4 h-4" />
              All Away
            </button>
            <button
              onClick={quickFillAuto}
              className="flex items-center justify-center gap-2 px-3 py-2 text-sm font-semibold text-green-400 transition-all rounded-lg bg-green-600/20 hover:bg-green-600/30"
            >
              <Sparkles className="w-4 h-4" />
              Auto Predict
            </button>
            <button
              onClick={quickFillFavorSelected}
              className="flex items-center justify-center gap-2 px-3 py-2 text-sm font-semibold text-red-400 transition-all rounded-lg bg-red-600/20 hover:bg-red-600/30"
            >
              <Target className="w-4 h-4" />
              {selectedTeam.name.split(" ")[0]} Wins
            </button>
          </div>
        </div>
      )}

      {/* Progress Bar */}
      {fixtures.length > 0 && (
        <div className="p-4 border rounded-xl bg-white/5 border-white/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Predictions Made</span>
            <span className="text-sm font-semibold text-white">
              {predictionsCount} / {totalFixtures}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full transition-all duration-300 bg-purple-500"
              style={{ width: `${(predictionsCount / totalFixtures) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Fixtures Prediction */}
      {fixtures.length > 0 ? (
        <div className="space-y-4">
          {Object.entries(fixturesByRound).map(([round, roundFixtures]) => (
            <div
              key={round}
              className="overflow-hidden border rounded-xl border-white/10"
            >
              {/* Round Header */}
              <button
                onClick={() =>
                  setExpandedRounds((prev) => ({
                    ...prev,
                    [round]: !prev[round],
                  }))
                }
                className="flex items-center justify-between w-full p-4 transition-all bg-white/5 hover:bg-white/10"
              >
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-purple-400" />
                  <span className="font-semibold text-white">{round}</span>
                  <span className="text-xs text-gray-400">
                    ({roundFixtures.length} matches)
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-400">
                    {
                      roundFixtures.filter((f) => predictions[f.fixture.id])
                        .length
                    }
                    /{roundFixtures.length} predicted
                  </span>
                  {expandedRounds[round] ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </div>
              </button>

              {/* Fixtures */}
              {expandedRounds[round] && (
                <div className="p-4 space-y-3">
                  {roundFixtures.map((fixture) => {
                    const isSelectedTeamMatch =
                      fixture.teams.home.id === selectedTeam.id ||
                      fixture.teams.away.id === selectedTeam.id;

                    const homeTeam = originalStandings.find(
                      (t) => t.team.id === fixture.teams.home.id
                    );
                    const awayTeam = originalStandings.find(
                      (t) => t.team.id === fixture.teams.away.id
                    );
                    const homePos = homeTeam
                      ? originalStandings.indexOf(homeTeam) + 1
                      : 0;
                    const awayPos = awayTeam
                      ? originalStandings.indexOf(awayTeam) + 1
                      : 0;

                    return (
                      <div
                        key={fixture.fixture.id}
                        className={`p-4 rounded-lg border transition-all ${
                          isSelectedTeamMatch
                            ? "bg-purple-600/20 border-purple-500/50"
                            : "bg-white/5 border-white/10"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center flex-1 gap-3">
                            <img
                              src={fixture.teams.home.logo}
                              alt=""
                              className="w-8 h-8"
                            />
                            <div>
                              <span className="block text-sm font-medium text-white">
                                {fixture.teams.home.name}
                              </span>
                              <span className="text-xs text-gray-500">
                                {getOrdinalSuffix(homePos)} •{" "}
                                {homeTeam?.points || 0} pts
                              </span>
                            </div>
                          </div>

                          <div className="flex flex-col items-center px-4">
                            <span className="text-xs text-gray-400">VS</span>
                            <span className="text-xs text-gray-500">
                              {formatDate(fixture.fixture.date)}
                            </span>
                          </div>

                          <div className="flex items-center justify-end flex-1 gap-3">
                            <div className="text-right">
                              <span className="block text-sm font-medium text-white">
                                {fixture.teams.away.name}
                              </span>
                              <span className="text-xs text-gray-500">
                                {getOrdinalSuffix(awayPos)} •{" "}
                                {awayTeam?.points || 0} pts
                              </span>
                            </div>
                            <img
                              src={fixture.teams.away.logo}
                              alt=""
                              className="w-8 h-8"
                            />
                          </div>
                        </div>

                        {/* Result Buttons */}
                        <div className="flex gap-2">
                          <button
                            onClick={() =>
                              handleResultChange(fixture.fixture.id, "home")
                            }
                            className={`flex-1 py-2 px-3 rounded text-sm font-semibold transition-all flex items-center justify-center gap-1 ${
                              predictions[fixture.fixture.id] === "home"
                                ? "bg-green-600 text-white"
                                : "bg-white/10 text-gray-300 hover:bg-white/20"
                            }`}
                          >
                            {predictions[fixture.fixture.id] === "home" && (
                              <Check className="w-4 h-4" />
                            )}
                            Home
                          </button>
                          <button
                            onClick={() =>
                              handleResultChange(fixture.fixture.id, "draw")
                            }
                            className={`flex-1 py-2 px-3 rounded text-sm font-semibold transition-all flex items-center justify-center gap-1 ${
                              predictions[fixture.fixture.id] === "draw"
                                ? "bg-yellow-600 text-white"
                                : "bg-white/10 text-gray-300 hover:bg-white/20"
                            }`}
                          >
                            {predictions[fixture.fixture.id] === "draw" && (
                              <Check className="w-4 h-4" />
                            )}
                            Draw
                          </button>
                          <button
                            onClick={() =>
                              handleResultChange(fixture.fixture.id, "away")
                            }
                            className={`flex-1 py-2 px-3 rounded text-sm font-semibold transition-all flex items-center justify-center gap-1 ${
                              predictions[fixture.fixture.id] === "away"
                                ? "bg-green-600 text-white"
                                : "bg-white/10 text-gray-300 hover:bg-white/20"
                            }`}
                          >
                            {predictions[fixture.fixture.id] === "away" && (
                              <Check className="w-4 h-4" />
                            )}
                            Away
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="py-8 text-center text-gray-400">
          No fixtures available for selected gameweek(s)
        </div>
      )}

      {/* Action Buttons */}
      {predictionsCount > 0 && (
        <div className="flex flex-wrap gap-3">
          <button
            onClick={resetSimulation}
            className="flex items-center justify-center flex-1 gap-2 py-3 font-semibold text-white transition-all rounded-lg bg-white/10 hover:bg-white/20"
          >
            <RotateCcw className="w-5 h-5" />
            Reset
          </button>
          <button
            onClick={() => setShowSaveModal(true)}
            className="flex items-center justify-center flex-1 gap-2 py-3 font-semibold text-white transition-all bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            <Save className="w-5 h-5" />
            Save Scenario
          </button>
          <button
            onClick={() => setShowShareModal(true)}
            className="flex items-center justify-center flex-1 gap-2 py-3 font-semibold text-white transition-all bg-purple-600 rounded-lg hover:bg-purple-700"
          >
            <Share2 className="w-5 h-5" />
            Share
          </button>
        </div>
      )}

      {/* Position Change Card */}
      {predictionsCount > 0 && (
        <div
          className={`p-6 rounded-xl border ${
            positionChange > 0
              ? "bg-green-600/20 border-green-500/50"
              : positionChange < 0
              ? "bg-red-600/20 border-red-500/50"
              : "bg-gray-600/20 border-gray-500/50"
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="flex items-center gap-2 mb-1 text-lg font-bold text-white">
                {positionChange > 0 ? (
                  <TrendingUp className="w-5 h-5 text-green-400" />
                ) : positionChange < 0 ? (
                  <TrendingDown className="w-5 h-5 text-red-400" />
                ) : (
                  <Minus className="w-5 h-5 text-gray-400" />
                )}
                {selectedTeam.name}
              </h3>
              <p className="text-sm text-gray-400">
                Points gained: +{selectedTeamSimulated?.simulatedPoints || 0}
              </p>
            </div>

            <div className="text-right">
              <div className="flex items-center gap-3">
                <div className="text-center">
                  <p className="text-xs text-gray-500">Current</p>
                  <p className="text-2xl font-bold text-gray-400">
                    {originalPosition}
                  </p>
                </div>
                <ChevronRight className="w-6 h-6 text-gray-500" />
                <div className="text-center">
                  <p className="text-xs text-gray-500">Projected</p>
                  <p
                    className={`text-2xl font-bold ${
                      positionChange > 0
                        ? "text-green-400"
                        : positionChange < 0
                        ? "text-red-400"
                        : "text-white"
                    }`}
                  >
                    {newPosition}
                  </p>
                </div>
              </div>
              {positionChange !== 0 && (
                <p
                  className={`text-sm mt-1 ${
                    positionChange > 0 ? "text-green-400" : "text-red-400"
                  }`}
                >
                  {positionChange > 0 ? "↑" : "↓"} {Math.abs(positionChange)}{" "}
                  {Math.abs(positionChange) === 1 ? "place" : "places"}
                </p>
              )}
            </div>
          </div>

          {/* Zone Change */}
          <div className="pt-4 mt-4 border-t border-white/10">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs text-gray-500">Current Zone: </span>
                <span
                  className={`text-sm font-semibold text-${
                    getPositionZone(originalPosition).color
                  }-400`}
                >
                  {getPositionZone(originalPosition).label}
                </span>
              </div>
              <div>
                <span className="text-xs text-gray-500">Projected Zone: </span>
                <span
                  className={`text-sm font-semibold text-${
                    getPositionZone(newPosition).color
                  }-400`}
                >
                  {getPositionZone(newPosition).label}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Simulated Table */}
      {predictionsCount > 0 && (
        <div className="overflow-hidden border rounded-xl border-white/10">
          <div className="p-4 border-b bg-white/5 border-white/10">
            <h3 className="text-lg font-semibold text-white">
              Simulated Table
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-400 border-b border-white/10 bg-white/5">
                  <th className="px-4 py-3 text-left">Pos</th>
                  <th className="px-4 py-3 text-left">Team</th>
                  <th className="px-2 py-3 text-center">P</th>
                  <th className="px-2 py-3 text-center">GD</th>
                  <th className="px-2 py-3 text-center">Pts</th>
                  <th className="px-2 py-3 text-center">+/-</th>
                </tr>
              </thead>
              <tbody>
                {simulatedTable.map((team) => {
                  const isSelectedTeam = team.team.id === selectedTeam.id;
                  const originalRank =
                    originalStandings.findIndex(
                      (t) => t.team.id === team.team.id
                    ) + 1;
                  const rankChange = originalRank - team.rank;
                  // const zone = getPositionZone(team.rank);

                  return (
                    <tr
                      key={team.team.id}
                      className={`border-b border-white/5 transition-all ${
                        isSelectedTeam
                          ? "bg-purple-600/20"
                          : team.rank <= 4
                          ? "bg-blue-600/5"
                          : team.rank >= 18
                          ? "bg-red-600/5"
                          : ""
                      }`}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-bold ${
                              team.rank <= 4
                                ? "text-blue-400"
                                : team.rank >= 18
                                ? "text-red-400"
                                : "text-gray-300"
                            }`}
                          >
                            {team.rank}
                          </span>
                          {rankChange !== 0 && (
                            <span
                              className={`text-xs ${
                                rankChange > 0
                                  ? "text-green-400"
                                  : "text-red-400"
                              }`}
                            >
                              {rankChange > 0 ? "↑" : "↓"}
                              {Math.abs(rankChange)}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={team.team.logo}
                            alt=""
                            className="w-6 h-6"
                          />
                          <span
                            className={
                              isSelectedTeam
                                ? "text-white font-bold"
                                : "text-gray-200"
                            }
                          >
                            {team.team.name}
                          </span>
                          {isSelectedTeam && (
                            <span className="px-2 py-0.5 text-xs font-bold text-purple-400 bg-purple-600/30 rounded">
                              YOU
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-2 py-3 text-center text-gray-400">
                        {team.all.played}
                      </td>
                      <td className="px-2 py-3 text-center text-gray-400">
                        {team.goalsDiff > 0 ? "+" : ""}
                        {team.goalsDiff}
                      </td>
                      <td className="px-2 py-3 font-bold text-center text-white">
                        {team.points}
                      </td>
                      <td className="px-2 py-3 text-center">
                        {team.simulatedPoints > 0 && (
                          <span className="font-semibold text-green-400">
                            +{team.simulatedPoints}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Saved Scenarios */}
      {savedScenarios.length > 0 && (
        <div className="overflow-hidden border rounded-xl border-white/10">
          <div className="flex items-center justify-between p-4 border-b bg-white/5 border-white/10">
            <h3 className="flex items-center gap-2 text-lg font-semibold text-white">
              <Save className="w-5 h-5 text-blue-400" />
              Saved Scenarios
            </h3>
            {savedScenarios.length >= 2 && (
              <button
                onClick={() => setCompareMode(!compareMode)}
                className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                  compareMode
                    ? "bg-purple-600 text-white"
                    : "bg-white/10 text-gray-400 hover:bg-white/20"
                }`}
              >
                {compareMode ? "Exit Compare" : "Compare"}
              </button>
            )}
          </div>
          <div className="p-4 space-y-3">
            {savedScenarios.map((scenario) => (
              <div
                key={scenario.id}
                className={`p-4 rounded-lg border transition-all ${
                  compareMode &&
                  compareScenarios.find((s) => s.id === scenario.id)
                    ? "bg-purple-600/20 border-purple-500/50"
                    : "bg-white/5 border-white/10"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-white">
                      {scenario.name}
                    </h4>
                    <p className="text-xs text-gray-400">
                      {scenario.rounds.length} gameweek(s) •{" "}
                      {Object.keys(scenario.predictions).length} predictions
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="mr-4 text-right">
                      <p className="text-xs text-gray-500">Position</p>
                      <p className="text-lg font-bold">
                        <span className="text-gray-400">
                          {scenario.result.originalPosition}
                        </span>
                        <span className="mx-1 text-gray-500">→</span>
                        <span
                          className={
                            (scenario.result.newPosition,
                            scenario.result.originalPosition
                              ? "text-green-400"
                              : scenario.result.newPosition >
                                scenario.result.originalPosition
                              ? "text-red-400"
                              : "text-white")
                          }
                        >
                          {scenario.result.newPosition}
                        </span>
                      </p>
                    </div>

                    {compareMode ? (
                      <button
                        onClick={() => toggleCompareScenario(scenario)}
                        className={`p-2 rounded-lg transition-all ${
                          compareScenarios.find((s) => s.id === scenario.id)
                            ? "bg-purple-600 text-white"
                            : "bg-white/10 text-gray-400 hover:bg-white/20"
                        }`}
                      >
                        <Check className="w-5 h-5" />
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => loadScenario(scenario)}
                          className="p-2 text-blue-400 transition-all rounded-lg bg-blue-600/20 hover:bg-blue-600/30"
                        >
                          <Copy className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => deleteScenario(scenario.id)}
                          className="p-2 text-red-400 transition-all rounded-lg bg-red-600/20 hover:bg-red-600/30"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Compare View */}
          {compareMode && compareScenarios.length >= 2 && (
            <div className="p-4 border-t border-white/10 bg-purple-600/10">
              <h4 className="mb-4 font-semibold text-white">
                Scenario Comparison
              </h4>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {compareScenarios.map((scenario) => (
                  <div
                    key={scenario.id}
                    className="p-4 border rounded-lg bg-white/5 border-white/10"
                  >
                    <h5 className="mb-2 font-semibold text-white">
                      {scenario.name}
                    </h5>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Position</span>
                        <span className="text-white">
                          {scenario.result.originalPosition} →{" "}
                          {scenario.result.newPosition}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Change</span>
                        <span
                          className={
                            scenario.result.originalPosition -
                              scenario.result.newPosition >
                            0
                              ? "text-green-400"
                              : "text-red-400"
                          }
                        >
                          {scenario.result.originalPosition -
                            scenario.result.newPosition >
                          0
                            ? "↑"
                            : "↓"}
                          {Math.abs(
                            scenario.result.originalPosition -
                              scenario.result.newPosition
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Points Gained</span>
                        <span className="text-green-400">
                          +{scenario.result.pointsGained}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Save Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md p-6 border rounded-2xl bg-gradient-to-br from-slate-900 via-purple-900/50 to-slate-900 border-purple-500/30">
            <div className="flex items-center justify-between mb-4">
              <h3 className="flex items-center gap-2 text-lg font-bold text-white">
                <Save className="w-5 h-5 text-blue-400" />
                Save Scenario
              </h3>
              <button
                onClick={() => setShowSaveModal(false)}
                className="p-2 text-gray-400 transition-all hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <input
              type="text"
              value={scenarioName}
              onChange={(e) => setScenarioName(e.target.value)}
              placeholder="e.g., Optimistic, Best Case, Realistic..."
              className="w-full px-4 py-3 mb-4 text-white placeholder-gray-400 border rounded-lg bg-white/10 border-white/20 focus:outline-none focus:border-purple-500"
            />

            <div className="p-4 mb-4 border rounded-lg bg-white/5 border-white/10">
              <p className="mb-2 text-sm text-gray-400">Preview:</p>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-white">
                  {selectedTeam.name}
                </span>
                <span className="text-lg font-bold">
                  <span className="text-gray-400">{originalPosition}</span>
                  <span className="mx-2 text-gray-500">→</span>
                  <span
                    className={
                      positionChange > 0
                        ? "text-green-400"
                        : positionChange < 0
                        ? "text-red-400"
                        : "text-white"
                    }
                  >
                    {newPosition}
                  </span>
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowSaveModal(false)}
                className="flex-1 py-3 font-semibold text-white transition-all rounded-lg bg-white/10 hover:bg-white/20"
              >
                Cancel
              </button>
              <button
                onClick={saveScenario}
                disabled={!scenarioName.trim()}
                className="flex-1 py-3 font-semibold text-white transition-all bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-lg overflow-hidden border rounded-2xl bg-gradient-to-br from-slate-900 via-purple-900/50 to-slate-900 border-purple-500/30">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <h3 className="flex items-center gap-2 text-lg font-bold text-white">
                <Share2 className="w-5 h-5 text-purple-400" />
                Share Simulation
              </h3>
              <button
                onClick={() => setShowShareModal(false)}
                className="p-2 text-gray-400 transition-all hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Share Card Preview */}
            <div className="p-4 overflow-auto max-h-[60vh]">
              <div
                ref={shareCardRef}
                className="p-6 border rounded-xl bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 border-purple-500/30"
              >
                {/* Card Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <img src={selectedTeam.logo} alt="" className="w-12 h-12" />
                    <div>
                      <h3 className="text-lg font-bold text-white">
                        {selectedTeam.name}
                      </h3>
                      <p className="text-sm text-purple-400">
                        Season Simulation
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400">
                      {selectedRounds.length} Gameweek(s)
                    </p>
                    <p className="text-xs text-gray-400">
                      {predictionsCount} Predictions
                    </p>
                  </div>
                </div>

                {/* Position Change */}
                <div
                  className={`p-4 rounded-lg mb-4 ${
                    positionChange > 0
                      ? "bg-green-600/20"
                      : positionChange < 0
                      ? "bg-red-600/20"
                      : "bg-gray-600/20"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Position</span>
                    <div className="flex items-center gap-3">
                      <span className="text-2xl font-bold text-gray-400">
                        {originalPosition}
                      </span>
                      <ChevronRight className="w-6 h-6 text-gray-500" />
                      <span
                        className={`text-2xl font-bold ${
                          positionChange > 0
                            ? "text-green-400"
                            : positionChange < 0
                            ? "text-red-400"
                            : "text-white"
                        }`}
                      >
                        {newPosition}
                      </span>
                    </div>
                  </div>
                  {positionChange !== 0 && (
                    <p
                      className={`text-sm text-right mt-2 ${
                        positionChange > 0 ? "text-green-400" : "text-red-400"
                      }`}
                    >
                      {positionChange > 0 ? "↑" : "↓"}{" "}
                      {Math.abs(positionChange)}{" "}
                      {Math.abs(positionChange) === 1 ? "place" : "places"}
                    </p>
                  )}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="p-3 text-center rounded-lg bg-white/5">
                    <p className="text-xs text-gray-400">Points Gained</p>
                    <p className="text-xl font-bold text-green-400">
                      +{selectedTeamSimulated?.simulatedPoints || 0}
                    </p>
                  </div>
                  <div className="p-3 text-center rounded-lg bg-white/5">
                    <p className="text-xs text-gray-400">Total Points</p>
                    <p className="text-xl font-bold text-white">
                      {selectedTeamSimulated?.points || 0}
                    </p>
                  </div>
                  <div className="p-3 text-center rounded-lg bg-white/5">
                    <p className="text-xs text-gray-400">Zone</p>
                    <p
                      className={`text-sm font-bold text-${
                        getPositionZone(newPosition).color
                      }-400`}
                    >
                      {getPositionZone(newPosition).label}
                    </p>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-4 border-t border-white/10">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-purple-400" />
                    <span className="text-sm font-semibold text-purple-400">
                      PL Position Tracker
                    </span>
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date().toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="p-4 border-t border-white/10">
              <button
                onClick={generateShareCard}
                className="flex items-center justify-center w-full gap-2 py-3 font-semibold text-white transition-all bg-purple-600 rounded-lg hover:bg-purple-700"
              >
                <Download className="w-5 h-5" />
                Download Image
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Simulator;
