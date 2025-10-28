import { useState, useEffect, useRef } from "react";
import { Search, X, Loader2, ChevronDown } from "lucide-react";
import { fetchAllTeams } from "../services/footballApi";

function TeamSelector({ selectedTeam, onTeamSelect }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dropdownPosition, setDropdownPosition] = useState({
    top: 0,
    left: 0,
    width: 0,
  });
  const buttonRef = useRef(null);

  useEffect(() => {
    const loadTeams = async () => {
      const data = await fetchAllTeams();
      setTeams(data);
      setLoading(false);
    };
    loadTeams();
  }, []);

  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 8,
        left: rect.left,
        width: rect.width,
      });
    }
  }, [isOpen]);

  const filteredTeams = teams.filter((team) =>
    team.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = (team) => {
    onTeamSelect(team);
    setIsOpen(false);
    setSearchTerm("");
  };

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  return (
    <>
      {/* Selected Team Button */}
      <div className="relative w-full md:w-72 ">
        <button
          ref={buttonRef}
          onClick={handleToggle}
          className="w-full flex items-center gap-3 px-4 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg transition-all"
        >
          {selectedTeam ? (
            <>
              <img
                src={selectedTeam.logo}
                alt={selectedTeam.name}
                className="w-8 h-8"
              />
              <span className="text-white font-semibold truncate flex-1 text-left">
                {selectedTeam.name}
              </span>
            </>
          ) : (
            <span className="text-gray-400 flex-1 text-left">
              Select a team...
            </span>
          )}
          <ChevronDown
            className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </button>
      </div>

      {/* Fixed Position Dropdown (Modal-style) */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            style={{ zIndex: 999 }}
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown Menu */}
          <div
            className="fixed bg-slate-900 border-2 border-purple-500 rounded-lg shadow-2xl overflow-hidden"
            style={{
              zIndex: 1000,
              top: `${dropdownPosition.top}px`,
              left: `${dropdownPosition.left}px`,
              width: `${dropdownPosition.width}px`,
              maxHeight: "400px",
            }}
          >
            {/* Search */}
            <div className="p-3 border-b border-white/10 bg-slate-900">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search teams..."
                  className="w-full pl-10 pr-10 py-2 bg-slate-800 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                  autoFocus
                />
                {searchTerm && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSearchTerm("");
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                  >
                    <X className="w-4 h-4 text-gray-400 hover:text-white" />
                  </button>
                )}
              </div>
            </div>

            {/* Teams List */}
            <div
              className="overflow-y-auto bg-slate-900"
              style={{ maxHeight: "320px" }}
            >
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
                </div>
              ) : (
                <>
                  {filteredTeams.map((team) => (
                    <button
                      key={team.id}
                      onClick={() => handleSelect(team)}
                      className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-purple-600/20 transition-colors ${
                        selectedTeam?.id === team.id ? "bg-purple-600/30" : ""
                      }`}
                    >
                      <img
                        src={team.logo}
                        alt={team.name}
                        className="w-6 h-6 flex-shrink-0"
                      />
                      <span className="text-white font-medium text-left">
                        {team.name}
                      </span>
                    </button>
                  ))}

                  {filteredTeams.length === 0 && (
                    <div className="p-8 text-center text-gray-400">
                      No teams found
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}

export default TeamSelector;
