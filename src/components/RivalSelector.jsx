import { useState, useEffect } from "react";
import { X, Search, Swords } from "lucide-react";
import { fetchAllTeams } from "../services/footballApi";

function RivalSelector({
  isOpen,
  onClose,
  onSelect,
  currentTeamId,
  currentRivalId,
}) {
  const [teams, setTeams] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      loadTeams();
    }
  }, [isOpen]);

  const loadTeams = async () => {
    setLoading(true);
    const teamsData = await fetchAllTeams();
    setTeams(teamsData);
    setLoading(false);
  };

  const filteredTeams = teams.filter(
    (team) =>
      team.id !== currentTeamId &&
      team.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-md overflow-hidden border shadow-2xl bg-gradient-to-br from-slate-900 via-purple-900/50 to-slate-900 rounded-2xl border-purple-500/30">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Swords className="w-5 h-5 text-red-400" />
            <h3 className="text-lg font-bold text-white">Select Your Rival</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 transition-colors rounded-lg hover:text-white hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-white/10">
          <div className="relative">
            <Search className="absolute w-5 h-5 text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
            <input
              type="text"
              placeholder="Search teams..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full py-3 pl-10 pr-4 text-white placeholder-gray-400 border rounded-lg bg-white/10 border-white/10 focus:outline-none focus:border-purple-500"
            />
          </div>
        </div>

        {/* Team List */}
        <div className="overflow-y-auto max-h-96">
          {loading ? (
            <div className="py-8 text-center text-gray-400">
              Loading teams...
            </div>
          ) : filteredTeams.length === 0 ? (
            <div className="py-8 text-center text-gray-400">No teams found</div>
          ) : (
            <div className="p-2">
              {filteredTeams.map((team) => (
                <button
                  key={team.id}
                  onClick={() => {
                    onSelect(team);
                    onClose();
                  }}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all ${
                    team.id === currentRivalId
                      ? "bg-red-600/30 border border-red-500/50"
                      : "hover:bg-white/10"
                  }`}
                >
                  <img src={team.logo} alt={team.name} className="w-8 h-8" />
                  <span className="font-semibold text-white">{team.name}</span>
                  {team.id === currentRivalId && (
                    <span className="ml-auto text-xs font-bold text-red-400">
                      CURRENT RIVAL
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Popular Rivals Suggestion */}
        <div className="p-4 border-t border-white/10 bg-black/20">
          <p className="mb-2 text-xs font-semibold text-gray-400 uppercase">
            Classic Rivalries
          </p>
          <div className="flex flex-wrap gap-2">
            {[
              "Liverpool",
              "Manchester City",
              "Arsenal",
              "Chelsea",
              "Tottenham",
            ].map((name) => {
              const team = teams.find((t) =>
                t.name.toLowerCase().includes(name.toLowerCase())
              );
              if (!team || team.id === currentTeamId) return null;
              return (
                <button
                  key={name}
                  onClick={() => {
                    onSelect(team);
                    onClose();
                  }}
                  className="px-3 py-1 text-sm font-semibold text-gray-300 transition-all rounded-full bg-white/10 hover:bg-red-600/30 hover:text-red-400"
                >
                  {name}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default RivalSelector;
