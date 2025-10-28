import { Globe, Calendar } from "lucide-react";

const LEAGUES = [
  { id: 39, name: "Premier League", country: "England", flag: "🏴󐁧󐁢󐁥󐁮󐁧󐁿" },
  { id: 140, name: "La Liga", country: "Spain", flag: "🇪🇸" },
  { id: 78, name: "Bundesliga", country: "Germany", flag: "🇩🇪" },
  { id: 135, name: "Serie A", country: "Italy", flag: "🇮🇹" },
  { id: 61, name: "Ligue 1", country: "France", flag: "🇫🇷" },
];

const SEASONS = [
  { year: 2025, label: "2025/26" },
  { year: 2024, label: "2024/25" },
  { year: 2023, label: "2023/24" },
  { year: 2022, label: "2022/23" },
];

function LeagueSelector({
  selectedLeague,
  selectedSeason,
  onLeagueChange,
  onSeasonChange,
}) {
  return (
    <div className="flex flex-col md:flex-row gap-3 w-full">
      {/* League Selector */}
      <div className="flex-1">
        <label className="flex items-center gap-2 text-sm font-semibold text-white mb-2">
          <Globe className="w-4 h-4" />
          League
        </label>
        <select
          value={selectedLeague}
          onChange={(e) => onLeagueChange(parseInt(e.target.value))}
          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-purple-500"
        >
          {LEAGUES.map((league) => (
            <option key={league.id} value={league.id} className="bg-slate-800">
              {league.flag} {league.name} - {league.country}
            </option>
          ))}
        </select>
      </div>

      {/* Season Selector */}
      <div className="flex-1">
        <label className="flex items-center gap-2 text-sm font-semibold text-white mb-2">
          <Calendar className="w-4 h-4" />
          Season
        </label>
        <select
          value={selectedSeason}
          onChange={(e) => onSeasonChange(parseInt(e.target.value))}
          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-purple-500"
        >
          {SEASONS.map((season) => (
            <option
              key={season.year}
              value={season.year}
              className="bg-slate-800"
            >
              {season.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

export default LeagueSelector;
export { LEAGUES, SEASONS };
