import { useState, useEffect, useRef, useCallback } from "react";
import {
  fetchStandings,
  fetchFixtures,
  fetchCurrentRound,
} from "../services/footballApi";
import {
  TrendingUp,
  TrendingDown,
  Target,
  Award,
  Calendar,
  Clock,
  Loader2,
  AlertTriangle,
  Trophy,
  Shield,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import ShareModal from "./ShareModal";
import ShareButton from "./ShareButton";

// ========== HELPER FUNCTIONS (OUTSIDE COMPONENT) ==========

const getOrdinalSuffix = (num) => {
  const j = num % 10;
  const k = num % 100;
  if (j === 1 && k !== 11) return num + "st";
  if (j === 2 && k !== 12) return num + "nd";
  if (j === 3 && k !== 13) return num + "rd";
  return num + "th";
};

const calculateGDScenarios = (
  standings,
  selectedTeam,
  selectedTeamPoints,
  selectedTeamGD,
  currentPosition
) => {
  const notes = [];
  const projectedPoints = selectedTeamPoints + 3;

  const teamsAbove = standings.slice(0, currentPosition - 1);

  teamsAbove.forEach((team) => {
    if (team.points === projectedPoints) {
      const gdDiff = team.goalsDiff - selectedTeamGD;
      const teamPos =
        standings.findIndex((t) => t.team.id === team.team.id) + 1;

      if (gdDiff > 0) {
        const goalsNeeded = gdDiff + 1;
        notes.push({
          type: "overtake",
          team: team.team.name,
          teamPos,
          goalsNeeded,
          currentGDGap: gdDiff,
          message: `Win by ${goalsNeeded}+ goal${
            goalsNeeded > 1 ? "s" : ""
          } to move above ${team.team.name} (${getOrdinalSuffix(
            teamPos
          )}) on GD`,
        });
      } else if (gdDiff === 0) {
        const selectedGoalsFor =
          standings.find((t) => t.team.id === selectedTeam.id)?.all?.goals
            ?.for || 0;
        const teamGoalsFor = team.all?.goals?.for || 0;
        const goalsForDiff = teamGoalsFor - selectedGoalsFor;

        if (goalsForDiff > 0) {
          notes.push({
            type: "overtake",
            team: team.team.name,
            teamPos,
            goalsNeeded: goalsForDiff + 1,
            currentGDGap: 0,
            message: `Win by ${goalsForDiff + 1}+ goal${
              goalsForDiff + 1 > 1 ? "s" : ""
            } to move above ${team.team.name} (${getOrdinalSuffix(
              teamPos
            )}) on goals scored`,
          });
        } else {
          notes.push({
            type: "ahead",
            team: team.team.name,
            teamPos,
            goalsNeeded: 0,
            currentGDGap: 0,
            message: `Any win puts you above ${
              team.team.name
            } (${getOrdinalSuffix(teamPos)}) - you have more goals scored`,
          });
        }
      } else {
        notes.push({
          type: "ahead",
          team: team.team.name,
          teamPos,
          goalsNeeded: 0,
          currentGDGap: gdDiff,
          message: `Any win puts you above ${
            team.team.name
          } (${getOrdinalSuffix(teamPos)}) - you have better GD`,
        });
      }
    }
  });

  const teamsBelow = standings.slice(currentPosition);
  teamsBelow.forEach((team) => {
    if (team.points === selectedTeamPoints) {
      const gdDiff = selectedTeamGD - team.goalsDiff;
      const teamPos =
        standings.findIndex((t) => t.team.id === team.team.id) + 1;

      if (gdDiff <= 3 && gdDiff >= -3) {
        if (gdDiff < 0) {
          notes.push({
            type: "threat",
            team: team.team.name,
            teamPos,
            message: `${team.team.name} (${getOrdinalSuffix(
              teamPos
            )}) has better GD - win big to stay safe!`,
          });
        } else if (gdDiff <= 2) {
          notes.push({
            type: "warning",
            team: team.team.name,
            teamPos,
            message: `${team.team.name} (${getOrdinalSuffix(
              teamPos
            )}) is close on GD (+${gdDiff}) - a big win helps`,
          });
        }
      }
    }
  });

  const priority = { overtake: 1, ahead: 2, warning: 3, threat: 4 };
  notes.sort((a, b) => priority[a.type] - priority[b.type]);

  return notes;
};

const calculateBestScenarios = (
  standings,
  fixtures,
  selectedTeam,
  position
) => {
  const teamsAbove = standings.slice(0, position - 1);
  const teamsBelow = standings.slice(position);
  const teamsAboveIds = teamsAbove.map((t) => t.team.id);
  const teamsBelowIds = teamsBelow.map((t) => t.team.id);

  const selectedTeamData = standings.find((t) => t.team.id === selectedTeam.id);
  const selectedTeamPoints = selectedTeamData?.points || 0;
  const selectedTeamGD = selectedTeamData?.goalsDiff || 0;

  const scenariosList = [];

  fixtures.forEach((fixture) => {
    const homeTeam = fixture.teams.home;
    const awayTeam = fixture.teams.away;

    const homeIsAbove = teamsAboveIds.includes(homeTeam.id);
    const awayIsAbove = teamsAboveIds.includes(awayTeam.id);
    const homeIsBelow = teamsBelowIds.includes(homeTeam.id);
    const awayIsBelow = teamsBelowIds.includes(awayTeam.id);
    const isSelectedTeamMatch =
      homeTeam.id === selectedTeam.id || awayTeam.id === selectedTeam.id;

    let scenario = null;

    const homeTeamData = standings.find((t) => t.team.id === homeTeam.id);
    const awayTeamData = standings.find((t) => t.team.id === awayTeam.id);
    const homePos = standings.findIndex((t) => t.team.id === homeTeam.id) + 1;
    const awayPos = standings.findIndex((t) => t.team.id === awayTeam.id) + 1;
    const homePoints = homeTeamData?.points || 0;
    const awayPoints = awayTeamData?.points || 0;

    const homeGapFromSelected = Math.abs(homePoints - selectedTeamPoints);
    const awayGapFromSelected = Math.abs(awayPoints - selectedTeamPoints);

    if (isSelectedTeamMatch) {
      const opponent = homeTeam.id === selectedTeam.id ? awayTeam : homeTeam;
      const opponentPos = homeTeam.id === selectedTeam.id ? awayPos : homePos;
      const opponentData =
        homeTeam.id === selectedTeam.id ? awayTeamData : homeTeamData;
      const isHome = homeTeam.id === selectedTeam.id;

      const gdNotes = calculateGDScenarios(
        standings,
        selectedTeam,
        selectedTeamPoints,
        selectedTeamGD,
        position
      );

      scenario = {
        fixture,
        type: "own_match",
        recommendation: "WIN",
        impact: "critical",
        reason: `${selectedTeam.name} ${
          isHome ? "(Home)" : "(Away)"
        } must win to gain 3 crucial points against ${
          opponent.name
        } (${getOrdinalSuffix(opponentPos)}, ${opponentData?.points || 0} pts)`,
        color: "red",
        importance: 100,
        pointsGained: 3,
        affectedTeams: [{ id: selectedTeam.id, pointsChange: 3 }],
        gdNotes,
      };
    } else if (homeIsAbove && awayIsAbove) {
      const avgGap = (homeGapFromSelected + awayGapFromSelected) / 2;
      const importanceBoost = Math.max(0, 20 - avgGap);

      scenario = {
        fixture,
        type: "both_above",
        recommendation: "DRAW",
        impact: "high",
        reason: `Both teams drop 2 points instead of one gaining 3. ${
          homeTeam.name
        } (${getOrdinalSuffix(homePos)}, ${homePoints} pts) vs ${
          awayTeam.name
        } (${getOrdinalSuffix(awayPos)}, ${awayPoints} pts)`,
        color: "yellow",
        importance: 80 + importanceBoost,
        affectedTeams: [
          { id: homeTeam.id, pointsChange: 1 },
          { id: awayTeam.id, pointsChange: 1 },
        ],
      };
    } else if (homeIsBelow && awayIsBelow) {
      const avgGap = (homeGapFromSelected + awayGapFromSelected) / 2;
      const importanceBoost = Math.max(0, 15 - avgGap);

      const homeCouldOvertake = homePoints + 3 >= selectedTeamPoints;
      const awayCouldOvertake = awayPoints + 3 >= selectedTeamPoints;

      if (homeCouldOvertake || awayCouldOvertake) {
        scenario = {
          fixture,
          type: "both_below",
          recommendation: "DRAW",
          impact: "medium",
          reason: `Prevent either team from gaining ground. ${
            homeTeam.name
          } (${getOrdinalSuffix(homePos)}, ${homePoints} pts) vs ${
            awayTeam.name
          } (${getOrdinalSuffix(awayPos)}, ${awayPoints} pts)`,
          color: "purple",
          importance: 40 + importanceBoost,
          affectedTeams: [
            { id: homeTeam.id, pointsChange: 1 },
            { id: awayTeam.id, pointsChange: 1 },
          ],
        };
      }
    } else if (homeIsAbove && awayIsBelow) {
      const importanceBoost = Math.max(0, 20 - homeGapFromSelected);

      scenario = {
        fixture,
        type: "above_vs_below",
        recommendation: `${awayTeam.name} WIN`,
        impact: homeGapFromSelected <= 6 ? "high" : "medium",
        reason: `${homeTeam.name} (${getOrdinalSuffix(
          homePos
        )}, ${homePoints} pts) would drop 3 points, helping ${
          selectedTeam.name
        } close the gap`,
        color: "blue",
        importance: 60 + importanceBoost,
        affectedTeams: [
          { id: homeTeam.id, pointsChange: 0 },
          { id: awayTeam.id, pointsChange: 3 },
        ],
      };
    } else if (homeIsBelow && awayIsAbove) {
      const importanceBoost = Math.max(0, 20 - awayGapFromSelected);

      scenario = {
        fixture,
        type: "below_vs_above",
        recommendation: `${homeTeam.name} WIN`,
        impact: awayGapFromSelected <= 6 ? "high" : "medium",
        reason: `${awayTeam.name} (${getOrdinalSuffix(
          awayPos
        )}, ${awayPoints} pts) would drop 3 points, helping ${
          selectedTeam.name
        } close the gap`,
        color: "blue",
        importance: 60 + importanceBoost,
        affectedTeams: [
          { id: homeTeam.id, pointsChange: 3 },
          { id: awayTeam.id, pointsChange: 0 },
        ],
      };
    } else if (homeIsAbove && !awayIsAbove && !awayIsBelow) {
      const importanceBoost = Math.max(0, 20 - homeGapFromSelected);

      scenario = {
        fixture,
        type: "above_vs_neutral",
        recommendation: `${awayTeam.name} WIN or DRAW`,
        impact: homeGapFromSelected <= 6 ? "high" : "medium",
        reason: `${homeTeam.name} (${getOrdinalSuffix(
          homePos
        )}, ${homePoints} pts) would drop points`,
        color: "blue",
        importance: 50 + importanceBoost,
        affectedTeams: [
          { id: homeTeam.id, pointsChange: 0 },
          { id: awayTeam.id, pointsChange: 3 },
        ],
      };
    } else if (awayIsAbove && !homeIsAbove && !homeIsBelow) {
      const importanceBoost = Math.max(0, 20 - awayGapFromSelected);

      scenario = {
        fixture,
        type: "neutral_vs_above",
        recommendation: `${homeTeam.name} WIN or DRAW`,
        impact: awayGapFromSelected <= 6 ? "high" : "medium",
        reason: `${awayTeam.name} (${getOrdinalSuffix(
          awayPos
        )}, ${awayPoints} pts) would drop points`,
        color: "blue",
        importance: 50 + importanceBoost,
        affectedTeams: [
          { id: homeTeam.id, pointsChange: 3 },
          { id: awayTeam.id, pointsChange: 0 },
        ],
      };
    } else if (homeIsBelow && !awayIsAbove && !awayIsBelow) {
      const couldOvertake = homePoints + 3 >= selectedTeamPoints;
      if (couldOvertake) {
        scenario = {
          fixture,
          type: "below_vs_neutral",
          recommendation: `${awayTeam.name} WIN or DRAW`,
          impact: "low",
          reason: `Prevent ${homeTeam.name} (${getOrdinalSuffix(
            homePos
          )}, ${homePoints} pts) from gaining ground`,
          color: "gray",
          importance: 30,
          affectedTeams: [
            { id: homeTeam.id, pointsChange: 0 },
            { id: awayTeam.id, pointsChange: 3 },
          ],
        };
      }
    } else if (awayIsBelow && !homeIsAbove && !homeIsBelow) {
      const couldOvertake = awayPoints + 3 >= selectedTeamPoints;
      if (couldOvertake) {
        scenario = {
          fixture,
          type: "neutral_vs_below",
          recommendation: `${homeTeam.name} WIN or DRAW`,
          impact: "low",
          reason: `Prevent ${awayTeam.name} (${getOrdinalSuffix(
            awayPos
          )}, ${awayPoints} pts) from gaining ground`,
          color: "gray",
          importance: 30,
          affectedTeams: [
            { id: homeTeam.id, pointsChange: 3 },
            { id: awayTeam.id, pointsChange: 0 },
          ],
        };
      }
    }

    if (scenario) {
      scenariosList.push(scenario);
    }
  });

  return scenariosList.sort((a, b) => b.importance - a.importance);
};

const calculateRealisticProjection = (standings, scenarios, selectedTeam) => {
  const teamPoints = {};
  standings.forEach((team) => {
    teamPoints[team.team.id] = {
      currentPoints: team.points,
      projectedPoints: team.points,
      name: team.team.name,
      goalsDiff: team.goalsDiff,
      goalsFor: team.all?.goals?.for || 0,
    };
  });

  scenarios.forEach((scenario) => {
    if (scenario.affectedTeams) {
      scenario.affectedTeams.forEach((affected) => {
        if (teamPoints[affected.id]) {
          teamPoints[affected.id].projectedPoints += affected.pointsChange;
        }
      });
    }
  });

  const selectedTeamData = teamPoints[selectedTeam.id];
  const selectedTeamProjectedPoints = selectedTeamData?.projectedPoints || 0;

  const sortedTeams = Object.entries(teamPoints)
    .map(([id, data]) => ({
      id: parseInt(id),
      ...data,
    }))
    .sort((a, b) => {
      if (b.projectedPoints !== a.projectedPoints) {
        return b.projectedPoints - a.projectedPoints;
      }
      if (b.goalsDiff !== a.goalsDiff) {
        return b.goalsDiff - a.goalsDiff;
      }
      return b.goalsFor - a.goalsFor;
    });

  const selectedTeamProjectedPosition =
    sortedTeams.findIndex((t) => t.id === selectedTeam.id) + 1;
  const currentPosition =
    standings.findIndex((t) => t.team.id === selectedTeam.id) + 1;

  const positionChange = currentPosition - selectedTeamProjectedPosition;

  return {
    currentPosition,
    projectedPosition: selectedTeamProjectedPosition,
    currentPoints: selectedTeamData?.currentPoints || 0,
    projectedPoints: selectedTeamProjectedPoints,
    pointsGain:
      selectedTeamProjectedPoints - (selectedTeamData?.currentPoints || 0),
    positionChange,
    isImprovement: positionChange > 0,
    isDecline: positionChange < 0,
    sortedTable: sortedTeams,
  };
};

const getImpactColor = (color) => {
  switch (color) {
    case "red":
      return "bg-red-600/20 border-red-500/50 text-red-400";
    case "yellow":
      return "bg-yellow-600/20 border-yellow-500/50 text-yellow-400";
    case "blue":
      return "bg-blue-600/20 border-blue-500/50 text-blue-400";
    case "purple":
      return "bg-purple-600/20 border-purple-500/50 text-purple-400";
    case "gray":
      return "bg-gray-600/20 border-gray-500/50 text-gray-400";
    default:
      return "bg-gray-600/20 border-gray-500/50 text-gray-400";
  }
};

const getImpactIcon = (impact) => {
  switch (impact) {
    case "critical":
      return <Award className="w-5 h-5" />;
    case "high":
      return <TrendingUp className="w-5 h-5" />;
    case "medium":
      return <Target className="w-5 h-5" />;
    case "low":
      return <Shield className="w-5 h-5" />;
    default:
      return <Target className="w-5 h-5" />;
  }
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

function BestScenarios({ selectedTeam }) {
  const [scenarios, setScenarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [standings, setStandings] = useState([]);
  const [teamPosition, setTeamPosition] = useState(0);
  const [projectedPosition, setProjectedPosition] = useState(null);
  const [currentRound, setCurrentRound] = useState(null);
  const [showAllScenarios, setShowAllScenarios] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const selectedTeamRef = useRef(null);

  const loadScenariosData = useCallback(async () => {
    setLoading(true);

    try {
      const [standingsData, round] = await Promise.all([
        fetchStandings(),
        fetchCurrentRound(),
      ]);

      if (!standingsData || standingsData.length === 0) {
        setLoading(false);
        return;
      }

      setStandings(standingsData);
      setCurrentRound(round);

      const position =
        standingsData.findIndex((t) => t.team.id === selectedTeam.id) + 1;
      setTeamPosition(position);

      let fixturesData = [];
      if (round) {
        fixturesData = await fetchFixtures(round);
      } else {
        fixturesData = await fetchFixtures();
        if (fixturesData.length > 0) {
          const nearestRound = fixturesData[0]?.league?.round;
          fixturesData = fixturesData.filter(
            (f) => f.league?.round === nearestRound
          );
        }
      }

      const pendingFixtures = fixturesData.filter((fixture) => {
        const status = fixture.fixture?.status?.short;
        return !["FT", "AET", "PEN", "CANC", "ABD", "AWD", "WO"].includes(
          status
        );
      });

      const calculatedScenarios = calculateBestScenarios(
        standingsData,
        pendingFixtures,
        selectedTeam,
        position
      );
      setScenarios(calculatedScenarios);

      const projection = calculateRealisticProjection(
        standingsData,
        calculatedScenarios,
        selectedTeam
      );
      setProjectedPosition(projection);
    } catch (error) {
      console.error("Error loading scenarios:", error);
    }

    setLoading(false);
  }, [selectedTeam]);

  useEffect(() => {
    loadScenariosData();
  }, [loadScenariosData]);

  useEffect(() => {
    if (projectedPosition && selectedTeamRef.current) {
      selectedTeamRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [projectedPosition]);

  const displayScenarios = showAllScenarios ? scenarios : scenarios.slice(0, 5);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
        <span className="ml-3 text-gray-300">
          Calculating best scenarios...
        </span>
      </div>
    );
  }

  const teamData = standings[teamPosition - 1];

  // Edge case: Team is 1st
  if (teamPosition === 1) {
    return (
      <div className="space-y-6">
        <div className="mb-6 text-center">
          <div className="flex items-center justify-center gap-4 mb-2">
            <h2 className="text-2xl font-bold text-white">
              Best Match Scenarios for {selectedTeam.name}
            </h2>
            <ShareButton onClick={() => setIsShareModalOpen(true)} />
          </div>
          <div className="flex items-center justify-center gap-2 mt-4">
            <Trophy className="w-8 h-8 text-yellow-400" />
            <span className="text-xl font-bold text-yellow-400">
              You're already 1st!
            </span>
          </div>
          <p className="mt-2 text-gray-400">
            Current Points:{" "}
            <span className="font-bold text-white">
              {teamData?.points || 0}
            </span>{" "}
            | Goal Difference:{" "}
            <span className="font-bold text-white">
              {teamData?.goalsDiff > 0 ? "+" : ""}
              {teamData?.goalsDiff || 0}
            </span>
          </p>
        </div>

        <div className="p-6 border rounded-lg bg-yellow-600/20 border-yellow-500/30">
          <h3 className="mb-3 text-lg font-bold text-white">
            Focus on Maintaining Your Lead
          </h3>
          <p className="text-gray-300">
            Win your matches and watch as teams below drop points. Your main
            threats are teams within striking distance.
          </p>

          {scenarios
            .filter((s) => s.type === "own_match")
            .map((scenario, index) => (
              <div
                key={index}
                className="p-4 mt-4 border rounded-lg bg-red-600/20 border-red-500/50"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-red-400 uppercase">
                    Your Next Match
                  </span>
                  <span className="text-sm text-gray-400">
                    {formatDate(scenario.fixture.fixture.date)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <img
                      src={scenario.fixture.teams.home.logo}
                      alt=""
                      className="w-6 h-6"
                    />
                    <span className="text-white">
                      {scenario.fixture.teams.home.name}
                    </span>
                  </div>
                  <span className="text-gray-400">vs</span>
                  <div className="flex items-center gap-2">
                    <span className="text-white">
                      {scenario.fixture.teams.away.name}
                    </span>
                    <img
                      src={scenario.fixture.teams.away.logo}
                      alt=""
                      className="w-6 h-6"
                    />
                  </div>
                </div>
              </div>
            ))}
        </div>

        {/* Share Modal */}
        <ShareModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          selectedTeam={selectedTeam}
          teamPosition={teamPosition}
          teamData={teamData}
          scenarios={scenarios}
          projectedPosition={projectedPosition}
          isPremium={false}
        />
      </div>
    );
  }

  // Edge case: Team is last
  if (teamPosition === standings.length) {
    return (
      <div className="space-y-6">
        <div className="mb-6 text-center">
          <div className="flex items-center justify-center gap-4 mb-2">
            <h2 className="text-2xl font-bold text-white">
              Best Match Scenarios for {selectedTeam.name}
            </h2>
            <ShareButton onClick={() => setIsShareModalOpen(true)} />
          </div>
          <p className="text-gray-400">
            Current Position:{" "}
            <span className="font-bold text-white">#{teamPosition} (Last)</span>{" "}
            with{" "}
            <span className="font-bold text-white">
              {teamData?.points || 0} points
            </span>{" "}
            | GD:{" "}
            <span className="font-bold text-white">
              {teamData?.goalsDiff > 0 ? "+" : ""}
              {teamData?.goalsDiff || 0}
            </span>
          </p>
        </div>

        <div className="p-6 border rounded-lg bg-orange-600/20 border-orange-500/30">
          <div className="flex items-start gap-3">
            <AlertTriangle className="flex-shrink-0 w-6 h-6 mt-1 text-orange-400" />
            <div>
              <h3 className="mb-2 text-lg font-bold text-white">
                Survival Mode
              </h3>
              <p className="text-gray-300">
                Focus on winning your own matches. Every point and every goal
                matters when you're at the bottom. Big wins will improve your
                goal difference for tiebreakers!
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {scenarios.slice(0, 5).map((scenario, index) => (
            <div
              key={index}
              className={`p-5 rounded-lg border ${getImpactColor(
                scenario.color
              )}`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  {getImpactIcon(scenario.impact)}
                  <span className="text-sm font-bold uppercase">
                    {scenario.impact} Impact
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Calendar className="w-4 h-4" />
                  <span>{formatDate(scenario.fixture.fixture.date)}</span>
                </div>
              </div>

              <div className="mb-4">
                <span className="px-3 py-1 text-sm font-bold rounded-full bg-white/10">
                  ✓ {scenario.recommendation}
                </span>
              </div>

              <div className="flex items-center justify-between mb-3 text-xs md:text-lg">
                <div className="flex items-center flex-1 gap-3">
                  <img
                    src={scenario.fixture.teams.home.logo}
                    alt=""
                    className="w-8 h-8"
                  />
                  <span className="font-semibold text-white">
                    {scenario.fixture.teams.home.name}
                  </span>
                </div>
                <span className="px-4 font-bold text-gray-400">VS</span>
                <div className="flex items-center justify-end flex-1 gap-3">
                  <span className="font-semibold text-white">
                    {scenario.fixture.teams.away.name}
                  </span>
                  <img
                    src={scenario.fixture.teams.away.logo}
                    alt=""
                    className="w-8 h-8"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-white/10">
                <p className="text-sm text-gray-300">{scenario.reason}</p>

                {scenario.gdNotes && scenario.gdNotes.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <p className="text-xs font-semibold text-purple-400 uppercase">
                      Goal Difference Scenarios:
                    </p>
                    {scenario.gdNotes.map((note, noteIndex) => (
                      <div
                        key={noteIndex}
                        className={`text-xs px-3 py-2 rounded-lg ${
                          note.type === "overtake"
                            ? "bg-green-600/20 text-green-400 border border-green-500/30"
                            : note.type === "threat"
                            ? "bg-red-600/20 text-red-400 border border-red-500/30"
                            : note.type === "warning"
                            ? "bg-orange-600/20 text-orange-400 border border-orange-500/30"
                            : note.type === "ahead"
                            ? "bg-blue-600/20 text-blue-400 border border-blue-500/30"
                            : "bg-gray-600/20 text-gray-400 border border-gray-500/30"
                        }`}
                      >
                        {note.type === "overtake" && "🎯 "}
                        {note.type === "ahead" && "✅ "}
                        {note.type === "warning" && "⚠️ "}
                        {note.type === "threat" && "🚨 "}
                        {note.message}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Share Modal */}
        <ShareModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          selectedTeam={selectedTeam}
          teamPosition={teamPosition}
          teamData={teamData}
          scenarios={scenarios}
          projectedPosition={projectedPosition}
          isPremium={false}
        />
      </div>
    );
  }

  // Normal case: Team is in middle of table
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-6 text-center">
        <div className="flex flex-col items-center justify-center gap-4 mb-2 sm:flex-row">
          <h2 className="text-2xl font-bold text-white">
            Best Match Scenarios for {selectedTeam.name}
          </h2>
          <ShareButton onClick={() => setIsShareModalOpen(true)} />
        </div>
        <p className="text-gray-400">
          Current Position:{" "}
          <span className="font-bold text-white">#{teamPosition}</span> with{" "}
          <span className="font-bold text-white">
            {teamData?.points || 0} points
          </span>{" "}
          | GD:{" "}
          <span
            className={`font-bold ${
              (teamData?.goalsDiff || 0) > 0
                ? "text-green-400"
                : (teamData?.goalsDiff || 0) < 0
                ? "text-red-400"
                : "text-white"
            }`}
          >
            {teamData?.goalsDiff > 0 ? "+" : ""}
            {teamData?.goalsDiff || 0}
          </span>
        </p>
        {currentRound && (
          <p className="mt-1 text-sm text-purple-400">
            Showing scenarios for: {currentRound}
          </p>
        )}
      </div>

      {/* No scenarios */}
      {scenarios.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-gray-400">
            No pending fixtures found for the current round
          </p>
        </div>
      ) : (
        <>
          {/* Scenario Cards */}
          <div className="space-y-4">
            {displayScenarios.map((scenario, index) => (
              <div
                key={index}
                className={`p-5 rounded-lg border ${getImpactColor(
                  scenario.color
                )}`}
              >
                {/* Impact Badge & Date */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    {getImpactIcon(scenario.impact)}
                    <span className="text-sm font-bold uppercase">
                      {scenario.impact} Impact
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(scenario.fixture.fixture.date)}</span>
                    <Clock className="w-4 h-4 ml-2" />
                    <span>{formatTime(scenario.fixture.fixture.date)}</span>
                  </div>
                </div>

                {/* Recommendation Badge */}
                <div className="mb-4">
                  <span className="px-3 py-1 text-sm font-bold rounded-full bg-white/10">
                    ✓ {scenario.recommendation}
                  </span>
                </div>

                {/* Match Details */}
                <div className="flex items-center justify-between mb-3 text-xs md:text-lg">
                  <div className="flex items-center flex-1 gap-3">
                    <img
                      src={scenario.fixture.teams.home.logo}
                      alt={scenario.fixture.teams.home.name}
                      className="w-8 h-8"
                    />
                    <span className="font-semibold text-white">
                      {scenario.fixture.teams.home.name}
                    </span>
                  </div>

                  <span className="px-4 font-bold text-gray-400">VS</span>

                  <div className="flex items-center justify-end flex-1 gap-3">
                    <span className="font-semibold text-white">
                      {scenario.fixture.teams.away.name}
                    </span>
                    <img
                      src={scenario.fixture.teams.away.logo}
                      alt={scenario.fixture.teams.away.name}
                      className="w-8 h-8"
                    />
                  </div>
                </div>

                {/* Reason */}
                <div className="pt-3 border-t border-white/10">
                  <p className="text-sm text-gray-300">
                    <span className="font-semibold">Why:</span>{" "}
                    {scenario.reason}
                  </p>

                  {/* Goal Difference Notes for own matches */}
                  {scenario.gdNotes && scenario.gdNotes.length > 0 && (
                    <div className="mt-3 space-y-2">
                      <p className="text-xs font-semibold text-purple-400 uppercase">
                        Goal Difference Scenarios:
                      </p>
                      {scenario.gdNotes.map((note, noteIndex) => (
                        <div
                          key={noteIndex}
                          className={`text-xs px-3 py-2 rounded-lg ${
                            note.type === "overtake"
                              ? "bg-green-600/20 text-green-400 border border-green-500/30"
                              : note.type === "threat"
                              ? "bg-red-600/20 text-red-400 border border-red-500/30"
                              : note.type === "warning"
                              ? "bg-orange-600/20 text-orange-400 border border-orange-500/30"
                              : note.type === "ahead"
                              ? "bg-blue-600/20 text-blue-400 border border-blue-500/30"
                              : "bg-gray-600/20 text-gray-400 border border-gray-500/30"
                          }`}
                        >
                          {note.type === "overtake" && "🎯 "}
                          {note.type === "ahead" && "✅ "}
                          {note.type === "warning" && "⚠️ "}
                          {note.type === "threat" && "🚨 "}
                          {note.message}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Show More/Less Button */}
          {scenarios.length > 5 && (
            <div className="flex justify-center">
              <button
                onClick={() => setShowAllScenarios(!showAllScenarios)}
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-purple-400 transition-all rounded-lg bg-purple-600/20 hover:bg-purple-600/30"
              >
                {showAllScenarios ? (
                  <>
                    <ChevronUp className="w-4 h-4" />
                    Show Less
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4" />
                    Show All {scenarios.length} Scenarios
                  </>
                )}
              </button>
            </div>
          )}
        </>
      )}

      {/* Projection Summary */}
      {scenarios.length > 0 && projectedPosition && (
        <div
          className={`mt-8 p-6 rounded-lg border ${
            projectedPosition.isImprovement
              ? "bg-green-600/20 border-green-500/30"
              : projectedPosition.isDecline
              ? "bg-red-600/20 border-red-500/30"
              : "bg-purple-600/20 border-purple-500/30"
          }`}
        >
          <h3 className="flex items-center gap-2 mb-3 text-lg font-bold text-white">
            {projectedPosition.isImprovement ? (
              <TrendingUp className="w-5 h-5 text-green-400" />
            ) : projectedPosition.isDecline ? (
              <TrendingDown className="w-5 h-5 text-red-400" />
            ) : (
              <Target className="w-5 h-5 text-purple-400" />
            )}
            Best Case Projection (This Round)
          </h3>

          <div className="space-y-2">
            <p className="text-gray-300">
              If all favorable scenarios happen, {selectedTeam.name} would have{" "}
              <span
                className={`font-bold ${
                  projectedPosition.isImprovement
                    ? "text-green-400"
                    : projectedPosition.isDecline
                    ? "text-red-400"
                    : "text-purple-400"
                }`}
              >
                {projectedPosition.projectedPoints} points
              </span>{" "}
              {projectedPosition.pointsGain > 0 && (
                <span className="text-green-400">
                  (+{projectedPosition.pointsGain})
                </span>
              )}
            </p>

            <p className="text-gray-300">
              Projected position:{" "}
              <span
                className={`text-xl font-bold ${
                  projectedPosition.isImprovement
                    ? "text-green-400"
                    : projectedPosition.isDecline
                    ? "text-red-400"
                    : "text-purple-400"
                }`}
              >
                #{projectedPosition.projectedPosition}
              </span>{" "}
              {projectedPosition.positionChange > 0 && (
                <span className="text-green-400">
                  (↑{projectedPosition.positionChange}{" "}
                  {projectedPosition.positionChange === 1 ? "place" : "places"})
                </span>
              )}
              {projectedPosition.positionChange < 0 && (
                <span className="text-red-400">
                  (↓{Math.abs(projectedPosition.positionChange)}{" "}
                  {Math.abs(projectedPosition.positionChange) === 1
                    ? "place"
                    : "places"}
                  )
                </span>
              )}
              {projectedPosition.positionChange === 0 && (
                <span className="text-gray-400">(no change)</span>
              )}
            </p>

            <p className="mt-2 text-xs text-gray-500">
              💡 Note: Position projections assume standard wins. Check GD
              scenarios above for exact goal margins needed to overtake teams on
              equal points.
            </p>
          </div>

          {/* Projected Table */}
          <div className="pt-4 mt-4 border-t border-white/10">
            <p className="mb-2 text-sm font-semibold text-gray-400">
              Projected Table After This Round:
            </p>
            <div className="pr-2 space-y-1 overflow-y-auto max-h-64">
              {projectedPosition.sortedTable.map((team, idx) => (
                <div
                  key={team.id}
                  ref={team.id === selectedTeam.id ? selectedTeamRef : null}
                  className={`text-sm flex justify-between py-2 px-3 rounded ${
                    team.id === selectedTeam.id
                      ? projectedPosition.isImprovement
                        ? "bg-green-500/20 border border-green-500/40 text-green-400 font-bold"
                        : "bg-purple-500/20 border border-purple-500/40 text-purple-400 font-bold"
                      : "text-gray-400 hover:bg-white/5"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span
                      className={
                        team.id === selectedTeam.id
                          ? projectedPosition.isImprovement
                            ? "text-green-400"
                            : "text-purple-400"
                          : "text-gray-500"
                      }
                    >
                      {idx + 1}.
                    </span>
                    {team.name}
                  </span>
                  <span className="flex items-center gap-3">
                    <span className="text-xs text-gray-500">
                      GD: {team.goalsDiff > 0 ? "+" : ""}
                      {team.goalsDiff}
                    </span>
                    <span>
                      {team.projectedPoints} pts
                      {team.projectedPoints !== team.currentPoints && (
                        <span
                          className={`text-xs ml-1 ${
                            team.projectedPoints > team.currentPoints
                              ? "text-green-400"
                              : "text-gray-500"
                          }`}
                        >
                          (
                          {team.projectedPoints > team.currentPoints ? "+" : ""}
                          {team.projectedPoints - team.currentPoints})
                        </span>
                      )}
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </div>

          <p className="mt-4 text-sm text-gray-400">
            ⚡ Focus on the{" "}
            <span className="font-semibold text-white">
              {scenarios.filter((s) => s.impact === "critical").length} critical
            </span>{" "}
            and{" "}
            <span className="font-semibold text-white">
              {scenarios.filter((s) => s.impact === "high").length} high-impact
            </span>{" "}
            matches!
          </p>
        </div>
      )}

      {/* Share Modal */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        selectedTeam={selectedTeam}
        teamPosition={teamPosition}
        teamData={teamData}
        scenarios={scenarios}
        projectedPosition={projectedPosition}
        isPremium={false}
      />
    </div>
  );
}

export default BestScenarios;
