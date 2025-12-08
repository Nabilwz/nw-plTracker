import { useState } from "react";
import { Trophy, Target, TrendingUp, Calculator } from "lucide-react";
import TeamSelector from "./components/TeamSelector";
import Standings from "./components/Standings";
import Fixtures from "./components/Fixtures";
import BestScenarios from "./components/BestScenarios";
import Simulator from "./components/Simulator";
import ErrorBoundary from "./components/ErrorBoundary";
import FixtureDifficulty from "./components/FixtureDifficulty";
import { BarChart3 } from "lucide-react"; // Add this icon
import RivalTracker from "./components/RivalTracker";
import { Swords } from "lucide-react"; // Add this icon
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
        <header className="border-b bg-black/30 backdrop-blur-sm border-white/10">
          <div className="px-4 py-4 mx-auto max-w-7xl md:py-6">
            <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
              <div className="flex items-center gap-3">
                <Trophy className="w-6 h-6 text-purple-400 md:w-8 md:h-8" />
                <h1 className="text-xl font-bold text-white md:text-2xl">
                  PL Position Tracker
                </h1>
              </div>

              {/* Team Selector */}

              <div className="flex items-center gap-2 text-xs text-gray-300 md:text-sm">
                <span className="px-2 py-1 font-semibold bg-red-600 rounded-full md:px-3">
                  LIVE
                </span>
                <span>Premier League 2025/26</span>
              </div>
            </div>
          </div>
        </header>
        <div className="flex justify-center w-full mt-3 md:w-auto">
          <TeamSelector
            selectedTeam={selectedTeam}
            onTeamSelect={setSelectedTeam}
          />
        </div>

        {/* Navigation Tabs */}
        <div className="px-4 mx-auto mt-6 max-w-7xl">
          <div className="grid grid-cols-2 gap-2 p-1 border rounded-lg md:flex bg-black/20 backdrop-blur-sm border-white/10">
            <button
              onClick={() => setActiveTab("standings")}
              className={`flex items-center justify-center gap-2 px-3 md:px-4 py-3 rounded-md transition-all ${
                activeTab === "standings"
                  ? "bg-purple-600 text-white"
                  : "text-gray-300 hover:bg-white/5"
              }`}
            >
              <Trophy className="w-5 h-5" />
              <span className="text-sm font-semibold md:text-base">
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
              <span className="text-sm font-semibold md:text-base">
                Fixtures
              </span>
            </button>
            <button
              onClick={() => setActiveTab("difficulty")}
              className={`flex items-center justify-center gap-2 px-3 md:px-4 py-3 rounded-md transition-all ${
                activeTab === "difficulty"
                  ? "bg-purple-600 text-white"
                  : "text-gray-300 hover:bg-white/5"
              }`}
            >
              <BarChart3 className="w-5 h-5" />
              <span className="text-sm font-semibold md:text-base">
                Difficulty
              </span>
            </button>
            <button
              onClick={() => setActiveTab("rival")}
              className={`flex items-center justify-center gap-2 px-3 md:px-4 py-3 rounded-md transition-all ${
                activeTab === "rival"
                  ? "bg-purple-600 text-white"
                  : "text-gray-300 hover:bg-white/5"
              }`}
            >
              <Swords className="w-5 h-5" />
              <span className="text-sm font-semibold md:text-base">Rival</span>
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
              <span className="text-sm font-semibold md:text-base">
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
              <span className="text-sm font-semibold md:text-base">
                Simulator
              </span>
            </button>
          </div>
        </div>

        {/* Main Content */}
        <main className="px-4 py-8 mx-auto max-w-7xl">
          <div className="p-8 border bg-white/5 backdrop-blur-sm rounded-xl border-white/10">
            {activeTab === "standings" && (
              <Standings selectedTeam={selectedTeam} />
            )}
            {activeTab === "fixtures" && (
              <Fixtures selectedTeam={selectedTeam} />
            )}
            {activeTab === "difficulty" && (
              <FixtureDifficulty selectedTeam={selectedTeam} />
            )}
            {activeTab === "rival" && (
              <RivalTracker selectedTeam={selectedTeam} />
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
        <footer className="mt-12 border-t bg-black/30 backdrop-blur-sm border-white/10">
          <div className="px-4 py-6 mx-auto max-w-7xl">
            <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
              <div className="text-sm text-center text-gray-400 md:text-left">
                <p>
                  Built by{" "}
                  <span className="font-semibold text-white">Nabil Wazze</span>
                </p>
                <p className="mt-1 text-xs">
                  Track your favorite team's league position & best scenarios
                </p>
              </div>
              <div className="flex gap-4">
                <a
                  href="https://newnabil.netlify.app/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 text-sm font-semibold text-white transition-all bg-purple-600 rounded-lg hover:bg-purple-700"
                >
                  View Portfolio
                </a>
                <a
                  href="https://github.com/nabilwazze"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 text-sm font-semibold text-white transition-all rounded-lg bg-white/10 hover:bg-white/20"
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
