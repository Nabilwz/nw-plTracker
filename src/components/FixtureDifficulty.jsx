import { useState, useEffect, useCallback } from "react";
import { fetchStandings, fetchTeamFixtures } from "../services/footballApi";
import {
  Calendar,
  Clock,
  Home,
  Plane,
  TrendingUp,
  TrendingDown,
  Minus,
  Loader2,
  ChevronDown,
  ChevronUp,
  Target,
  AlertTriangle,
  Shield,
  Flame,
} from "lucide-react";

// ========== HELPER FUNCTIONS ==========

const getOrdinalSuffix = (num) => {
  const j = num % 10;
  const k = num % 100;
  if (j === 1 && k !== 11) return num + "st";
  if (j === 2 && k !== 12) return num + "nd";
  if (j === 3 && k !== 13) return num + "rd";
  return num + "th";
};

const calculateDifficultyRating = (opponentPosition, isHome, opponentForm) => {
  // Base difficulty from position (1-10 scale)
  let difficulty;

  if (opponentPosition <= 2) {
    difficulty = 10; // Top 2 = Very Hard
  } else if (opponentPosition <= 4) {
    difficulty = 9; // Top 4 = Hard
  } else if (opponentPosition <= 6) {
    difficulty = 8; // Top 6 = Medium-Hard
  } else if (opponentPosition <= 10) {
    difficulty = 6; // Mid-table upper = Medium
  } else if (opponentPosition <= 14) {
    difficulty = 4; // Mid-table lower = Medium-Easy
  } else if (opponentPosition <= 17) {
    difficulty = 3; // Lower table = Easy
  } else {
    difficulty = 2; // Bottom 3 = Very Easy
  }

  // Home/Away adjustment
  if (!isHome) {
    difficulty += 1; // Away games are harder
  } else {
    difficulty -= 0.5; // Home games are slightly easier
  }

  // Form adjustment (optional, if form data available)
  if (opponentForm) {
    const formPoints = calculateFormPoints(opponentForm);
    if (formPoints >= 12) {
      difficulty += 1; // Hot form
    } else if (formPoints <= 5) {
      difficulty -= 1; // Poor form
    }
  }

  // Clamp between 1-10
  return Math.max(1, Math.min(10, difficulty));
};

const calculateFormPoints = (formString) => {
  if (!formString) return 7.5; // Default middle value

  let points = 0;
  for (const result of formString) {
    if (result === "W") points += 3;
    else if (result === "D") points += 1;
  }
  return points;
};

const getDifficultyLabel = (rating) => {
  if (rating >= 8.5) return { label: "Very Hard", color: "red", icon: Flame };
  if (rating >= 7)
    return { label: "Hard", color: "orange", icon: AlertTriangle };
  if (rating >= 5) return { label: "Medium", color: "yellow", icon: Target };
  if (rating >= 3) return { label: "Easy", color: "green", icon: Shield };
  return { label: "Very Easy", color: "emerald", icon: Shield };
};

const getDifficultyColorClasses = (rating) => {
  if (rating >= 8.5) {
    return {
      bg: "bg-red-600/20",
      border: "border-red-500/50",
      text: "text-red-400",
      bar: "bg-red-500",
    };
  }
  if (rating >= 7) {
    return {
      bg: "bg-orange-600/20",
      border: "border-orange-500/50",
      text: "text-orange-400",
      bar: "bg-orange-500",
    };
  }
  if (rating >= 5) {
    return {
      bg: "bg-yellow-600/20",
      border: "border-yellow-500/50",
      text: "text-yellow-400",
      bar: "bg-yellow-500",
    };
  }
  if (rating >= 3) {
    return {
      bg: "bg-green-600/20",
      border: "border-green-500/50",
      text: "text-green-400",
      bar: "bg-green-500",
    };
  }
  return {
    bg: "bg-emerald-600/20",
    border: "border-emerald-500/50",
    text: "text-emerald-400",
    bar: "bg-emerald-500",
  };
};

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
};

const formatTime = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

// ========== COMPONENT ==========

function FixtureDifficulty({ selectedTeam }) {
  const [fixtures, setFixtures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAllFixtures, setShowAllFixtures] = useState(false);
  const [fixtureCount, setFixtureCount] = useState(5);

  const loadData = useCallback(async () => {
    setLoading(true);

    try {
      const [standingsData, fixturesData] = await Promise.all([
        fetchStandings(),
        fetchTeamFixtures(selectedTeam.id, 10),
      ]);

      // Process fixtures with difficulty ratings
      const processedFixtures = fixturesData.map((fixture) => {
        const isHome = fixture.teams.home.id === selectedTeam.id;
        const opponent = isHome ? fixture.teams.away : fixture.teams.home;

        // Find opponent in standings
        const opponentStanding = standingsData.find(
          (team) => team.team.id === opponent.id
        );
        const opponentPosition = opponentStanding
          ? standingsData.indexOf(opponentStanding) + 1
          : 10; // Default to mid-table if not found

        const opponentForm = opponentStanding?.form || null;
        const opponentPoints = opponentStanding?.points || 0;
        const opponentGD = opponentStanding?.goalsDiff || 0;

        const difficultyRating = calculateDifficultyRating(
          opponentPosition,
          isHome,
          opponentForm
        );

        return {
          ...fixture,
          isHome,
          opponent,
          opponentPosition,
          opponentForm,
          opponentPoints,
          opponentGD,
          difficultyRating,
        };
      });

      setFixtures(processedFixtures);
    } catch (error) {
      console.error("Error loading fixture difficulty:", error);
    }

    setLoading(false);
  }, [selectedTeam]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Calculate overall difficulty
  const displayedFixtures = showAllFixtures
    ? fixtures
    : fixtures.slice(0, fixtureCount);

  const averageDifficulty =
    displayedFixtures.length > 0
      ? displayedFixtures.reduce((sum, f) => sum + f.difficultyRating, 0) /
        displayedFixtures.length
      : 0;

  const overallDifficulty = getDifficultyLabel(averageDifficulty);
  const overallColors = getDifficultyColorClasses(averageDifficulty);

  // Count by difficulty
  const difficultyCounts = {
    hard: displayedFixtures.filter((f) => f.difficultyRating >= 7).length,
    medium: displayedFixtures.filter(
      (f) => f.difficultyRating >= 5 && f.difficultyRating < 7
    ).length,
    easy: displayedFixtures.filter((f) => f.difficultyRating < 5).length,
  };

  // Home vs Away
  const homeGames = displayedFixtures.filter((f) => f.isHome).length;
  const awayGames = displayedFixtures.filter((f) => !f.isHome).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
        <span className="ml-3 text-gray-300">
          Analyzing fixture difficulty...
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-6 text-center">
        <h2 className="mb-2 text-2xl font-bold text-white">
          Fixture Difficulty for {selectedTeam.name}
        </h2>
        <p className="text-gray-400">
          Analyzing the next {displayedFixtures.length} Premier League matches
        </p>
      </div>

      {/* Fixture Count Selector */}
      <div className="flex justify-center gap-2">
        {[5, 10].map((count) => (
          <button
            key={count}
            onClick={() => {
              setFixtureCount(count);
              setShowAllFixtures(count === 10);
            }}
            className={`px-4 py-2 rounded-lg font-semibold transition-all ${
              fixtureCount === count
                ? "bg-purple-600 text-white"
                : "bg-white/10 text-gray-400 hover:bg-white/20"
            }`}
          >
            Next {count}
          </button>
        ))}
      </div>

      {/* Overall Difficulty Card */}
      <div
        className={`p-6 rounded-xl border ${overallColors.bg} ${overallColors.border}`}
      >
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          {/* Overall Rating */}
          <div className="flex items-center gap-4">
            <div
              className={`w-20 h-20 rounded-full flex items-center justify-center ${overallColors.bg} border-2 ${overallColors.border}`}
            >
              <span className={`text-3xl font-bold ${overallColors.text}`}>
                {averageDifficulty.toFixed(1)}
              </span>
            </div>
            <div>
              <p className="text-sm text-gray-400">Overall Difficulty</p>
              <p className={`text-2xl font-bold ${overallColors.text}`}>
                {overallDifficulty.label}
              </p>
              <p className="text-xs text-gray-500">
                Based on opponent positions & venue
              </p>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-3 rounded-lg bg-black/20">
              <p className="text-2xl font-bold text-red-400">
                {difficultyCounts.hard}
              </p>
              <p className="text-xs text-gray-400">Hard</p>
            </div>
            <div className="p-3 rounded-lg bg-black/20">
              <p className="text-2xl font-bold text-yellow-400">
                {difficultyCounts.medium}
              </p>
              <p className="text-xs text-gray-400">Medium</p>
            </div>
            <div className="p-3 rounded-lg bg-black/20">
              <p className="text-2xl font-bold text-green-400">
                {difficultyCounts.easy}
              </p>
              <p className="text-xs text-gray-400">Easy</p>
            </div>
          </div>

          {/* Home/Away Split */}
          <div className="flex gap-4">
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600/20">
              <Home className="w-4 h-4 text-blue-400" />
              <span className="font-bold text-blue-400">{homeGames}</span>
              <span className="text-xs text-gray-400">Home</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600/20">
              <Plane className="w-4 h-4 text-purple-400" />
              <span className="font-bold text-purple-400">{awayGames}</span>
              <span className="text-xs text-gray-400">Away</span>
            </div>
          </div>
        </div>

        {/* Difficulty Bar */}
        <div className="mt-6">
          <div className="flex justify-between mb-2 text-xs text-gray-400">
            <span>Easier</span>
            <span>Harder</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-white/10">
            <div
              className={`h-full transition-all duration-500 ${overallColors.bar}`}
              style={{ width: `${(averageDifficulty / 10) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Fixture List */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-white">Upcoming Fixtures</h3>

        {displayedFixtures.map((fixture, index) => {
          const colors = getDifficultyColorClasses(fixture.difficultyRating);
          const diffLabel = getDifficultyLabel(fixture.difficultyRating);
          const DiffIcon = diffLabel.icon;

          return (
            <div
              key={fixture.fixture.id}
              className={`p-4 rounded-xl border ${colors.bg} ${colors.border} transition-all hover:scale-[1.01]`}
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                {/* Match Number & Date */}
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-8 h-8 text-sm font-bold text-gray-400 rounded-full bg-white/10">
                    {index + 1}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(fixture.fixture.date)}</span>
                      <Clock className="w-4 h-4 ml-2" />
                      <span>{formatTime(fixture.fixture.date)}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      {fixture.isHome ? (
                        <span className="flex items-center gap-1 text-xs text-blue-400">
                          <Home className="w-3 h-3" /> HOME
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs text-purple-400">
                          <Plane className="w-3 h-3" /> AWAY
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Opponent */}
                <div className="flex items-center gap-3">
                  <img
                    src={fixture.opponent.logo}
                    alt={fixture.opponent.name}
                    className="w-10 h-10"
                  />
                  <div>
                    <p className="font-semibold text-white">
                      {fixture.isHome ? "vs" : "@"} {fixture.opponent.name}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <span>{getOrdinalSuffix(fixture.opponentPosition)}</span>
                      <span>•</span>
                      <span>{fixture.opponentPoints} pts</span>
                      <span>•</span>
                      <span>
                        GD: {fixture.opponentGD > 0 ? "+" : ""}
                        {fixture.opponentGD}
                      </span>
                      {fixture.opponentForm && (
                        <>
                          <span>•</span>
                          <span className="flex gap-0.5">
                            {fixture.opponentForm
                              .split("")
                              .slice(0, 5)
                              .map((result, i) => (
                                <span
                                  key={i}
                                  className={`w-4 h-4 rounded-sm flex items-center justify-center text-[10px] font-bold ${
                                    result === "W"
                                      ? "bg-green-600 text-white"
                                      : result === "D"
                                      ? "bg-gray-500 text-white"
                                      : "bg-red-600 text-white"
                                  }`}
                                >
                                  {result}
                                </span>
                              ))}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Difficulty Rating */}
                <div className="flex items-center gap-3">
                  <div className="w-24">
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-xs font-semibold ${colors.text}`}>
                        {diffLabel.label}
                      </span>
                      <span className={`text-sm font-bold ${colors.text}`}>
                        {fixture.difficultyRating.toFixed(1)}
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-white/10">
                      <div
                        className={`h-full ${colors.bar}`}
                        style={{
                          width: `${(fixture.difficultyRating / 10) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                  <DiffIcon className={`w-5 h-5 ${colors.text}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="p-4 border rounded-xl bg-white/5 border-white/10">
        <h4 className="mb-3 text-sm font-semibold text-gray-400">
          Difficulty Rating Guide
        </h4>
        <div className="grid grid-cols-2 gap-3 text-sm md:grid-cols-5">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full" />
            <span className="text-gray-300">8.5-10: Very Hard</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-orange-500 rounded-full" />
            <span className="text-gray-300">7-8.4: Hard</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-yellow-500 rounded-full" />
            <span className="text-gray-300">5-6.9: Medium</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full" />
            <span className="text-gray-300">3-4.9: Easy</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-500" />
            <span className="text-gray-300">1-2.9: Very Easy</span>
          </div>
        </div>
        <p className="mt-3 text-xs text-gray-500">
          💡 Ratings based on opponent league position, home/away venue, and
          current form. Away games add +1 difficulty, home games reduce by 0.5.
        </p>
      </div>

      {/* Points Projection */}
      <div className="p-6 border rounded-xl bg-purple-600/20 border-purple-500/30">
        <h3 className="flex items-center gap-2 mb-4 text-lg font-bold text-white">
          <Target className="w-5 h-5 text-purple-400" />
          Points Projection
        </h3>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {/* Best Case */}
          <div className="p-4 border rounded-lg bg-green-600/20 border-green-500/30">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-green-400" />
              <span className="text-sm font-semibold text-green-400">
                Best Case
              </span>
            </div>
            <p className="text-2xl font-bold text-white">
              +{displayedFixtures.length * 3} pts
            </p>
            <p className="text-xs text-gray-400">
              Win all {displayedFixtures.length} games
            </p>
          </div>

          {/* Expected */}
          <div className="p-4 border rounded-lg bg-yellow-600/20 border-yellow-500/30">
            <div className="flex items-center gap-2 mb-2">
              <Minus className="w-4 h-4 text-yellow-400" />
              <span className="text-sm font-semibold text-yellow-400">
                Expected
              </span>
            </div>
            <p className="text-2xl font-bold text-white">
              +
              {Math.round(
                displayedFixtures.reduce((sum, f) => {
                  // Expected points based on difficulty
                  const winProb = Math.max(0.1, 1 - f.difficultyRating / 12);
                  const drawProb = 0.25;
                  return sum + winProb * 3 + drawProb * 1;
                }, 0)
              )}{" "}
              pts
            </p>
            <p className="text-xs text-gray-400">Based on fixture difficulty</p>
          </div>

          {/* Worst Case */}
          <div className="p-4 border rounded-lg bg-red-600/20 border-red-500/30">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="w-4 h-4 text-red-400" />
              <span className="text-sm font-semibold text-red-400">
                Worst Case
              </span>
            </div>
            <p className="text-2xl font-bold text-white">+0 pts</p>
            <p className="text-xs text-gray-400">
              Lose all {displayedFixtures.length} games
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FixtureDifficulty;
