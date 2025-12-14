import { useState, useEffect, useCallback } from "react";
import {
  fetchStandings,
  fetchTeamFixtures,
  fetchCurrentRound,
  fetchFixtures,
} from "../services/footballApi";
import {
  Swords,
  TrendingUp,
  TrendingDown,
  Minus,
  Calendar,
  Clock,
  Home,
  Plane,
  Loader2,
  Target,
  AlertTriangle,
  PartyPopper,
  Frown,
  Trophy,
  ChevronRight,
  Settings,
} from "lucide-react";
import RivalSelector from "./RivalSelector";

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

const formatTime = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const calculateDifficultyRating = (opponentPosition, isHome) => {
  let difficulty;

  if (opponentPosition <= 2) difficulty = 10;
  else if (opponentPosition <= 4) difficulty = 9;
  else if (opponentPosition <= 6) difficulty = 8;
  else if (opponentPosition <= 10) difficulty = 6;
  else if (opponentPosition <= 14) difficulty = 4;
  else if (opponentPosition <= 17) difficulty = 3;
  else difficulty = 2;

  if (!isHome) difficulty += 1;
  else difficulty -= 0.5;

  return Math.max(1, Math.min(10, difficulty));
};

// const getDifficultyLabel = (rating) => {
//   if (rating >= 8.5) return { label: "Very Hard", color: "red" };
//   if (rating >= 7) return { label: "Hard", color: "orange" };
//   if (rating >= 5) return { label: "Medium", color: "yellow" };
//   if (rating >= 3) return { label: "Easy", color: "green" };
//   return { label: "Very Easy", color: "emerald" };
// };

// ========== COMPONENT ==========

function RivalTracker({ selectedTeam }) {
  const [rival, setRival] = useState(null);
  const [standings, setStandings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rivalFixtures, setRivalFixtures] = useState([]);
  const [currentRoundFixtures, setCurrentRoundFixtures] = useState([]);
  const [showRivalSelector, setShowRivalSelector] = useState(false);

  // Load rival from localStorage
  useEffect(() => {
    const savedRival = localStorage.getItem(`rival_${selectedTeam.id}`);
    if (savedRival) {
      setRival(JSON.parse(savedRival));
    }
  }, [selectedTeam.id]);

  // Save rival to localStorage
  const handleRivalSelect = (team) => {
    setRival(team);
    localStorage.setItem(`rival_${selectedTeam.id}`, JSON.stringify(team));
  };

  const loadData = useCallback(async () => {
    if (!rival) {
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const [standingsData, rivalFixturesData, currentRound] =
        await Promise.all([
          fetchStandings(),
          fetchTeamFixtures(rival.id, 5),
          fetchCurrentRound(),
        ]);

      setStandings(standingsData);

      // Process rival fixtures
      const processedFixtures = rivalFixturesData.map((fixture) => {
        const isHome = fixture.teams.home.id === rival.id;
        const opponent = isHome ? fixture.teams.away : fixture.teams.home;

        const opponentStanding = standingsData.find(
          (team) => team.team.id === opponent.id
        );
        const opponentPosition = opponentStanding
          ? standingsData.indexOf(opponentStanding) + 1
          : 10;

        const difficulty = calculateDifficultyRating(opponentPosition, isHome);

        return {
          ...fixture,
          isHome,
          opponent,
          opponentPosition,
          difficulty,
          opponentPoints: opponentStanding?.points || 0,
        };
      });

      setRivalFixtures(processedFixtures);

      // Fetch current round fixtures for scenarios
      if (currentRound) {
        const roundFixtures = await fetchFixtures(currentRound);
        const pendingFixtures = roundFixtures.filter((f) => {
          const status = f.fixture?.status?.short;
          return !["FT", "AET", "PEN", "CANC", "ABD", "AWD", "WO"].includes(
            status
          );
        });
        setCurrentRoundFixtures(pendingFixtures);
      }
    } catch (error) {
      console.error("Error loading rival data:", error);
    }

    setLoading(false);
  }, [rival]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Get team data from standings
  const getTeamData = (teamId) => {
    const team = standings.find((t) => t.team.id === teamId);
    if (!team) return null;
    return {
      ...team,
      position: standings.indexOf(team) + 1,
    };
  };

  const selectedTeamData = getTeamData(selectedTeam.id);
  const rivalData = rival ? getTeamData(rival.id) : null;

  // Calculate gap
  const pointsGap =
    selectedTeamData && rivalData
      ? selectedTeamData.points - rivalData.points
      : 0;

  //   const positionGap =
  //     selectedTeamData && rivalData
  //       ? rivalData.position - selectedTeamData.position
  //       : 0;

  //   // Find rival's match in current round
  //   const rivalCurrentMatch = currentRoundFixtures.find(
  //     (f) => f.teams.home.id === rival?.id || f.teams.away.id === rival?.id
  //   );

  // Calculate scenarios that hurt rival
  const hurtRivalScenarios = currentRoundFixtures
    .filter(
      (f) => f.teams.home.id === rival?.id || f.teams.away.id === rival?.id
    )
    .map((fixture) => {
      const isRivalHome = fixture.teams.home.id === rival.id;
      const opponent = isRivalHome ? fixture.teams.away : fixture.teams.home;

      return {
        fixture,
        recommendation: `${opponent.name} WIN`,
        reason: `${rival.name} drops 3 points, helping you ${
          pointsGap < 0 ? "close the gap" : "extend your lead"
        }!`,
      };
    });

  // No rival selected
  if (!rival) {
    return (
      <div className="space-y-6">
        <div className="mb-6 text-center">
          <h2 className="mb-2 text-2xl font-bold text-white">Rival Tracker</h2>
          <p className="text-gray-400">
            Track your biggest rival and celebrate their losses! 😈
          </p>
        </div>

        <div className="flex flex-col items-center justify-center py-16">
          <div className="flex items-center justify-center w-24 h-24 mb-6 border rounded-full bg-red-600/20 border-red-500/30">
            <Swords className="w-12 h-12 text-red-400" />
          </div>
          <h3 className="mb-2 text-xl font-bold text-white">
            No Rival Selected
          </h3>
          <p className="max-w-md mb-6 text-center text-gray-400">
            Pick your team's biggest rival to track their fixtures, see
            scenarios that hurt them, and monitor the points gap!
          </p>
          <button
            onClick={() => setShowRivalSelector(true)}
            className="px-6 py-3 font-semibold text-white transition-all shadow-lg rounded-xl bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 hover:shadow-red-500/25"
          >
            <span className="flex items-center gap-2">
              <Swords className="w-5 h-5" />
              Choose Your Rival
            </span>
          </button>
        </div>

        <RivalSelector
          isOpen={showRivalSelector}
          onClose={() => setShowRivalSelector(false)}
          onSelect={handleRivalSelect}
          currentTeamId={selectedTeam.id}
          currentRivalId={null}
        />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-red-400 animate-spin" />
        <span className="ml-3 text-gray-300">Loading rival data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-6 text-center">
        <h2 className="mb-2 text-2xl font-bold text-white">Rival Tracker</h2>
        <p className="text-gray-400">
          Tracking scenarios that hurt{" "}
          <span className="font-bold text-red-400">{rival.name}</span> 😈
        </p>
      </div>

      {/* Head to Head Card */}
      <div className="p-6 border rounded-xl bg-gradient-to-r from-purple-900/50 via-slate-900 to-red-900/50 border-white/10">
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          {/* Your Team */}
          <div className="flex items-center gap-4">
            <img
              src={selectedTeam.logo}
              alt={selectedTeam.name}
              className="w-16 h-16"
            />
            <div>
              <p className="text-sm text-gray-400">Your Team</p>
              <p className="text-xl font-bold text-white">
                {selectedTeam.name}
              </p>
              <div className="flex items-center gap-2 mt-1 text-sm">
                <span className="font-semibold text-purple-400">
                  {getOrdinalSuffix(selectedTeamData?.position || 0)}
                </span>
                <span className="text-gray-500">•</span>
                <span className="font-bold text-white">
                  {selectedTeamData?.points || 0} pts
                </span>
              </div>
            </div>
          </div>

          {/* VS & Gap */}
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-4">
              <Swords className="w-8 h-8 text-red-400" />
            </div>
            <div className="mt-2 text-center">
              <p className="text-xs text-gray-500 uppercase">Points Gap</p>
              <p
                className={`text-3xl font-bold ${
                  pointsGap > 0
                    ? "text-green-400"
                    : pointsGap < 0
                    ? "text-red-400"
                    : "text-gray-400"
                }`}
              >
                {pointsGap > 0 ? "+" : ""}
                {pointsGap}
              </p>
              <div className="flex items-center justify-center gap-1 mt-1">
                {pointsGap > 0 ? (
                  <>
                    <TrendingUp className="w-4 h-4 text-green-400" />
                    <span className="text-xs text-green-400">
                      You're ahead!
                    </span>
                  </>
                ) : pointsGap < 0 ? (
                  <>
                    <TrendingDown className="w-4 h-4 text-red-400" />
                    <span className="text-xs text-red-400">They're ahead</span>
                  </>
                ) : (
                  <>
                    <Minus className="w-4 h-4 text-gray-400" />
                    <span className="text-xs text-gray-400">Level</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Rival Team */}
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm text-gray-400">Your Rival</p>
              <p className="text-xl font-bold text-white">{rival.name}</p>
              <div className="flex items-center justify-end gap-2 mt-1 text-sm">
                <span className="font-semibold text-red-400">
                  {getOrdinalSuffix(rivalData?.position || 0)}
                </span>
                <span className="text-gray-500">•</span>
                <span className="font-bold text-white">
                  {rivalData?.points || 0} pts
                </span>
              </div>
            </div>
            <img src={rival.logo} alt={rival.name} className="w-16 h-16" />
          </div>
        </div>

        {/* Change Rival Button */}
        <div className="flex justify-center mt-4">
          <button
            onClick={() => setShowRivalSelector(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-400 transition-all rounded-lg hover:text-white hover:bg-white/10"
          >
            <Settings className="w-4 h-4" />
            Change Rival
          </button>
        </div>
      </div>

      {/* This Round - Hurt Rival Scenarios */}
      {hurtRivalScenarios.length > 0 && (
        <div className="p-6 border rounded-xl bg-red-600/20 border-red-500/30">
          <h3 className="flex items-center gap-2 mb-4 text-lg font-bold text-white">
            <Target className="w-5 h-5 text-red-400" />
            This Round: Hurt {rival.name}!
          </h3>

          {hurtRivalScenarios.map((scenario, index) => {
            const isRivalHome = scenario.fixture.teams.home.id === rival.id;

            return (
              <div
                key={index}
                className="p-4 border rounded-lg bg-black/30 border-red-500/20"
              >
                <div className="flex flex-col gap-3 mb-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-wrap items-center gap-2 text-sm text-gray-400">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(scenario.fixture.fixture.date)}</span>
                    <Clock className="w-4 h-4 ml-2" />
                    <span>{formatTime(scenario.fixture.fixture.date)}</span>
                  </div>
                  <span className="self-start px-3 py-1 text-xs font-bold text-red-400 rounded-full bg-red-600/30 sm:self-auto">
                    😈 {scenario.recommendation}
                  </span>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={scenario.fixture.teams.home.logo}
                      alt=""
                      className="w-8 h-8"
                    />
                    <span
                      className={`font-semibold ${
                        isRivalHome ? "text-red-400" : "text-white"
                      }`}
                    >
                      {scenario.fixture.teams.home.name}
                      {isRivalHome && " 👎"}
                    </span>
                  </div>
                  <span className="text-gray-500">vs</span>
                  <div className="flex items-center gap-3">
                    <span
                      className={`font-semibold ${
                        !isRivalHome ? "text-red-400" : "text-white"
                      }`}
                    >
                      {!isRivalHome && "👎 "}
                      {scenario.fixture.teams.away.name}
                    </span>
                    <img
                      src={scenario.fixture.teams.away.logo}
                      alt=""
                      className="w-8 h-8"
                    />
                  </div>
                </div>

                <p className="mt-3 text-sm text-gray-400">
                  <span className="text-red-400">Why:</span> {scenario.reason}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {/* Rival's Upcoming Fixtures */}
      <div className="p-6 border rounded-xl bg-white/5 border-white/10">
        <h3 className="flex items-center gap-2 mb-4 text-lg font-bold text-white">
          <Calendar className="w-5 h-5 text-red-400" />
          {rival.name}'s Next 5 Fixtures
        </h3>

        <div className="space-y-3">
          {rivalFixtures.map((fixture, index) => {
            // const diffLabel = getDifficultyLabel(fixture.difficulty);

            return (
              <div
                key={fixture.fixture.id}
                className="flex flex-col gap-4 p-4 transition-all border rounded-lg bg-black/20 border-white/5 sm:flex-row sm:items-center sm:justify-between hover:border-red-500/30"
              >
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-8 h-8 text-sm font-bold text-gray-500 rounded-full bg-white/10">
                    {index + 1}
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="flex flex-wrap items-center gap-2 text-sm text-gray-400">
                      <Calendar className="w-3 h-3" />
                      <span>{formatDate(fixture.fixture.date)}</span>
                      {fixture.isHome ? (
                        <span className="flex items-center gap-1 ml-2 text-blue-400">
                          <Home className="w-3 h-3" /> H
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 ml-2 text-purple-400">
                          <Plane className="w-3 h-3" /> A
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 sm:w-1/2 sm:justify-end">
                  <div className="flex items-center gap-3">
                    <img
                      src={fixture.opponent.logo}
                      alt=""
                      className="w-8 h-8"
                    />
                    <div className="text-left sm:text-right">
                      <p className="font-semibold text-white">
                        {fixture.isHome ? "vs" : "@"} {fixture.opponent.name}
                      </p>
                      <p className="text-xs text-gray-400">
                        {getOrdinalSuffix(fixture.opponentPosition)} •{" "}
                        {fixture.opponentPoints} pts
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 sm:justify-end">
                    {fixture.difficulty >= 7 ? (
                      <div className="flex items-center gap-1 px-3 py-1 text-green-400 rounded-full bg-green-600/20">
                        <PartyPopper className="w-4 h-4" />
                        <span className="text-xs font-semibold">Tough!</span>
                      </div>
                  ) : fixture.difficulty <= 4 ? (
                    <div className="flex items-center gap-1 px-3 py-1 text-red-400 rounded-full bg-red-600/20">
                      <Frown className="w-4 h-4" />
                      <span className="text-xs font-semibold">Easy</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 px-3 py-1 text-yellow-400 rounded-full bg-yellow-600/20">
                      <AlertTriangle className="w-4 h-4" />
                      <span className="text-xs font-semibold">Medium</span>
                    </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Analysis */}
        <div className="p-4 mt-4 border rounded-lg bg-red-600/10 border-red-500/20">
          <h4 className="mb-2 text-sm font-semibold text-red-400">
            📊 Fixture Analysis for {rival.name}
          </h4>
          <div className="grid grid-cols-1 gap-4 text-center sm:grid-cols-3">
            <div>
              <p className="text-2xl font-bold text-green-400">
                {rivalFixtures.filter((f) => f.difficulty >= 7).length}
              </p>
              <p className="text-xs text-gray-400">Hard Games 🎉</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-yellow-400">
                {
                  rivalFixtures.filter(
                    (f) => f.difficulty >= 4 && f.difficulty < 7
                  ).length
                }
              </p>
              <p className="text-xs text-gray-400">Medium Games</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-red-400">
                {rivalFixtures.filter((f) => f.difficulty < 4).length}
              </p>
              <p className="text-xs text-gray-400">Easy Games 😠</p>
            </div>
          </div>
        </div>
      </div>

      {/* Gap Projection */}
      <div className="p-6 border rounded-xl bg-purple-600/20 border-purple-500/30">
        <h3 className="flex items-center gap-2 mb-4 text-lg font-bold text-white">
          <Trophy className="w-5 h-5 text-purple-400" />
          Gap Projection (Next 5 Games)
        </h3>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {/* Best Case */}
          <div className="p-4 border rounded-lg bg-green-600/20 border-green-500/30">
            <div className="flex items-center gap-2 mb-2">
              <PartyPopper className="w-4 h-4 text-green-400" />
              <span className="text-sm font-semibold text-green-400">
                Best Case
              </span>
            </div>
            <p className="text-2xl font-bold text-white">
              {pointsGap + 15 > 0 ? "+" : ""}
              {pointsGap + 15} pts
            </p>
            <p className="text-xs text-gray-400">
              You win all 5, they lose all 5
            </p>
          </div>

          {/* Expected */}
          <div className="p-4 border rounded-lg bg-yellow-600/20 border-yellow-500/30">
            <div className="flex items-center gap-2 mb-2">
              <Minus className="w-4 h-4 text-yellow-400" />
              <span className="text-sm font-semibold text-yellow-400">
                Realistic
              </span>
            </div>
            <p className="text-2xl font-bold text-white">
              {pointsGap + 3 > 0 ? "+" : ""}
              {pointsGap + 3} pts
            </p>
            <p className="text-xs text-gray-400">Based on fixture difficulty</p>
          </div>

          {/* Worst Case */}
          <div className="p-4 border rounded-lg bg-red-600/20 border-red-500/30">
            <div className="flex items-center gap-2 mb-2">
              <Frown className="w-4 h-4 text-red-400" />
              <span className="text-sm font-semibold text-red-400">
                Worst Case
              </span>
            </div>
            <p className="text-2xl font-bold text-white">
              {pointsGap - 15 > 0 ? "+" : ""}
              {pointsGap - 15} pts
            </p>
            <p className="text-xs text-gray-400">
              You lose all 5, they win all 5
            </p>
          </div>
        </div>
      </div>

      {/* Rival Selector Modal */}
      <RivalSelector
        isOpen={showRivalSelector}
        onClose={() => setShowRivalSelector(false)}
        onSelect={handleRivalSelect}
        currentTeamId={selectedTeam.id}
        currentRivalId={rival?.id}
      />
    </div>
  );
}

export default RivalTracker;
