import { useState, useEffect } from "react";
import {
  fetchStandings,
  fetchFixtures,
  fetchRounds,
} from "../services/footballApi";
import {
  Calculator,
  RotateCcw,
  TrendingUp,
  Loader2,
  Calendar,
} from "lucide-react";

function Simulator({ selectedTeam }) {
  const [predictions, setPredictions] = useState({});
  const [originalStandings, setOriginalStandings] = useState([]);
  const [simulatedTable, setSimulatedTable] = useState([]);
  const [fixtures, setFixtures] = useState([]);
  const [rounds, setRounds] = useState([]);
  const [selectedRound, setSelectedRound] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSimulatorData();
  }, []);

  useEffect(() => {
    if (selectedRound) {
      loadFixturesForRound(selectedRound);
    }
  }, [selectedRound]);

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

    // Auto-select the next round if available
    if (upcomingFixtures.length > 0) {
      const nextRound = upcomingFixtures[0].league.round;
      setSelectedRound(nextRound);
      setFixtures(upcomingFixtures);
    }

    setLoading(false);
  };

  const loadFixturesForRound = async (round) => {
    const fixturesData = await fetchFixtures(round);
    setFixtures(fixturesData);
    setPredictions({}); // Reset predictions when changing round
    setSimulatedTable(originalStandings); // Reset table
  };

  const handleResultChange = (fixtureId, result) => {
    const newPredictions = { ...predictions, [fixtureId]: result };
    setPredictions(newPredictions);
    calculateSimulatedTable(newPredictions);
  };

  const calculateSimulatedTable = (currentPredictions) => {
    // Deep copy of standings
    const newTable = originalStandings.map((team) => ({
      ...team,
      team: { ...team.team },
      points: team.points,
      goalsDiff: team.goalsDiff,
      all: { ...team.all },
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
        // Home team wins
        newTable[homeTeamIndex].points += 3;
        newTable[homeTeamIndex].all.win += 1;
        newTable[homeTeamIndex].all.played += 1;
        newTable[awayTeamIndex].all.lose += 1;
        newTable[awayTeamIndex].all.played += 1;
      } else if (result === "away") {
        // Away team wins
        newTable[awayTeamIndex].points += 3;
        newTable[awayTeamIndex].all.win += 1;
        newTable[awayTeamIndex].all.played += 1;
        newTable[homeTeamIndex].all.lose += 1;
        newTable[homeTeamIndex].all.played += 1;
      } else if (result === "draw") {
        // Draw
        newTable[homeTeamIndex].points += 1;
        newTable[awayTeamIndex].points += 1;
        newTable[homeTeamIndex].all.draw += 1;
        newTable[awayTeamIndex].all.draw += 1;
        newTable[homeTeamIndex].all.played += 1;
        newTable[awayTeamIndex].all.played += 1;
      }
    });

    // Sort by points, then goal difference
    newTable.sort((a, b) => {
      if (b.points !== a.points) {
        return b.points - a.points;
      }
      return b.goalsDiff - a.goalsDiff;
    });

    // Update ranks
    newTable.forEach((team, index) => {
      team.rank = index + 1;
    });

    setSimulatedTable(newTable);
  };

  const resetSimulation = () => {
    setPredictions({});
    setSimulatedTable(originalStandings);
  };

  const getTeamPosition = (table, teamId) => {
    return table.findIndex((t) => t.team.id === teamId) + 1;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
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

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-white mb-2 flex items-center justify-center gap-2">
          <Calculator className="w-6 h-6" />
          Match Result Simulator
        </h2>
        <p className="text-gray-400">
          Predict match results and see how the table changes for{" "}
          {selectedTeam.name}
        </p>
      </div>

      {/* Round Selector */}
      {rounds.length > 0 && (
        <div className="mb-6">
          <label className="block text-sm font-semibold text-white mb-2">
            Select Gameweek:
          </label>
          <select
            value={selectedRound || ""}
            onChange={(e) => setSelectedRound(e.target.value)}
            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-purple-500"
          >
            {rounds.map((round) => (
              <option key={round} value={round} className="bg-slate-800">
                {round}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Fixtures Prediction */}
      {fixtures.length > 0 ? (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Predict Results:
          </h3>
          {fixtures.map((fixture) => {
            const isSelectedTeamMatch =
              fixture.teams.home.id === selectedTeam.id ||
              fixture.teams.away.id === selectedTeam.id;

            return (
              <div
                key={fixture.fixture.id}
                className={`p-4 rounded-lg border ${
                  isSelectedTeamMatch
                    ? "bg-purple-600/20 border-purple-500/50"
                    : "bg-white/5 border-white/10"
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3 flex-1">
                    <img
                      src={fixture.teams.home.logo}
                      alt=""
                      className="w-6 h-6"
                    />
                    <span className="text-white text-sm font-medium">
                      {fixture.teams.home.name}
                    </span>
                  </div>
                  <span className="text-gray-400 text-xs px-2">VS</span>
                  <div className="flex items-center gap-3 flex-1 justify-end">
                    <span className="text-white text-sm font-medium">
                      {fixture.teams.away.name}
                    </span>
                    <img
                      src={fixture.teams.away.logo}
                      alt=""
                      className="w-6 h-6"
                    />
                  </div>
                </div>

                {/* Date */}
                <p className="text-xs text-gray-400 mb-3 text-center">
                  {formatDate(fixture.fixture.date)}
                </p>

                {/* Result Buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      handleResultChange(fixture.fixture.id, "home")
                    }
                    className={`flex-1 py-2 px-3 rounded text-sm font-semibold transition-all ${
                      predictions[fixture.fixture.id] === "home"
                        ? "bg-green-600 text-white"
                        : "bg-white/10 text-gray-300 hover:bg-white/20"
                    }`}
                  >
                    Home Win
                  </button>
                  <button
                    onClick={() =>
                      handleResultChange(fixture.fixture.id, "draw")
                    }
                    className={`flex-1 py-2 px-3 rounded text-sm font-semibold transition-all ${
                      predictions[fixture.fixture.id] === "draw"
                        ? "bg-yellow-600 text-white"
                        : "bg-white/10 text-gray-300 hover:bg-white/20"
                    }`}
                  >
                    Draw
                  </button>
                  <button
                    onClick={() =>
                      handleResultChange(fixture.fixture.id, "away")
                    }
                    className={`flex-1 py-2 px-3 rounded text-sm font-semibold transition-all ${
                      predictions[fixture.fixture.id] === "away"
                        ? "bg-green-600 text-white"
                        : "bg-white/10 text-gray-300 hover:bg-white/20"
                    }`}
                  >
                    Away Win
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-400">
          No fixtures available for this round
        </div>
      )}

      {/* Reset Button */}
      {Object.keys(predictions).length > 0 && (
        <button
          onClick={resetSimulation}
          className="w-full py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg font-semibold flex items-center justify-center gap-2 transition-all"
        >
          <RotateCcw className="w-5 h-5" />
          Reset Simulation
        </button>
      )}

      {/* Position Change */}
      {Object.keys(predictions).length > 0 && (
        <div
          className={`p-6 rounded-lg border ${
            positionChange > 0
              ? "bg-green-600/20 border-green-500/50"
              : positionChange < 0
              ? "bg-red-600/20 border-red-500/50"
              : "bg-gray-600/20 border-gray-500/50"
          }`}
        >
          <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            {selectedTeam.name} Position Change
          </h3>
          <p className="text-2xl font-bold text-white">
            {originalPosition} → {newPosition}
            {positionChange > 0 && (
              <span className="text-green-400 ml-2">
                ↑ {positionChange} {positionChange === 1 ? "place" : "places"}
              </span>
            )}
            {positionChange < 0 && (
              <span className="text-red-400 ml-2">
                ↓ {Math.abs(positionChange)}{" "}
                {Math.abs(positionChange) === 1 ? "place" : "places"}
              </span>
            )}
            {positionChange === 0 && (
              <span className="text-gray-400 ml-2">No change</span>
            )}
          </p>
        </div>
      )}

      {/* Simulated Table */}
      {Object.keys(predictions).length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            Simulated Table:
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-gray-400">
                  <th className="text-left py-2 px-3">Pos</th>
                  <th className="text-left py-2 px-3">Team</th>
                  <th className="text-center py-2 px-2">P</th>
                  <th className="text-center py-2 px-2">Pts</th>
                </tr>
              </thead>
              <tbody>
                {simulatedTable.map((team) => {
                  const isSelectedTeam = team.team.id === selectedTeam.id;
                  const originalRank = originalStandings.find(
                    (t) => t.team.id === team.team.id
                  )?.rank;
                  const rankChange = originalRank - team.rank;

                  return (
                    <tr
                      key={team.team.id}
                      className={`border-b border-white/5 ${
                        isSelectedTeam ? "bg-purple-600/20" : ""
                      }`}
                    >
                      <td className="py-2 px-3 text-gray-300 font-semibold">
                        {team.rank}
                        {rankChange !== 0 && (
                          <span
                            className={`ml-1 text-xs ${
                              rankChange > 0 ? "text-green-400" : "text-red-400"
                            }`}
                          >
                            {rankChange > 0 ? "↑" : "↓"}
                            {Math.abs(rankChange)}
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-3">
                        <div className="flex items-center gap-2">
                          <img
                            src={team.team.logo}
                            alt=""
                            className="w-5 h-5"
                          />
                          <span
                            className={
                              isSelectedTeam
                                ? "text-white font-semibold"
                                : "text-gray-200"
                            }
                          >
                            {team.team.name}
                          </span>
                        </div>
                      </td>
                      <td className="py-2 px-2 text-center text-gray-300">
                        {team.all.played}
                      </td>
                      <td className="py-2 px-2 text-center font-bold text-white">
                        {team.points}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default Simulator;
