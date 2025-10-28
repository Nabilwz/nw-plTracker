const API_KEY = import.meta.env.VITE_API_KEY;
const BASE_URL = "https://v3.football.api-sports.io";

export const fetchStandings = async () => {
  try {
    const response = await fetch(
      `${BASE_URL}/standings?league=39&season=2025`,
      {
        method: "GET",
        headers: {
          "x-rapidapi-key": API_KEY,
          "x-rapidapi-host": "v3.football.api-sports.io",
        },
      }
    );
    const data = await response.json();

    if (!data.response || data.response.length === 0) {
      console.error("No standings data");
      return [];
    }

    return data.response[0].league.standings[0];
  } catch (error) {
    console.error("Error fetching standings:", error);
    return [];
  }
};

export const fetchFixtures = async (round = null) => {
  try {
    const url = round
      ? `${BASE_URL}/fixtures?league=39&season=2025&round=${round}`
      : `${BASE_URL}/fixtures?league=39&season=2025&next=10`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "x-rapidapi-key": API_KEY,
        "x-rapidapi-host": "v3.football.api-sports.io",
      },
    });
    const data = await response.json();
    return data.response || [];
  } catch (error) {
    console.error("Error fetching fixtures:", error);
    return [];
  }
};

export const fetchAllTeams = async () => {
  try {
    const response = await fetch(`${BASE_URL}/teams?league=39&season=2025`, {
      method: "GET",
      headers: {
        "x-rapidapi-key": API_KEY,
        "x-rapidapi-host": "v3.football.api-sports.io",
      },
    });
    const data = await response.json();

    if (!data.response) return [];

    return data.response.map((item) => ({
      id: item.team.id,
      name: item.team.name,
      logo: item.team.logo,
    }));
  } catch (error) {
    console.error("Error fetching teams:", error);
    return [];
  }
};

export const fetchRounds = async () => {
  try {
    const response = await fetch(
      `${BASE_URL}/fixtures/rounds?league=39&season=2025&current=false`,
      {
        method: "GET",
        headers: {
          "x-rapidapi-key": API_KEY,
          "x-rapidapi-host": "v3.football.api-sports.io",
        },
      }
    );
    const data = await response.json();
    return data.response || [];
  } catch (error) {
    console.error("Error fetching rounds:", error);
    return [];
  }
};
