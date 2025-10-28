import { useState, useEffect } from "react";
import { fetchStandings, fetchFixtures } from "../services/footballApi";
import {
  TrendingUp,
  Target,
  Award,
  Calendar,
  Clock,
  Loader2,
} from "lucide-react";

function BestScenarios({ selectedTeam }) {
  const [scenarios, setScenarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [standings, setStandings] = useState([]);
  const [teamPosition, setTeamPosition] = useState(0);

  useEffect(() => {
    loadScenariosData();
  }, [selectedTeam]);

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
        };
      }

      if (scenario) {
        scenariosList.push(scenario);
      }
    });

    // Sort by importance (critical > high > medium)
    return scenariosList.sort((a, b) => b.importance - a.importance);
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
  const possiblePositionImprovement = Math.max(
    1,
    teamPosition -
      scenarios.filter((s) => s.impact === "critical" || s.impact === "high")
        .length
  );

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">
          Best Match Scenarios for {selectedTeam.name}
        </h2>

        <p className="text-gray-400">
          Current Position:{" "}
          <span className="text-white font-bold">#{teamPosition}</span> with{" "}
          <span className="text-white font-bold">
            {teamData?.points || 0} points
          </span>
        </p>
      </div>

      {scenarios.length === 0 ? (
        <div className="text-center py-12">
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
                  <span className="font-bold uppercase text-sm">
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
                <span className="px-3 py-1 bg-white/10 rounded-full text-sm font-bold">
                  ✓ {scenario.recommendation}
                </span>
              </div>

              {/* Match Details */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3 flex-1">
                  <img
                    src={scenario.fixture.teams.home.logo}
                    alt={scenario.fixture.teams.home.name}
                    className="w-8 h-8"
                  />
                  <span className="text-white font-semibold">
                    {scenario.fixture.teams.home.name}
                  </span>
                </div>

                <span className="text-gray-400 font-bold px-4">VS</span>

                <div className="flex items-center gap-3 flex-1 justify-end">
                  <span className="text-white font-semibold">
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
                  <p className="text-xs text-gray-400 mt-1">
                    {scenario.extraInfo}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Summary */}
      {scenarios.length > 0 && (
        <div className="mt-8 p-6 bg-purple-600/20 border border-purple-500/30 rounded-lg">
          <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Potential Position Change
          </h3>
          <p className="text-gray-300">
            If all favorable scenarios happen, {selectedTeam.name} could
            potentially climb to position{" "}
            <span className="text-green-400 font-bold">
              #{possiblePositionImprovement}
            </span>
          </p>
          <p className="text-sm text-gray-400 mt-2">
            Focus on the{" "}
            {
              scenarios.filter(
                (s) => s.impact === "critical" || s.impact === "high"
              ).length
            }{" "}
            critical and high-impact matches!
          </p>
        </div>
      )}
    </div>
  );
}

export default BestScenarios;
