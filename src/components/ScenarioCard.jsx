import { forwardRef } from "react";
import { TrendingUp, TrendingDown, Target, Trophy } from "lucide-react";

const ScenarioCard = forwardRef(
  (
    {
      selectedTeam,
      teamPosition,
      teamData,
      scenarios,
      projectedPosition,
      //   isPremium = false,
    },
    ref
  ) => {
    // const getOrdinalSuffix = (num) => {
    //   const j = num % 10;
    //   const k = num % 100;
    //   if (j === 1 && k !== 11) return num + "st";
    //   if (j === 2 && k !== 12) return num + "nd";
    //   if (j === 3 && k !== 13) return num + "rd";
    //   return num + "th";
    // };

    const criticalScenarios = scenarios
      .filter((s) => s.impact === "critical" || s.impact === "high")
      .slice(0, 3);

    const positionChange = projectedPosition?.positionChange || 0;
    const isImprovement = positionChange > 0;
    const isDecline = positionChange < 0;

    return (
      <div
        ref={ref}
        className="w-[400px] bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6 rounded-2xl border border-purple-500/30 shadow-2xl"
        style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}
      >
        {/* Header with Team */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <img
              src={selectedTeam.logo}
              alt={selectedTeam.name}
              className="w-12 h-12"
              crossOrigin="anonymous"
            />
            <div>
              <h2 className="text-xl font-bold text-white">
                {selectedTeam.name}
              </h2>
              <p className="text-sm text-purple-300">Best Scenarios</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400">Current Position</p>
            <p className="text-2xl font-bold text-white">#{teamPosition}</p>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-3 p-3 mb-6 rounded-xl bg-black/30">
          <div className="text-center">
            <p className="text-xs text-gray-400">Points</p>
            <p className="text-lg font-bold text-white">
              {teamData?.points || 0}
            </p>
          </div>
          <div className="text-center border-x border-white/10">
            <p className="text-xs text-gray-400">Goal Diff</p>
            <p
              className={`text-lg font-bold ${
                (teamData?.goalsDiff || 0) > 0
                  ? "text-green-400"
                  : (teamData?.goalsDiff || 0) < 0
                  ? "text-red-400"
                  : "text-white"
              }`}
            >
              {teamData?.goalsDiff > 0 ? "+" : ""}
              {teamData?.goalsDiff || 0}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-400">Projected</p>
            <p
              className={`text-lg font-bold ${
                isImprovement
                  ? "text-green-400"
                  : isDecline
                  ? "text-red-400"
                  : "text-purple-400"
              }`}
            >
              #{projectedPosition?.projectedPosition || teamPosition}
            </p>
          </div>
        </div>

        {/* Position Change Banner */}
        {positionChange !== 0 && (
          <div
            className={`flex items-center justify-center gap-2 p-3 mb-6 rounded-xl ${
              isImprovement
                ? "bg-green-600/20 border border-green-500/30"
                : "bg-red-600/20 border border-red-500/30"
            }`}
          >
            {isImprovement ? (
              <TrendingUp className="w-5 h-5 text-green-400" />
            ) : (
              <TrendingDown className="w-5 h-5 text-red-400" />
            )}
            <span
              className={`font-bold ${
                isImprovement ? "text-green-400" : "text-red-400"
              }`}
            >
              {isImprovement ? "↑" : "↓"} {Math.abs(positionChange)}{" "}
              {Math.abs(positionChange) === 1 ? "place" : "places"} possible!
            </span>
          </div>
        )}

        {/* Key Scenarios */}
        <div className="mb-6">
          <p className="mb-3 text-xs font-semibold tracking-wider text-purple-400 uppercase">
            Key Scenarios This Round
          </p>
          <div className="space-y-2">
            {criticalScenarios.length > 0 ? (
              criticalScenarios.map((scenario, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 rounded-lg bg-white/5"
                >
                  <div
                    className={`w-2 h-2 rounded-full ${
                      scenario.impact === "critical"
                        ? "bg-red-500"
                        : "bg-yellow-500"
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-sm">
                      <img
                        src={scenario.fixture.teams.home.logo}
                        alt=""
                        className="w-4 h-4"
                        crossOrigin="anonymous"
                      />
                      <span className="text-gray-300 truncate">
                        {scenario.fixture.teams.home.name}
                      </span>
                      <span className="text-gray-500">vs</span>
                      <span className="text-gray-300 truncate">
                        {scenario.fixture.teams.away.name}
                      </span>
                      <img
                        src={scenario.fixture.teams.away.logo}
                        alt=""
                        className="w-4 h-4"
                        crossOrigin="anonymous"
                      />
                    </div>
                  </div>
                  <span
                    className={`text-xs font-bold px-2 py-1 rounded ${
                      scenario.recommendation === "WIN"
                        ? "bg-green-600/30 text-green-400"
                        : scenario.recommendation === "DRAW"
                        ? "bg-yellow-600/30 text-yellow-400"
                        : "bg-blue-600/30 text-blue-400"
                    }`}
                  >
                    {scenario.recommendation.length > 12
                      ? scenario.recommendation.split(" ")[0]
                      : scenario.recommendation}
                  </span>
                </div>
              ))
            ) : (
              <div className="p-3 text-sm text-center text-gray-400 rounded-lg bg-white/5">
                No pending scenarios
              </div>
            )}
          </div>
        </div>

        {/* GD Scenarios (if own match exists) */}
        {scenarios.find((s) => s.type === "own_match")?.gdNotes?.length > 0 && (
          <div className="p-3 mb-6 border rounded-xl bg-green-600/10 border-green-500/20">
            <p className="mb-2 text-xs font-semibold text-green-400">
              🎯 Goal Target
            </p>
            <p className="text-sm text-gray-300">
              {
                scenarios.find((s) => s.type === "own_match").gdNotes[0]
                  ?.message
              }
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-white/10">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-purple-400" />
            <span className="text-sm font-semibold text-purple-400">
              PL Position Tracker
            </span>
          </div>
          <span className="text-xs text-gray-500">
            {new Date().toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </span>
        </div>

        {/* Watermark for free users */}
        {/* {!isPremium && (
          <div className="mt-4 text-center">
            <span className="text-[10px] text-gray-600 tracking-wider">
              🔒 Upgrade to remove watermark • pltracker.com
            </span>
          </div>
        )} */}
      </div>
    );
  }
);

ScenarioCard.displayName = "ScenarioCard";

export default ScenarioCard;
