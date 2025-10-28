const STORAGE_KEY = "pl_tracker_predictions";

export const savePredictions = (league, season, round, predictions, teamId) => {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    const key = `${league}_${season}_${round}_${teamId}`;
    saved[key] = {
      predictions,
      timestamp: new Date().toISOString(),
      league,
      season,
      round,
      teamId,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
    return true;
  } catch (error) {
    console.error("Failed to save predictions:", error);
    return false;
  }
};

export const loadPredictions = (league, season, round, teamId) => {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    const key = `${league}_${season}_${round}_${teamId}`;
    return saved[key]?.predictions || null;
  } catch (error) {
    console.error("Failed to load predictions:", error);
    return null;
  }
};

export const getSavedPredictions = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    return Object.values(saved).sort(
      (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
    );
  } catch (error) {
    console.error("Failed to get saved predictions:", error);
    return [];
  }
};

export const deletePrediction = (league, season, round, teamId) => {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    const key = `${league}_${season}_${round}_${teamId}`;
    delete saved[key];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
    return true;
  } catch (error) {
    console.error("Failed to delete prediction:", error);
    return false;
  }
};
