import { useEffect, useState } from "react";
import { fetchStandings } from "../services/footballApi";
import { RefreshCw } from "lucide-react";
import { TableSkeleton } from "./LoadingSkeleton";
import ErrorDisplay from "./ErrorDisplay";

function Standings({ selectedTeam }) {
  const [standings, setStandings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadStandings();
  }, []);

  const loadStandings = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchStandings();
      setStandings(data);
    } catch (err) {
      setError(err.message || "Failed to load standings");
      console.error("Error loading standings:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadStandings();
    setRefreshing(false);
  };

  if (loading) {
    return <TableSkeleton />;
  }

  if (error) {
    return <ErrorDisplay message={error} onRetry={loadStandings} />;
  }

  const getTeamPosition = () => {
    return standings.findIndex((team) => team.team.id === selectedTeam.id) + 1;
  };

  const teamPosition = getTeamPosition();
  const teamData = standings[teamPosition - 1];

  return (
    <div>
      {/* Refresh Button */}
      <div className="flex justify-end mb-4">
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-semibold transition-all disabled:opacity-50"
        >
          <RefreshCw
            className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
          />
          {refreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10 text-gray-400 text-sm">
              <th className="text-left py-3 px-4">Pos</th>
              <th className="text-left py-3 px-4">Team</th>
              <th className="text-center py-3 px-2">P</th>
              <th className="text-center py-3 px-2">W</th>
              <th className="text-center py-3 px-2">D</th>
              <th className="text-center py-3 px-2">L</th>
              <th className="text-center py-3 px-2">GD</th>
              <th className="text-center py-3 px-2 font-bold">Pts</th>
            </tr>
          </thead>
          <tbody>
            {standings.map((team) => {
              const isSelectedTeam = team.team.id === selectedTeam.id;
              return (
                <tr
                  key={team.team.id}
                  className={`border-b border-white/5 hover:bg-white/5 transition-colors ${
                    isSelectedTeam
                      ? "bg-purple-600/20 border-purple-500/50"
                      : ""
                  }`}
                >
                  <td className="py-3 px-4 text-gray-300 font-semibold">
                    {team.rank}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={team.team.logo}
                        alt={team.team.name}
                        className="w-6 h-6"
                        loading="lazy"
                      />
                      <span
                        className={`font-medium ${
                          isSelectedTeam
                            ? "text-white font-bold"
                            : "text-gray-200"
                        }`}
                      >
                        {team.team.name}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-2 text-center text-gray-300">
                    {team.all.played}
                  </td>
                  <td className="py-3 px-2 text-center text-gray-300">
                    {team.all.win}
                  </td>
                  <td className="py-3 px-2 text-center text-gray-300">
                    {team.all.draw}
                  </td>
                  <td className="py-3 px-2 text-center text-gray-300">
                    {team.all.lose}
                  </td>
                  <td className="py-3 px-2 text-center text-gray-300">
                    {team.goalsDiff > 0 ? "+" : ""}
                    {team.goalsDiff}
                  </td>
                  <td className="py-3 px-2 text-center font-bold text-white">
                    {team.points}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {teamPosition > 0 && teamData && (
        <div className="mt-6 p-4 bg-purple-600/20 border border-purple-500/30 rounded-lg">
          <p className="text-white font-semibold text-center">
            🎯 {selectedTeam.name} is currently in position {teamPosition} with{" "}
            {teamData.points} points
          </p>
        </div>
      )}
    </div>
  );
}

export default Standings;
