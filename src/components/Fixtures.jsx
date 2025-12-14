import { useState, useEffect } from "react";
import { fetchFixtures } from "../services/footballApi";
import { Calendar, Clock, RefreshCw } from "lucide-react";
import { FixtureSkeleton } from "./LoadingSkeleton";
import ErrorDisplay from "./ErrorDisplay";

function Fixtures({ selectedTeam }) {
  const [fixtures, setFixtures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadFixtures();
  }, []);

  const loadFixtures = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchFixtures();
      setFixtures(data);
    } catch (err) {
      setError(err.message || "Failed to load fixtures");
      console.error("Error loading fixtures:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadFixtures();
    setRefreshing(false);
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
    return <FixtureSkeleton />;
  }

  if (error) {
    return <ErrorDisplay message={error} onRetry={loadFixtures} />;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 mb-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-bold text-white">Upcoming Fixtures</h2>
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

      {fixtures.map((fixture) => {
        const isSelectedTeamMatch =
          fixture.teams.home.id === selectedTeam.id ||
          fixture.teams.away.id === selectedTeam.id;

        return (
          <div
            key={fixture.fixture.id}
            className={`p-4 rounded-lg border transition-all ${
              isSelectedTeamMatch
                ? "bg-purple-600/20 border-purple-500/50"
                : "bg-white/5 border-white/10"
            }`}
          >
            <div className="flex flex-col gap-2 mb-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-2 text-sm text-gray-400">
                <Calendar className="w-4 h-4" />
                <span>{formatDate(fixture.fixture.date)}</span>
                <Clock className="w-4 h-4 ml-2" />
                <span>{formatTime(fixture.fixture.date)}</span>
              </div>
              <div className="flex items-center justify-start gap-2 sm:justify-end">
                {isSelectedTeamMatch && (
                  <span className="px-2 py-1 bg-purple-600 text-white text-xs font-bold rounded">
                    {selectedTeam.name.toUpperCase()}
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:justify-between">
              {/* Home Team */}
              <div className="flex items-center justify-center gap-3 flex-1">
                <img
                  src={fixture.teams.home.logo}
                  alt={fixture.teams.home.name}
                  className="w-8 h-8"
                  loading="lazy"
                />
                <span className="text-white font-semibold text-center sm:text-left">
                  {fixture.teams.home.name}
                </span>
              </div>

              {/* VS */}
              <div className="px-4">
                <span className="font-bold text-gray-400">VS</span>
              </div>

              {/* Away Team */}
              <div className="flex items-center justify-center gap-3 flex-1 sm:justify-end">
                <span className="text-white font-semibold text-center sm:text-right">
                  {fixture.teams.away.name}
                </span>
                <img
                  src={fixture.teams.away.logo}
                  alt={fixture.teams.away.name}
                  className="w-8 h-8"
                  loading="lazy"
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default Fixtures;
