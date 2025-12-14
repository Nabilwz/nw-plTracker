import { useState, useEffect, useCallback } from "react";
import {
  fetchStandings,
  fetchFixtures,
  //   fetchTeamFixtures,
} from "../services/footballApi";
import {
  Brain,
  TrendingUp,
  TrendingDown,
  Trophy,
  Target,
  AlertTriangle,
  Loader2,
  ChevronDown,
  ChevronUp,
  Sparkles,
  BarChart3,
  Calendar,
  Shield,
  Flame,
  Award,
  Percent,
  Zap,
} from "lucide-react";

// ========== PREDICTION ALGORITHM ==========

const calculateEloRating = (position, points, goalsDiff, form) => {
  // Base Elo from position (1st = 2000, 20th = 1200)
  const baseElo = 2000 - (position - 1) * 40;

  // Adjust for points per game
  const ppgBonus = (points / 15) * 50; // Assuming ~15 games played

  // Adjust for goal difference
  const gdBonus = goalsDiff * 2;

  // Adjust for form (last 5 games)
  const formPoints = calculateFormPoints(form);
  const formBonus = (formPoints - 7.5) * 10; // 7.5 is average

  return Math.round(baseElo + ppgBonus + gdBonus + formBonus);
};

const calculateFormPoints = (formString) => {
  if (!formString) return 7.5;
  let points = 0;
  for (const result of formString.slice(0, 5)) {
    if (result === "W") points += 3;
    else if (result === "D") points += 1;
  }
  return points;
};

const predictMatch = (homeTeam, awayTeam, homeElo, awayElo) => {
  // Home advantage worth ~65 Elo points
  const homeAdvantage = 65;
  const adjustedHomeElo = homeElo + homeAdvantage;

  // Calculate expected scores using Elo formula
  const eloDiff = adjustedHomeElo - awayElo;
  //   const homeExpected = 1 / (1 + Math.pow(10, -eloDiff / 400));

  // Convert to win/draw/lose probabilities
  // Using a simplified model
  let homeWin, draw, awayWin;

  if (eloDiff > 150) {
    homeWin = Math.min(0.75, 0.45 + eloDiff / 600);
    draw = 0.2;
    awayWin = 1 - homeWin - draw;
  } else if (eloDiff > 50) {
    homeWin = 0.4 + eloDiff / 500;
    draw = 0.28;
    awayWin = 1 - homeWin - draw;
  } else if (eloDiff > -50) {
    homeWin = 0.38 + eloDiff / 400;
    draw = 0.3;
    awayWin = 1 - homeWin - draw;
  } else if (eloDiff > -150) {
    awayWin = 0.4 - eloDiff / 500;
    draw = 0.28;
    homeWin = 1 - awayWin - draw;
  } else {
    awayWin = Math.min(0.7, 0.45 - eloDiff / 600);
    draw = 0.22;
    homeWin = 1 - awayWin - draw;
  }

  // Ensure probabilities are valid
  homeWin = Math.max(0.05, Math.min(0.85, homeWin));
  awayWin = Math.max(0.05, Math.min(0.85, awayWin));
  draw = 1 - homeWin - awayWin;

  // Predict scoreline based on probabilities
  const predictedScore = predictScoreline(homeWin, awayWin, draw, eloDiff);

  return {
    homeWin: Math.round(homeWin * 100),
    draw: Math.round(draw * 100),
    awayWin: Math.round(awayWin * 100),
    predictedScore,
    confidence: Math.round(Math.max(homeWin, awayWin, draw) * 100),
  };
};

const predictScoreline = (homeWin, awayWin, draw, eloDiff) => {
  // Simplified scoreline prediction
  if (homeWin > 0.55) {
    if (eloDiff > 200) return { home: 3, away: 0 };
    if (eloDiff > 100) return { home: 2, away: 0 };
    return { home: 2, away: 1 };
  } else if (awayWin > 0.55) {
    if (eloDiff < -200) return { home: 0, away: 3 };
    if (eloDiff < -100) return { home: 0, away: 2 };
    return { home: 1, away: 2 };
  } else if (draw > 0.28) {
    return { home: 1, away: 1 };
  } else if (homeWin > awayWin) {
    return { home: 1, away: 0 };
  } else {
    return { home: 0, away: 1 };
  }
};

const simulateSeason = (standings, fixtures, numSimulations = 1000) => {
  const results = {};

  // Initialize results tracking
  standings.forEach((team) => {
    results[team.team.id] = {
      team: team.team,
      positions: Array(20).fill(0),
      totalPoints: 0,
      titleWins: 0,
      top4Finishes: 0,
      relegations: 0,
    };
  });

  // Calculate Elo ratings
  const eloRatings = {};
  standings.forEach((team, index) => {
    eloRatings[team.team.id] = calculateEloRating(
      index + 1,
      team.points,
      team.goalsDiff,
      team.form
    );
  });

  // Run simulations
  for (let sim = 0; sim < numSimulations; sim++) {
    // Clone current standings
    const simTable = standings.map((team) => ({
      id: team.team.id,
      points: team.points,
      goalsDiff: team.goalsDiff,
    }));

    // Simulate remaining fixtures
    fixtures.forEach((fixture) => {
      const homeId = fixture.teams.home.id;
      const awayId = fixture.teams.away.id;

      const homeTeamSim = simTable.find((t) => t.id === homeId);
      const awayTeamSim = simTable.find((t) => t.id === awayId);

      if (!homeTeamSim || !awayTeamSim) return;

      const prediction = predictMatch(
        fixture.teams.home,
        fixture.teams.away,
        eloRatings[homeId] || 1500,
        eloRatings[awayId] || 1500
      );

      // Add randomness based on probabilities
      const rand = Math.random() * 100;

      if (rand < prediction.homeWin) {
        homeTeamSim.points += 3;
        homeTeamSim.goalsDiff += 1;
        awayTeamSim.goalsDiff -= 1;
      } else if (rand < prediction.homeWin + prediction.draw) {
        homeTeamSim.points += 1;
        awayTeamSim.points += 1;
      } else {
        awayTeamSim.points += 3;
        awayTeamSim.goalsDiff += 1;
        homeTeamSim.goalsDiff -= 1;
      }
    });

    // Sort final table
    simTable.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      return b.goalsDiff - a.goalsDiff;
    });

    // Record positions
    simTable.forEach((team, index) => {
      const position = index + 1;
      results[team.id].positions[index]++;
      results[team.id].totalPoints += team.points;

      if (position === 1) results[team.id].titleWins++;
      if (position <= 4) results[team.id].top4Finishes++;
      if (position >= 18) results[team.id].relegations++;
    });
  }

  // Calculate final probabilities
  const finalResults = Object.values(results).map((result) => {
    const avgPoints = result.totalPoints / numSimulations;
    const mostLikelyPosition =
      result.positions.indexOf(Math.max(...result.positions)) + 1;

    return {
      team: result.team,
      avgPoints: Math.round(avgPoints * 10) / 10,
      mostLikelyPosition,
      titleProbability: Math.round((result.titleWins / numSimulations) * 100),
      top4Probability: Math.round((result.top4Finishes / numSimulations) * 100),
      relegationProbability: Math.round(
        (result.relegations / numSimulations) * 100
      ),
      positionDistribution: result.positions.map((count) =>
        Math.round((count / numSimulations) * 100)
      ),
    };
  });

  // Sort by average points
  finalResults.sort((a, b) => b.avgPoints - a.avgPoints);

  return finalResults;
};

// ========== COMPONENT ==========

function AIPredictions({ selectedTeam }) {
  const [predictions, setPredictions] = useState([]);
  const [seasonProjection, setSeasonProjection] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("matches");
  const [expandedMatch, setExpandedMatch] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);

    try {
      const [standingsData, fixturesData] = await Promise.all([
        fetchStandings(),
        fetchFixtures(),
      ]);

      // Calculate Elo ratings
      const eloRatings = {};
      standingsData.forEach((team, index) => {
        eloRatings[team.team.id] = calculateEloRating(
          index + 1,
          team.points,
          team.goalsDiff,
          team.form
        );
      });

      // Generate match predictions
      const matchPredictions = fixturesData.slice(0, 20).map((fixture) => {
        const homeTeam = standingsData.find(
          (t) => t.team.id === fixture.teams.home.id
        );
        const awayTeam = standingsData.find(
          (t) => t.team.id === fixture.teams.away.id
        );

        const homePos = homeTeam ? standingsData.indexOf(homeTeam) + 1 : 10;
        const awayPos = awayTeam ? standingsData.indexOf(awayTeam) + 1 : 10;

        const prediction = predictMatch(
          fixture.teams.home,
          fixture.teams.away,
          eloRatings[fixture.teams.home.id] || 1500,
          eloRatings[fixture.teams.away.id] || 1500
        );

        return {
          fixture,
          homeTeam,
          awayTeam,
          homePos,
          awayPos,
          homeElo: eloRatings[fixture.teams.home.id] || 1500,
          awayElo: eloRatings[fixture.teams.away.id] || 1500,
          ...prediction,
        };
      });

      setPredictions(matchPredictions);

      // Run season simulation
      const projection = simulateSeason(standingsData, fixturesData, 500);
      setSeasonProjection(projection);
    } catch (error) {
      console.error("Error loading AI predictions:", error);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const getSelectedTeamProjection = () => {
    return seasonProjection.find((p) => p.team.id === selectedTeam.id);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  const getResultColor = (probability) => {
    if (probability >= 50) return "text-green-400";
    if (probability >= 35) return "text-yellow-400";
    return "text-gray-400";
  };

  const getConfidenceLabel = (confidence) => {
    if (confidence >= 60) return { label: "High", color: "green" };
    if (confidence >= 45) return { label: "Medium", color: "yellow" };
    return { label: "Low", color: "gray" };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
        <span className="ml-3 text-gray-300">Running AI predictions...</span>
      </div>
    );
  }

  const selectedTeamProjection = getSelectedTeamProjection();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-6 text-center">
        <h2 className="flex items-center justify-center gap-2 mb-2 text-2xl font-bold text-white">
          <Brain className="w-6 h-6 text-purple-400" />
          AI Season Predictions
        </h2>
        <p className="text-gray-400">
          Powered by statistical analysis & Monte Carlo simulation
        </p>
      </div>

      {/* Selected Team Projection Card */}
      {selectedTeamProjection && (
        <div className="p-6 border rounded-xl bg-gradient-to-r from-purple-900/50 via-slate-900 to-purple-900/50 border-purple-500/30">
          <div className="flex items-center gap-4 mb-6">
            <img
              src={selectedTeam.logo}
              alt={selectedTeam.name}
              className="w-16 h-16"
            />
            <div>
              <h3 className="text-xl font-bold text-white">
                {selectedTeam.name}
              </h3>
              <p className="text-purple-400">Season Projection</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {/* Projected Position */}
            <div className="p-4 rounded-lg bg-black/30">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-4 h-4 text-blue-400" />
                <span className="text-xs text-gray-400">Projected Finish</span>
              </div>
              <p className="text-3xl font-bold text-white">
                {selectedTeamProjection.mostLikelyPosition}
                <span className="text-lg text-gray-400">
                  {selectedTeamProjection.mostLikelyPosition === 1
                    ? "st"
                    : selectedTeamProjection.mostLikelyPosition === 2
                    ? "nd"
                    : selectedTeamProjection.mostLikelyPosition === 3
                    ? "rd"
                    : "th"}
                </span>
              </p>
            </div>

            {/* Projected Points */}
            <div className="p-4 rounded-lg bg-black/30">
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="w-4 h-4 text-green-400" />
                <span className="text-xs text-gray-400">Projected Points</span>
              </div>
              <p className="text-3xl font-bold text-white">
                {selectedTeamProjection.avgPoints}
              </p>
            </div>

            {/* Top 4 Probability */}
            <div className="p-4 rounded-lg bg-black/30">
              <div className="flex items-center gap-2 mb-2">
                <Award className="w-4 h-4 text-yellow-400" />
                <span className="text-xs text-gray-400">Top 4 Chance</span>
              </div>
              <p className="text-3xl font-bold text-white">
                {selectedTeamProjection.top4Probability}
                <span className="text-lg text-gray-400">%</span>
              </p>
            </div>

            {/* Title / Relegation */}
            <div className="p-4 rounded-lg bg-black/30">
              {selectedTeamProjection.titleProbability > 5 ? (
                <>
                  <div className="flex items-center gap-2 mb-2">
                    <Trophy className="w-4 h-4 text-yellow-400" />
                    <span className="text-xs text-gray-400">Title Chance</span>
                  </div>
                  <p className="text-3xl font-bold text-yellow-400">
                    {selectedTeamProjection.titleProbability}
                    <span className="text-lg">%</span>
                  </p>
                </>
              ) : selectedTeamProjection.relegationProbability > 5 ? (
                <>
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-4 h-4 text-red-400" />
                    <span className="text-xs text-gray-400">
                      Relegation Risk
                    </span>
                  </div>
                  <p className="text-3xl font-bold text-red-400">
                    {selectedTeamProjection.relegationProbability}
                    <span className="text-lg">%</span>
                  </p>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="w-4 h-4 text-green-400" />
                    <span className="text-xs text-gray-400">Safe</span>
                  </div>
                  <p className="text-xl font-bold text-green-400">
                    Mid-table likely
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab Selector */}
      <div className="flex justify-center gap-2">
        <button
          onClick={() => setActiveTab("matches")}
          className={`px-4 py-2 rounded-lg font-semibold transition-all flex items-center gap-2 ${
            activeTab === "matches"
              ? "bg-purple-600 text-white"
              : "bg-white/10 text-gray-400 hover:bg-white/20"
          }`}
        >
          <Calendar className="w-4 h-4" />
          Match Predictions
        </button>
        <button
          onClick={() => setActiveTab("season")}
          className={`px-4 py-2 rounded-lg font-semibold transition-all flex items-center gap-2 ${
            activeTab === "season"
              ? "bg-purple-600 text-white"
              : "bg-white/10 text-gray-400 hover:bg-white/20"
          }`}
        >
          <Trophy className="w-4 h-4" />
          Season Projection
        </button>
      </div>

      {/* Match Predictions Tab */}
      {activeTab === "matches" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-lg font-semibold text-white">
              <Sparkles className="w-5 h-5 text-yellow-400" />
              Upcoming Match Predictions
            </h3>
            <span className="text-xs text-gray-400">
              Based on Elo ratings & form
            </span>
          </div>

          {predictions.map((pred, index) => {
            const isExpanded = expandedMatch === index;
            const isSelectedTeamMatch =
              pred.fixture.teams.home.id === selectedTeam.id ||
              pred.fixture.teams.away.id === selectedTeam.id;
            const confidenceInfo = getConfidenceLabel(pred.confidence);

            return (
              <div
                key={pred.fixture.fixture.id}
                className={`rounded-xl border overflow-hidden transition-all ${
                  isSelectedTeamMatch
                    ? "bg-purple-600/20 border-purple-500/50"
                    : "bg-white/5 border-white/10"
                }`}
              >
                {/* Match Header */}
                <div
                  className="p-4 transition-all cursor-pointer hover:bg-white/5"
                  onClick={() => setExpandedMatch(isExpanded ? null : index)}
                >
                  <div className="flex items-center justify-between mb-3">
                    {/* Home Team */}
                    <div className="flex items-center flex-1 gap-3">
                      <img
                        src={pred.fixture.teams.home.logo}
                        alt=""
                        className="w-10 h-10"
                      />
                      <div>
                        <p className="font-semibold text-white">
                          {pred.fixture.teams.home.name}
                        </p>
                        <p className="text-xs text-gray-400">
                          {pred.homePos}th • Elo: {pred.homeElo}
                        </p>
                      </div>
                    </div>

                    {/* Predicted Score */}
                    <div className="flex flex-col items-center px-6">
                      <div className="flex items-center gap-2 text-2xl font-bold">
                        <span
                          className={
                            pred.homeWin > pred.awayWin
                              ? "text-green-400"
                              : "text-white"
                          }
                        >
                          {pred.predictedScore.home}
                        </span>
                        <span className="text-gray-500">-</span>
                        <span
                          className={
                            pred.awayWin > pred.homeWin
                              ? "text-green-400"
                              : "text-white"
                          }
                        >
                          {pred.predictedScore.away}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500">
                        {formatDate(pred.fixture.fixture.date)}
                      </span>
                    </div>

                    {/* Away Team */}
                    <div className="flex items-center justify-end flex-1 gap-3">
                      <div className="text-right">
                        <p className="font-semibold text-white">
                          {pred.fixture.teams.away.name}
                        </p>
                        <p className="text-xs text-gray-400">
                          {pred.awayPos}th • Elo: {pred.awayElo}
                        </p>
                      </div>
                      <img
                        src={pred.fixture.teams.away.logo}
                        alt=""
                        className="w-10 h-10"
                      />
                    </div>

                    {/* Expand Icon */}
                    <div className="ml-4">
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                  </div>

                  {/* Probability Bar */}
                  <div className="flex h-2 overflow-hidden rounded-full bg-black/30">
                    <div
                      className="transition-all bg-blue-500"
                      style={{ width: `${pred.homeWin}%` }}
                    />
                    <div
                      className="transition-all bg-gray-500"
                      style={{ width: `${pred.draw}%` }}
                    />
                    <div
                      className="transition-all bg-purple-500"
                      style={{ width: `${pred.awayWin}%` }}
                    />
                  </div>

                  {/* Probability Labels */}
                  <div className="flex justify-between mt-2 text-xs">
                    <span className={getResultColor(pred.homeWin)}>
                      Home {pred.homeWin}%
                    </span>
                    <span className="text-gray-400">Draw {pred.draw}%</span>
                    <span className={getResultColor(pred.awayWin)}>
                      Away {pred.awayWin}%
                    </span>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="p-4 border-t border-white/10 bg-black/20">
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                      <div className="p-3 rounded-lg bg-white/5">
                        <p className="mb-1 text-xs text-gray-400">Confidence</p>
                        <p
                          className={`font-bold text-${confidenceInfo.color}-400`}
                        >
                          {confidenceInfo.label} ({pred.confidence}%)
                        </p>
                      </div>
                      <div className="p-3 rounded-lg bg-white/5">
                        <p className="mb-1 text-xs text-gray-400">
                          Most Likely
                        </p>
                        <p className="font-bold text-white">
                          {pred.homeWin > pred.awayWin &&
                          pred.homeWin > pred.draw
                            ? `${pred.fixture.teams.home.name} Win`
                            : pred.awayWin > pred.draw
                            ? `${pred.fixture.teams.away.name} Win`
                            : "Draw"}
                        </p>
                      </div>
                      <div className="p-3 rounded-lg bg-white/5">
                        <p className="mb-1 text-xs text-gray-400">Home Elo</p>
                        <p className="font-bold text-blue-400">
                          {pred.homeElo}
                        </p>
                      </div>
                      <div className="p-3 rounded-lg bg-white/5">
                        <p className="mb-1 text-xs text-gray-400">Away Elo</p>
                        <p className="font-bold text-purple-400">
                          {pred.awayElo}
                        </p>
                      </div>
                    </div>

                    {/* Key Factors */}
                    <div className="p-3 mt-4 border rounded-lg bg-purple-600/10 border-purple-500/20">
                      <p className="mb-2 text-sm font-semibold text-purple-400">
                        <Zap className="inline w-4 h-4 mr-1" />
                        Key Factors
                      </p>
                      <ul className="space-y-1 text-sm text-gray-300">
                        <li>
                          • Elo difference:{" "}
                          {pred.homeElo - pred.awayElo > 0 ? "+" : ""}
                          {pred.homeElo - pred.awayElo} (home advantage
                          included)
                        </li>
                        <li>
                          • Position gap:{" "}
                          {Math.abs(pred.homePos - pred.awayPos)} places
                        </li>
                        {pred.homeTeam?.form && (
                          <li>• Home form: {pred.homeTeam.form.slice(0, 5)}</li>
                        )}
                        {pred.awayTeam?.form && (
                          <li>• Away form: {pred.awayTeam.form.slice(0, 5)}</li>
                        )}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Season Projection Tab */}
      {activeTab === "season" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-lg font-semibold text-white">
              <Trophy className="w-5 h-5 text-yellow-400" />
              Predicted Final Table
            </h3>
            <span className="text-xs text-gray-400">
              Based on 500 Monte Carlo simulations
            </span>
          </div>

          <div className="overflow-hidden border rounded-xl border-white/10">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-400 border-b border-white/10 bg-white/5">
                  <th className="px-4 py-3 text-left">Pos</th>
                  <th className="px-4 py-3 text-left">Team</th>
                  <th className="px-2 py-3 text-center">Pts</th>
                  <th className="hidden px-2 py-3 text-center md:table-cell">
                    <Trophy className="inline w-4 h-4 text-yellow-400" />
                  </th>
                  <th className="px-2 py-3 text-center">
                    <Award className="inline w-4 h-4 text-blue-400" />
                  </th>
                  <th className="hidden px-2 py-3 text-center md:table-cell">
                    <AlertTriangle className="inline w-4 h-4 text-red-400" />
                  </th>
                </tr>
              </thead>
              <tbody>
                {seasonProjection.map((team, index) => {
                  const position = index + 1;
                  const isSelectedTeam = team.team.id === selectedTeam.id;

                  return (
                    <tr
                      key={team.team.id}
                      className={`border-b border-white/5 transition-all ${
                        isSelectedTeam
                          ? "bg-purple-600/20"
                          : position <= 4
                          ? "bg-blue-600/5"
                          : position >= 18
                          ? "bg-red-600/5"
                          : ""
                      }`}
                    >
                      <td className="px-4 py-3">
                        <span
                          className={`font-bold ${
                            position === 1
                              ? "text-yellow-400"
                              : position <= 4
                              ? "text-blue-400"
                              : position >= 18
                              ? "text-red-400"
                              : "text-gray-300"
                          }`}
                        >
                          {position}
                        </span>
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
                      <td className="px-2 py-3 font-bold text-center text-white">
                        {team.avgPoints}
                      </td>
                      <td className="hidden px-2 py-3 text-center md:table-cell">
                        {team.titleProbability > 0 && (
                          <span className="font-semibold text-yellow-400">
                            {team.titleProbability}%
                          </span>
                        )}
                      </td>
                      <td className="px-2 py-3 text-center">
                        <span
                          className={`font-semibold ${
                            team.top4Probability >= 50
                              ? "text-green-400"
                              : team.top4Probability >= 20
                              ? "text-yellow-400"
                              : "text-gray-400"
                          }`}
                        >
                          {team.top4Probability}%
                        </span>
                      </td>
                      <td className="hidden px-2 py-3 text-center md:table-cell">
                        {team.relegationProbability > 0 && (
                          <span className="font-semibold text-red-400">
                            {team.relegationProbability}%
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Legend */}
          <div className="p-4 border rounded-xl bg-white/5 border-white/10">
            <h4 className="mb-3 text-sm font-semibold text-gray-400">Legend</h4>
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-yellow-400" />
                <span className="text-gray-300">Title Probability</span>
              </div>
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-blue-400" />
                <span className="text-gray-300">Top 4 (Champions League)</span>
              </div>
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400" />
                <span className="text-gray-300">Relegation Risk</span>
              </div>
            </div>
          </div>

          {/* How It Works */}
          <div className="p-4 border rounded-xl bg-purple-600/10 border-purple-500/20">
            <h4 className="flex items-center gap-2 mb-2 text-sm font-semibold text-purple-400">
              <Brain className="w-4 h-4" />
              How AI Predictions Work
            </h4>
            <ul className="space-y-1 text-sm text-gray-300">
              <li>
                • <strong>Elo Ratings:</strong> Calculated from position,
                points, goal difference & form
              </li>
              <li>
                • <strong>Home Advantage:</strong> +65 Elo points for home team
              </li>
              <li>
                • <strong>Monte Carlo:</strong> 500 simulations of remaining
                season
              </li>
              <li>
                • <strong>Probabilities:</strong> % of simulations where outcome
                occurred
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

export default AIPredictions;
