import { useState, useEffect, useCallback } from "react";
import {
  fetchStandings,
  fetchFixtures,
  //   fetchCurrentRound,
} from "../services/footballApi";
import {
  Trophy,
  Star,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Minus,
  Calendar,
  Loader2,
  ChevronRight,
  Swords,
  Target,
  Shield,
  Flame,
  Skull,
  Crown,
  Medal,
  CircleDot,
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

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
};

const getFormColor = (result) => {
  if (result === "W") return "bg-green-600";
  if (result === "D") return "bg-gray-500";
  return "bg-red-600";
};

const calculateFormPoints = (formString) => {
  if (!formString) return 0;
  let points = 0;
  for (const result of formString.slice(0, 5)) {
    if (result === "W") points += 3;
    else if (result === "D") points += 1;
  }
  return points;
};

// const getFormLabel = (points) => {
//   if (points >= 13) return { label: "Excellent", color: "text-green-400" };
//   if (points >= 10) return { label: "Good", color: "text-blue-400" };
//   if (points >= 7) return { label: "Average", color: "text-yellow-400" };
//   if (points >= 4) return { label: "Poor", color: "text-orange-400" };
//   return { label: "Terrible", color: "text-red-400" };
// };

// ========== SUB-COMPONENTS ==========

const RaceTeamRow = ({
  team,
  position,
  //   highlight,
  type,
  leader,
  selectedTeamId,
}) => {
  const isSelected = team.team.id === selectedTeamId;
  const gapFromLeader = leader ? leader.points - team.points : 0;
  //   const formPoints = calculateFormPoints(team.form);
  //   const formLabel = getFormLabel(formPoints);

  const getPositionIcon = () => {
    if (type === "title") {
      if (position === 1) return <Crown className="w-5 h-5 text-yellow-400" />;
      if (position <= 4) return <Medal className="w-5 h-5 text-blue-400" />;
    }
    if (type === "top4") {
      if (position <= 4) return <Star className="w-5 h-5 text-blue-400" />;
      if (position <= 6)
        return <CircleDot className="w-5 h-5 text-orange-400" />;
    }
    if (type === "relegation") {
      if (position >= 18) return <Skull className="w-5 h-5 text-red-400" />;
      if (position === 17)
        return <AlertTriangle className="w-5 h-5 text-orange-400" />;
    }
    return null;
  };

  const getBgColor = () => {
    if (isSelected) return "bg-purple-600/30 border-purple-500/50";
    if (type === "title" && position === 1)
      return "bg-yellow-600/20 border-yellow-500/30";
    if (type === "top4" && position <= 4)
      return "bg-blue-600/20 border-blue-500/30";
    if (type === "top4" && position <= 6)
      return "bg-orange-600/20 border-orange-500/30";
    if (type === "relegation" && position >= 18)
      return "bg-red-600/20 border-red-500/30";
    if (type === "relegation" && position === 17)
      return "bg-orange-600/20 border-orange-500/30";
    return "bg-white/5 border-white/10";
  };

  return (
    <div
      className={`p-4 rounded-xl border transition-all hover:scale-[1.01] ${getBgColor()}`}
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        {/* Position & Team */}
        <div className="flex items-center gap-4">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-black/30">
            <span className="text-lg font-bold text-white">{position}</span>
          </div>
          <img
            src={team.team.logo}
            alt={team.team.name}
            className="w-10 h-10"
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-white">{team.team.name}</span>
              {getPositionIcon()}
              {isSelected && (
                <span className="px-2 py-0.5 text-xs font-bold text-purple-400 bg-purple-600/30 rounded-full">
                  YOUR TEAM
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1 text-sm text-gray-400">
              <span>P{team.all.played}</span>
              <span>•</span>
              <span>
                GD: {team.goalsDiff > 0 ? "+" : ""}
                {team.goalsDiff}
              </span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between gap-4 md:gap-6">
          {/* Form */}
          <div className="hidden md:block">
            <p className="mb-1 text-xs text-gray-500">Form</p>
            <div className="flex gap-1">
              {team.form
                ?.split("")
                .slice(0, 5)
                .map((result, i) => (
                  <span
                    key={i}
                    className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold text-white ${getFormColor(
                      result
                    )}`}
                  >
                    {result}
                  </span>
                ))}
            </div>
          </div>

          {/* Gap from Leader */}
          {position > 1 && (
            <div className="text-center">
              <p className="text-xs text-gray-500">Gap</p>
              <p
                className={`text-lg font-bold ${
                  type === "relegation" ? "text-green-400" : "text-red-400"
                }`}
              >
                {type === "relegation" ? "+" : "-"}
                {gapFromLeader}
              </p>
            </div>
          )}

          {/* Points */}
          <div className="text-center min-w-[60px]">
            <p className="text-xs text-gray-500">Points</p>
            <p className="text-2xl font-bold text-white">{team.points}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const HeadToHeadFixtures = ({ fixtures, title }) => {
  if (!fixtures || fixtures.length === 0) return null;

  return (
    <div className="p-4 mt-6 border rounded-xl bg-black/20 border-white/10">
      <h4 className="flex items-center gap-2 mb-4 text-sm font-semibold text-gray-400">
        <Swords className="w-4 h-4" />
        {title}
      </h4>
      <div className="space-y-2">
        {fixtures.slice(0, 5).map((fixture, index) => (
          <div
            key={index}
            className="flex flex-col items-center justify-between gap-3 p-3 rounded-lg bg-white/5 sm:flex-row"
          >
            <div className="flex items-center gap-2">
              <img src={fixture.teams.home.logo} alt="" className="w-6 h-6" />
              <span className="text-sm text-white">
                {fixture.teams.home.name}
              </span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-xs text-gray-500">
                {formatDate(fixture.fixture.date)}
              </span>
              <span className="text-xs text-gray-400">vs</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-white">
                {fixture.teams.away.name}
              </span>
              <img src={fixture.teams.away.logo} alt="" className="w-6 h-6" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ========== MAIN COMPONENT ==========

function RaceTrackers({ selectedTeam }) {
  const [activeRace, setActiveRace] = useState("title");
  const [standings, setStandings] = useState([]);
  const [allFixtures, setAllFixtures] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);

    try {
      const [standingsData, fixturesData] = await Promise.all([
        fetchStandings(),
        fetchFixtures(), // Gets next fixtures
      ]);

      setStandings(standingsData);
      setAllFixtures(fixturesData);
    } catch (error) {
      console.error("Error loading race data:", error);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Get teams for each race
  const titleRaceTeams = standings.slice(0, 5); // Top 5
  const top4RaceTeams = standings.slice(2, 8); // 3rd to 8th (fighting for top 4)
  const relegationTeams = standings.slice(14, 20); // Bottom 6

  // Find head-to-head fixtures
  const getHeadToHeadFixtures = (teams) => {
    const teamIds = teams.map((t) => t.team.id);
    return allFixtures.filter(
      (f) =>
        teamIds.includes(f.teams.home.id) && teamIds.includes(f.teams.away.id)
    );
  };

  const titleH2H = getHeadToHeadFixtures(titleRaceTeams);
  const top4H2H = getHeadToHeadFixtures(top4RaceTeams);
  const relegationH2H = getHeadToHeadFixtures(relegationTeams);

  // Calculate race stats
  const calculateRaceStats = (teams, type) => {
    const leader = teams[0];
    const lastInRace =
      type === "relegation" ? teams[teams.length - 3] : teams[teams.length - 1];
    const pointsSpread = leader.points - teams[teams.length - 1].points;
    const avgForm =
      teams.reduce((sum, t) => sum + calculateFormPoints(t.form), 0) /
      teams.length;

    return {
      leader,
      lastInRace,
      pointsSpread,
      avgForm,
      gamesPlayed: leader.all.played,
      gamesRemaining: 38 - leader.all.played,
      maxPointsAvailable: (38 - leader.all.played) * 3,
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
        <span className="ml-3 text-gray-300">Loading race data...</span>
      </div>
    );
  }

  const titleStats = calculateRaceStats(titleRaceTeams, "title");
  const top4Stats = calculateRaceStats(top4RaceTeams, "top4");
  const relegationStats = calculateRaceStats(relegationTeams, "relegation");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-6 text-center">
        <h2 className="mb-2 text-2xl font-bold text-white">Race Trackers</h2>
        <p className="text-gray-400">
          Follow the battles at the top and bottom of the table
        </p>
      </div>

      {/* Race Selector Tabs */}
      <div className="flex justify-center">
        <div className="inline-flex flex-wrap justify-center gap-2 p-1 border rounded-xl bg-black/30 border-white/10">
          <button
            onClick={() => setActiveRace("title")}
            className={`flex items-center gap-2 px-4 py-3 rounded-lg font-semibold transition-all ${
              activeRace === "title"
                ? "bg-yellow-600 text-white"
                : "text-gray-400 hover:text-white hover:bg-white/10"
            }`}
          >
            <Crown className="w-5 h-5" />
            <span>Title Race</span>
          </button>
          <button
            onClick={() => setActiveRace("top4")}
            className={`flex items-center gap-2 px-4 py-3 rounded-lg font-semibold transition-all ${
              activeRace === "top4"
                ? "bg-blue-600 text-white"
                : "text-gray-400 hover:text-white hover:bg-white/10"
            }`}
          >
            <Star className="w-5 h-5" />
            <span>Top 4</span>
          </button>
          <button
            onClick={() => setActiveRace("relegation")}
            className={`flex items-center gap-2 px-4 py-3 rounded-lg font-semibold transition-all ${
              activeRace === "relegation"
                ? "bg-red-600 text-white"
                : "text-gray-400 hover:text-white hover:bg-white/10"
            }`}
          >
            <Skull className="w-5 h-5" />
            <span>Relegation</span>
          </button>
        </div>
      </div>

      {/* Title Race */}
      {activeRace === "title" && (
        <div className="space-y-6">
          {/* Race Summary */}
          <div className="p-6 border rounded-xl bg-gradient-to-r from-yellow-900/30 via-slate-900 to-yellow-900/30 border-yellow-500/30">
            <div className="flex items-center gap-3 mb-4">
              <Crown className="w-6 h-6 text-yellow-400" />
              <h3 className="text-xl font-bold text-white">Title Race</h3>
            </div>

            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <div className="p-4 rounded-lg bg-black/30">
                <p className="text-xs text-gray-400">Current Leader</p>
                <div className="flex items-center gap-2 mt-1">
                  <img
                    src={titleStats.leader.team.logo}
                    alt=""
                    className="w-6 h-6"
                  />
                  <span className="font-bold text-white">
                    {titleStats.leader.team.name}
                  </span>
                </div>
              </div>
              <div className="p-4 rounded-lg bg-black/30">
                <p className="text-xs text-gray-400">Points Spread</p>
                <p className="mt-1 text-2xl font-bold text-yellow-400">
                  {titleStats.pointsSpread} pts
                </p>
              </div>
              <div className="p-4 rounded-lg bg-black/30">
                <p className="text-xs text-gray-400">Games Remaining</p>
                <p className="mt-1 text-2xl font-bold text-white">
                  {titleStats.gamesRemaining}
                </p>
              </div>
              <div className="p-4 rounded-lg bg-black/30">
                <p className="text-xs text-gray-400">Max Points Available</p>
                <p className="mt-1 text-2xl font-bold text-green-400">
                  {titleStats.maxPointsAvailable}
                </p>
              </div>
            </div>
          </div>

          {/* Teams */}
          <div className="space-y-3">
            {titleRaceTeams.map((team, index) => (
              <RaceTeamRow
                key={team.team.id}
                team={team}
                position={index + 1}
                type="title"
                leader={titleRaceTeams[0]}
                selectedTeamId={selectedTeam.id}
              />
            ))}
          </div>

          {/* Head to Head */}
          <HeadToHeadFixtures
            fixtures={titleH2H}
            teams={titleRaceTeams}
            title="Upcoming Title Race Clashes"
          />

          {/* Analysis */}
          <div className="p-6 border rounded-xl bg-yellow-600/20 border-yellow-500/30">
            <h4 className="flex items-center gap-2 mb-3 font-semibold text-yellow-400">
              <Target className="w-5 h-5" />
              Title Race Analysis
            </h4>
            <div className="space-y-2 text-sm text-gray-300">
              <p>
                📊 <strong>{titleStats.leader.team.name}</strong> leads by{" "}
                <strong>
                  {titleRaceTeams[1]
                    ? titleStats.leader.points - titleRaceTeams[1].points
                    : 0}{" "}
                  points
                </strong>{" "}
                over {titleRaceTeams[1]?.team.name || "2nd place"}.
              </p>
              <p>
                🎯 With <strong>{titleStats.gamesRemaining} games</strong>{" "}
                remaining,{" "}
                <strong>{titleStats.maxPointsAvailable} points</strong> are
                still available.
              </p>
              {titleStats.pointsSpread <= 9 && (
                <p className="text-yellow-400">
                  🔥 The race is TIGHT! Only {titleStats.pointsSpread} points
                  separate the top 5.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Top 4 Race */}
      {activeRace === "top4" && (
        <div className="space-y-6">
          {/* Race Summary */}
          <div className="p-6 border rounded-xl bg-gradient-to-r from-blue-900/30 via-slate-900 to-blue-900/30 border-blue-500/30">
            <div className="flex items-center gap-3 mb-4">
              <Star className="w-6 h-6 text-blue-400" />
              <h3 className="text-xl font-bold text-white">Top 4 Race</h3>
              <span className="px-2 py-1 text-xs font-bold text-blue-400 rounded-full bg-blue-600/30">
                Champions League
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <div className="p-4 rounded-lg bg-black/30">
                <p className="text-xs text-gray-400">4th Place</p>
                <div className="flex items-center gap-2 mt-1">
                  <img
                    src={standings[3]?.team.logo}
                    alt=""
                    className="w-6 h-6"
                  />
                  <span className="font-bold text-white">
                    {standings[3]?.team.name}
                  </span>
                </div>
              </div>
              <div className="p-4 rounded-lg bg-black/30">
                <p className="text-xs text-gray-400">5th to 4th Gap</p>
                <p className="mt-1 text-2xl font-bold text-blue-400">
                  {standings[3]?.points - standings[4]?.points || 0} pts
                </p>
              </div>
              <div className="p-4 rounded-lg bg-black/30">
                <p className="text-xs text-gray-400">Teams in Race</p>
                <p className="mt-1 text-2xl font-bold text-white">
                  {top4RaceTeams.length}
                </p>
              </div>
              <div className="p-4 rounded-lg bg-black/30">
                <p className="text-xs text-gray-400">Points Spread</p>
                <p className="mt-1 text-2xl font-bold text-orange-400">
                  {top4Stats.pointsSpread} pts
                </p>
              </div>
            </div>
          </div>

          {/* Current Top 4 */}
          <div className="p-4 border rounded-xl bg-blue-600/10 border-blue-500/30">
            <h4 className="mb-3 text-sm font-semibold text-blue-400">
              ✅ Currently in Top 4 (Champions League)
            </h4>
            <div className="space-y-2">
              {standings.slice(0, 4).map((team, index) => (
                <RaceTeamRow
                  key={team.team.id}
                  team={team}
                  position={index + 1}
                  type="top4"
                  leader={standings[0]}
                  selectedTeamId={selectedTeam.id}
                />
              ))}
            </div>
          </div>

          {/* Chasing Pack */}
          <div className="p-4 border rounded-xl bg-orange-600/10 border-orange-500/30">
            <h4 className="mb-3 text-sm font-semibold text-orange-400">
              🎯 Chasing the Top 4
            </h4>
            <div className="space-y-2">
              {standings.slice(4, 8).map((team, index) => (
                <RaceTeamRow
                  key={team.team.id}
                  team={team}
                  position={index + 5}
                  type="top4"
                  leader={standings[3]} // Gap from 4th place
                  selectedTeamId={selectedTeam.id}
                />
              ))}
            </div>
          </div>

          {/* Head to Head */}
          <HeadToHeadFixtures
            fixtures={top4H2H}
            teams={top4RaceTeams}
            title="Upcoming Top 4 Clashes"
          />

          {/* Analysis */}
          <div className="p-6 border rounded-xl bg-blue-600/20 border-blue-500/30">
            <h4 className="flex items-center gap-2 mb-3 font-semibold text-blue-400">
              <Target className="w-5 h-5" />
              Top 4 Race Analysis
            </h4>
            <div className="space-y-2 text-sm text-gray-300">
              <p>
                🏆 <strong>{standings[3]?.team.name}</strong> currently holds
                the final Champions League spot.
              </p>
              <p>
                📊 <strong>{standings[4]?.team.name}</strong> in 5th is{" "}
                <strong>
                  {standings[3]?.points - standings[4]?.points || 0} points
                </strong>{" "}
                behind.
              </p>
              {standings[3]?.points - standings[7]?.points <= 6 && (
                <p className="text-blue-400">
                  🔥{" "}
                  {standings
                    .slice(4, 8)
                    .filter((t) => standings[3]?.points - t.points <= 6)
                    .length + 1}{" "}
                  teams within 6 points of 4th place!
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Relegation Battle */}
      {activeRace === "relegation" && (
        <div className="space-y-6">
          {/* Race Summary */}
          <div className="p-6 border rounded-xl bg-gradient-to-r from-red-900/30 via-slate-900 to-red-900/30 border-red-500/30">
            <div className="flex items-center gap-3 mb-4">
              <Skull className="w-6 h-6 text-red-400" />
              <h3 className="text-xl font-bold text-white">
                Relegation Battle
              </h3>
              <span className="px-2 py-1 text-xs font-bold text-red-400 rounded-full bg-red-600/30">
                Survival Mode
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <div className="p-4 rounded-lg bg-black/30">
                <p className="text-xs text-gray-400">Safety Line (17th)</p>
                <div className="flex items-center gap-2 mt-1">
                  <img
                    src={standings[16]?.team.logo}
                    alt=""
                    className="w-6 h-6"
                  />
                  <span className="font-bold text-white">
                    {standings[16]?.team.name}
                  </span>
                </div>
              </div>
              <div className="p-4 rounded-lg bg-black/30">
                <p className="text-xs text-gray-400">17th to 18th Gap</p>
                <p className="mt-1 text-2xl font-bold text-orange-400">
                  {standings[16]?.points - standings[17]?.points || 0} pts
                </p>
              </div>
              <div className="p-4 rounded-lg bg-black/30">
                <p className="text-xs text-gray-400">Bottom 3 Points</p>
                <p className="mt-1 text-2xl font-bold text-red-400">
                  {standings[17]?.points || 0}-{standings[19]?.points || 0}
                </p>
              </div>
              <div className="p-4 rounded-lg bg-black/30">
                <p className="text-xs text-gray-400">Games Remaining</p>
                <p className="mt-1 text-2xl font-bold text-white">
                  {relegationStats.gamesRemaining}
                </p>
              </div>
            </div>
          </div>

          {/* Safe (for now) */}
          <div className="p-4 border rounded-xl bg-orange-600/10 border-orange-500/30">
            <h4 className="mb-3 text-sm font-semibold text-orange-400">
              ⚠️ In Danger Zone (15th - 17th)
            </h4>
            <div className="space-y-2">
              {standings.slice(14, 17).map((team, index) => (
                <RaceTeamRow
                  key={team.team.id}
                  team={team}
                  position={index + 15}
                  type="relegation"
                  leader={standings[16]} // Gap from safety
                  selectedTeamId={selectedTeam.id}
                />
              ))}
            </div>
          </div>

          {/* Relegation Zone */}
          <div className="p-4 border rounded-xl bg-red-600/10 border-red-500/30">
            <h4 className="mb-3 text-sm font-semibold text-red-400">
              ☠️ Relegation Zone (18th - 20th)
            </h4>
            <div className="space-y-2">
              {standings.slice(17, 20).map((team, index) => (
                <RaceTeamRow
                  key={team.team.id}
                  team={team}
                  position={index + 18}
                  type="relegation"
                  leader={standings[16]} // Gap from safety
                  selectedTeamId={selectedTeam.id}
                />
              ))}
            </div>
          </div>

          {/* Head to Head */}
          <HeadToHeadFixtures
            fixtures={relegationH2H}
            teams={relegationTeams}
            title="Upcoming Relegation Six-Pointers"
          />

          {/* Analysis */}
          <div className="p-6 border rounded-xl bg-red-600/20 border-red-500/30">
            <h4 className="flex items-center gap-2 mb-3 font-semibold text-red-400">
              <AlertTriangle className="w-5 h-5" />
              Relegation Battle Analysis
            </h4>
            <div className="space-y-2 text-sm text-gray-300">
              <p>
                🚨 <strong>{standings[17]?.team.name}</strong>,{" "}
                <strong>{standings[18]?.team.name}</strong>, and{" "}
                <strong>{standings[19]?.team.name}</strong> currently in the
                drop zone.
              </p>
              <p>
                📊 <strong>{standings[16]?.team.name}</strong> holds the last
                safe spot with <strong>{standings[16]?.points} points</strong>.
              </p>
              <p>
                🎯 Gap to safety:{" "}
                <strong>
                  {standings[16]?.points - standings[19]?.points || 0} points
                </strong>{" "}
                from 17th to 20th.
              </p>
              {relegationStats.gamesRemaining >= 10 && (
                <p className="text-green-400">
                  ✅ Still {relegationStats.gamesRemaining} games to go - plenty
                  of time to escape!
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Your Team Position Indicator */}
      {standings.length > 0 && (
        <div className="p-4 border rounded-xl bg-purple-600/20 border-purple-500/30">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <img src={selectedTeam.logo} alt="" className="w-10 h-10" />
              <div>
                <p className="text-sm text-gray-400">Your Position</p>
                <p className="text-xl font-bold text-white">
                  {getOrdinalSuffix(
                    standings.findIndex((t) => t.team.id === selectedTeam.id) +
                      1
                  )}
                </p>
              </div>
            </div>
            <div className="text-left md:text-right">
              <p className="text-sm text-gray-400">
                {standings.findIndex((t) => t.team.id === selectedTeam.id) +
                  1 <=
                4
                  ? "In Champions League spots!"
                  : standings.findIndex((t) => t.team.id === selectedTeam.id) +
                      1 >=
                    18
                  ? "In Relegation Zone!"
                  : standings.findIndex((t) => t.team.id === selectedTeam.id) +
                      1 <=
                    6
                  ? "In Europa League spots"
                  : "Mid-table"}
              </p>
              <p className="text-lg font-bold text-purple-400">
                {standings.find((t) => t.team.id === selectedTeam.id)?.points ||
                  0}{" "}
                pts
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RaceTrackers;
