import { useState, useEffect, useRef } from "react";
import { fetchStandings, fetchFixtures } from "../services/footballApi";
import {
  TrendingUp,
  Target,
  Award,
  Calendar,
  Clock,
  Loader2,
  AlertTriangle,
} from "lucide-react";

function BestScenarios({ selectedTeam }) {
  const [scenarios, setScenarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [standings, setStandings] = useState([]);
  const [teamPosition, setTeamPosition] = useState(0);
  const [projectedPosition, setProjectedPosition] = useState(null);
  const selectedTeamRef = useRef(null);

  useEffect(() => {
    loadScenariosData();
  }, [selectedTeam]);

  useEffect(() => {
    // Auto-scroll to selected team in projected table
    if (projectedPosition && selectedTeamRef.current) {
      selectedTeamRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [projectedPosition]);

  const loadScenariosData = async () => {
    setLoading(true);

    // Fetch both standings and fixtures
    const [standingsData, fixturesData] = await Promise.all([
      fetchStandings(),
      fetchFixtures(),
    ]);

    setStandings(standingsData);

    // Find selected team position
    const position =
      standingsData.findIndex((t) => t.team.id === selectedTeam.id) + 1;
    setTeamPosition(position);

    // Calculate best scenarios
    const calculatedScenarios = calculateBestScenarios(
      standingsData,
      fixturesData,
      selectedTeam,
      position
    );
    setScenarios(calculatedScenarios);

    // Calculate realistic projected position
    const projection = calculateRealisticProjection(
      standingsData,
      calculatedScenarios,
      selectedTeam
    );
    setProjectedPosition(projection);

    setLoading(false);
  };

  const calculateBestScenarios = (
    standings,
    fixtures,
    selectedTeam,
    position
  ) => {
    // Get teams above selected team
    const teamsAbove = standings.slice(0, position - 1);
    const teamsAboveIds = teamsAbove.map((t) => t.team.id);

    const scenariosList = [];

    fixtures.forEach((fixture) => {
      const homeTeam = fixture.teams.home;
      const awayTeam = fixture.teams.away;

      const homeIsAbove = teamsAboveIds.includes(homeTeam.id);
      const awayIsAbove = teamsAboveIds.includes(awayTeam.id);
      const isSelectedTeamMatch =
        homeTeam.id === selectedTeam.id || awayTeam.id === selectedTeam.id;

      let scenario = null;

      // If selected team is playing
      if (isSelectedTeamMatch) {
        scenario = {
          fixture,
          recommendation: "WIN",
          impact: "critical",
          reason: `${selectedTeam.name} must win to gain 3 crucial points and improve position`,
          color: "red",
          importance: 10,
          pointsGained: 3, // Selected team gains 3 points
          affectedTeams: [{ id: selectedTeam.id, pointsChange: 3 }],
        };
      }
      // If both teams are above selected team
      else if (homeIsAbove && awayIsAbove) {
        const homePos =
          standings.findIndex((t) => t.team.id === homeTeam.id) + 1;
        const awayPos =
          standings.findIndex((t) => t.team.id === awayTeam.id) + 1;

        scenario = {
          fixture,
          recommendation: "DRAW",
          impact: "high",
          reason: `Both teams drop 2 points instead of one gaining 3. Best for ${selectedTeam.name} to catch up`,
          color: "yellow",
          importance: 8,
          extraInfo: `${homeTeam.name} (${homePos}th) vs ${awayTeam.name} (${awayPos}th)`,
          affectedTeams: [
            { id: homeTeam.id, pointsChange: 1 },
            { id: awayTeam.id, pointsChange: 1 },
          ],
        };
      }
      // If home team is above selected team
      else if (homeIsAbove) {
        const homePos =
          standings.findIndex((t) => t.team.id === homeTeam.id) + 1;

        scenario = {
          fixture,
          recommendation: `${awayTeam.name} WIN`,
          impact: "medium",
          reason: `${homeTeam.name} (${homePos}th) would drop points, helping ${selectedTeam.name} close the gap`,
          color: "blue",
          importance: 5,
          affectedTeams: [
            { id: homeTeam.id, pointsChange: 0 }, // Home loses, gets 0 points
            { id: awayTeam.id, pointsChange: 3 },
          ],
        };
      }
      // If away team is above selected team
      else if (awayIsAbove) {
        const awayPos =
          standings.findIndex((t) => t.team.id === awayTeam.id) + 1;

        scenario = {
          fixture,
          recommendation: `${homeTeam.name} WIN`,
          impact: "medium",
          reason: `${awayTeam.name} (${awayPos}th) would drop points, helping ${selectedTeam.name} close the gap`,
          color: "blue",
          importance: 5,
          affectedTeams: [
            { id: homeTeam.id, pointsChange: 3 },
            { id: awayTeam.id, pointsChange: 0 }, // Away loses, gets 0 points
          ],
        };
      }

      if (scenario) {
        scenariosList.push(scenario);
      }
    });

    // Sort by importance (critical > high > medium)
    return scenariosList.sort((a, b) => b.importance - a.importance);
  };

  const calculateRealisticProjection = (standings, scenarios, selectedTeam) => {
    // Create a map of current points for all teams
    const teamPoints = {};
    standings.forEach((team) => {
      teamPoints[team.team.id] = {
        currentPoints: team.points,
        projectedPoints: team.points,
        name: team.team.name,
        goalsDiff: team.goalsDiff,
      };
    });

    // Apply all favorable scenario outcomes
    scenarios.forEach((scenario) => {
      if (scenario.affectedTeams) {
        scenario.affectedTeams.forEach((affected) => {
          if (teamPoints[affected.id]) {
            teamPoints[affected.id].projectedPoints += affected.pointsChange;
          }
        });
      }
    });

    // Get selected team's projected points
    const selectedTeamData = teamPoints[selectedTeam.id];
    const selectedTeamProjectedPoints = selectedTeamData.projectedPoints;

    // Sort teams by projected points
    const sortedTeams = Object.entries(teamPoints)
      .map(([id, data]) => ({
        id: parseInt(id),
        ...data,
      }))
      .sort((a, b) => {
        // Sort by projected points, then by goal difference
        if (b.projectedPoints !== a.projectedPoints) {
          return b.projectedPoints - a.projectedPoints;
        }
        return b.goalsDiff - a.goalsDiff;
      });

    // Find the position of selected team in the projected table
    const selectedTeamProjectedPosition =
      sortedTeams.findIndex((t) => t.id === selectedTeam.id) + 1;

    // Get current position
    const currentPosition =
      standings.findIndex((t) => t.team.id === selectedTeam.id) + 1;

    return {
      currentPosition,
      projectedPosition: selectedTeamProjectedPosition,
      currentPoints: selectedTeamData.currentPoints,
      projectedPoints: selectedTeamProjectedPoints,
      pointsGain: selectedTeamProjectedPoints - selectedTeamData.currentPoints,
      isRealistic: selectedTeamProjectedPosition < currentPosition,
      positionChange: currentPosition - selectedTeamProjectedPosition,
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

  return (
    <div className="space-y-6">
      <div className="mb-6 text-center">
        <h2 className="mb-2 text-2xl font-bold text-white">
          Best Match Scenarios for {selectedTeam.name}
        </h2>

        <p className="text-gray-400">
          Current Position:{" "}
          <span className="font-bold text-white">#{teamPosition}</span> with{" "}
          <span className="font-bold text-white">
            {teamData?.points || 0} points
          </span>
        </p>
      </div>

      {scenarios.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-gray-400">No upcoming fixtures found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {scenarios.map((scenario, index) => (
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
                  <span className="font-semibold">Why:</span> {scenario.reason}
                </p>
                {scenario.extraInfo && (
                  <p className="mt-1 text-xs text-gray-400">
                    {scenario.extraInfo}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Improved Summary with Realistic Calculation */}
      {scenarios.length > 0 && projectedPosition && (
        <div
          className={`mt-8 p-6 rounded-lg border ${
            projectedPosition.isRealistic
              ? "bg-purple-600/20 border-purple-500/30"
              : "bg-orange-600/20 border-orange-500/30"
          }`}
        >
          <h3 className="flex items-center gap-2 mb-3 text-lg font-bold text-white">
            <TrendingUp className="w-5 h-5" />
            Realistic Position Projection
          </h3>

          {projectedPosition.isRealistic ? (
            <>
              <div className="space-y-2">
                <p className="text-gray-300">
                  If all favorable scenarios happen, {selectedTeam.name} would
                  have{" "}
                  <span className="font-bold text-green-400">
                    {projectedPosition.projectedPoints} points
                  </span>{" "}
                  (
                  <span className="text-green-400">
                    +{projectedPosition.pointsGain}
                  </span>
                  )
                </p>
                <p className="text-gray-300">
                  Projected position:{" "}
                  <span className="text-xl font-bold text-green-400">
                    #{projectedPosition.projectedPosition}
                  </span>{" "}
                  {projectedPosition.positionChange > 0 && (
                    <span className="text-green-400">
                      (↑{projectedPosition.positionChange}{" "}
                      {projectedPosition.positionChange === 1
                        ? "place"
                        : "places"}
                      )
                    </span>
                  )}
                </p>
              </div>

              {/* Show full projected table */}
              <div className="pt-4 mt-4 border-t border-white/10">
                <p className="mb-2 text-sm font-semibold text-gray-400">
                  Projected Table:
                </p>
                <div className="pr-2 space-y-1 overflow-y-auto max-h-64">
                  {projectedPosition.sortedTable.map((team, idx) => (
                    <div
                      key={team.id}
                      ref={team.id === selectedTeam.id ? selectedTeamRef : null}
                      className={`text-sm flex justify-between py-2 px-3 rounded ${
                        team.id === selectedTeam.id
                          ? "bg-green-500/20 border border-green-500/40 text-green-400 font-bold"
                          : "text-gray-400 hover:bg-white/5"
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span
                          className={
                            team.id === selectedTeam.id
                              ? "text-green-400"
                              : "text-gray-500"
                          }
                        >
                          {idx + 1}.
                        </span>
                        {team.name}
                      </span>
                      <span>
                        {team.projectedPoints} pts
                        {team.projectedPoints !== team.currentPoints && (
                          <span
                            className={`text-xs ml-1 ${
                              team.id === selectedTeam.id
                                ? "text-green-300"
                                : "text-gray-500"
                            }`}
                          >
                            (+{team.projectedPoints - team.currentPoints})
                          </span>
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <p className="mt-4 text-sm text-gray-400">
                Focus on the{" "}
                {
                  scenarios.filter(
                    (s) => s.impact === "critical" || s.impact === "high"
                  ).length
                }{" "}
                critical and high-impact matches!
              </p>
            </>
          ) : (
            <div className="flex items-start gap-3">
              <AlertTriangle className="flex-shrink-0 w-5 h-5 mt-1 text-orange-400" />
              <div>
                <p className="text-gray-300">
                  Even if all favorable scenarios happen, {selectedTeam.name}{" "}
                  would have{" "}
                  <span className="font-bold text-orange-400">
                    {projectedPosition.projectedPoints} points
                  </span>{" "}
                  and remain at position{" "}
                  <span className="font-bold text-orange-400">
                    #{projectedPosition.projectedPosition}
                  </span>
                </p>
                <p className="mt-2 text-sm text-gray-400">
                  The teams above would still have more points. Focus on winning
                  your own matches and hope for multiple upsets!
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default BestScenarios;
