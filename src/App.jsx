import { useState } from "react";
import { Trophy, Target, TrendingUp, Calculator } from "lucide-react";
import TeamSelector from "./components/TeamSelector";
import Standings from "./components/Standings";
import Fixtures from "./components/Fixtures";
import BestScenarios from "./components/BestScenarios";
import Simulator from "./components/Simulator";
import ErrorBoundary from "./components/ErrorBoundary";

function App() {
  const [activeTab, setActiveTab] = useState("standings");
  const [selectedTeam, setSelectedTeam] = useState({
    id: 33,
    name: "Manchester United",
    logo: "https://media.api-sports.io/football/teams/33.png",
  });

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        {/* Header */}
        <header className="bg-black/30 backdrop-blur-sm border-b border-white/10">
          <div className="max-w-7xl mx-auto px-4 py-4 md:py-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Trophy className="w-6 h-6 md:w-8 md:h-8 text-purple-400" />
                <h1 className="text-xl md:text-2xl font-bold text-white">
                  PL Position Tracker
                </h1>
              </div>

              {/* Team Selector */}

              <div className="flex items-center gap-2 text-xs md:text-sm text-gray-300">
                <span className="px-2 md:px-3 py-1 bg-red-600 rounded-full font-semibold">
                  LIVE
                </span>
                <span>Premier League 2025/26</span>
              </div>
            </div>
          </div>
        </header>
        <div className="w-full md:w-auto mt-3 flex justify-center">
          <TeamSelector
            selectedTeam={selectedTeam}
            onTeamSelect={setSelectedTeam}
          />
        </div>

        {/* Navigation Tabs */}
        <div className="max-w-7xl mx-auto px-4 mt-6">
          <div className="grid grid-cols-2 md:flex gap-2 bg-black/20 backdrop-blur-sm p-1 rounded-lg border border-white/10">
            <button
              onClick={() => setActiveTab("standings")}
              className={`flex items-center justify-center gap-2 px-3 md:px-4 py-3 rounded-md transition-all ${
                activeTab === "standings"
                  ? "bg-purple-600 text-white"
                  : "text-gray-300 hover:bg-white/5"
              }`}
            >
              <Trophy className="w-5 h-5" />
              <span className="font-semibold text-sm md:text-base">
                Standings
              </span>
            </button>
            <button
              onClick={() => setActiveTab("fixtures")}
              className={`flex items-center justify-center gap-2 px-3 md:px-4 py-3 rounded-md transition-all ${
                activeTab === "fixtures"
                  ? "bg-purple-600 text-white"
                  : "text-gray-300 hover:bg-white/5"
              }`}
            >
              <Target className="w-5 h-5" />
              <span className="font-semibold text-sm md:text-base">
                Fixtures
              </span>
            </button>
            <button
              onClick={() => setActiveTab("scenarios")}
              className={`flex items-center justify-center gap-2 px-3 md:px-4 py-3 rounded-md transition-all ${
                activeTab === "scenarios"
                  ? "bg-purple-600 text-white"
                  : "text-gray-300 hover:bg-white/5"
              }`}
            >
              <TrendingUp className="w-5 h-5" />
              <span className="font-semibold text-sm md:text-base">
                Scenarios
              </span>
            </button>
            <button
              onClick={() => setActiveTab("simulator")}
              className={`flex items-center justify-center gap-2 px-3 md:px-4 py-3 rounded-md transition-all ${
                activeTab === "simulator"
                  ? "bg-purple-600 text-white"
                  : "text-gray-300 hover:bg-white/5"
              }`}
            >
              <Calculator className="w-5 h-5" />
              <span className="font-semibold text-sm md:text-base">
                Simulator
              </span>
            </button>
          </div>
        </div>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 py-8">
          <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-8">
            {activeTab === "standings" && (
              <Standings selectedTeam={selectedTeam} />
            )}
            {activeTab === "fixtures" && (
              <Fixtures selectedTeam={selectedTeam} />
            )}
            {activeTab === "scenarios" && (
              <BestScenarios selectedTeam={selectedTeam} />
            )}
            {activeTab === "simulator" && (
              <Simulator selectedTeam={selectedTeam} />
            )}
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-black/30 backdrop-blur-sm border-t border-white/10 mt-12">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="text-gray-400 text-sm text-center md:text-left">
                <p>
                  Built by{" "}
                  <span className="text-white font-semibold">Nabil Wazze</span>
                </p>
                <p className="text-xs mt-1">
                  Track your favorite team's league position & best scenarios
                </p>
              </div>
              <div className="flex gap-4">
                <a
                  href="https://newnabil.netlify.app/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-semibold transition-all"
                >
                  View Portfolio
                </a>
                <a
                  href="https://github.com/nabilwazze"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-semibold transition-all"
                >
                  GitHub
                </a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </ErrorBoundary>
  );
}

export default App;
