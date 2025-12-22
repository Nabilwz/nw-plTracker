// Google Analytics Tracking Utility

const GA_MEASUREMENT_ID = "G-3MLGBWN9NK";

// Track page/tab views
export const trackPageView = (pageName) => {
  if (window.gtag) {
    window.gtag("event", "page_view", {
      page_title: pageName,
      page_location: window.location.href,
    });
  }
};

// Track feature usage (which tabs are popular)
export const trackFeature = (featureName, details = {}) => {
  if (window.gtag) {
    window.gtag("event", "feature_used", {
      feature_name: featureName,
      ...details,
    });
  }
};

// Track team selection (which teams are most popular)
export const trackTeamSelect = (teamName, teamId) => {
  if (window.gtag) {
    window.gtag("event", "team_selected", {
      team_name: teamName,
      team_id: teamId,
    });
  }
};

// Track share actions
export const trackShare = (platform, contentType) => {
  if (window.gtag) {
    window.gtag("event", "share", {
      method: platform,
      content_type: contentType,
    });
  }
};

// Track simulation runs
export const trackSimulation = (scenarioType, roundsCount) => {
  if (window.gtag) {
    window.gtag("event", "simulation_run", {
      scenario_type: scenarioType,
      rounds_count: roundsCount,
    });
  }
};

// Track rival selection
export const trackRivalSelect = (rivalName, userTeamName) => {
  if (window.gtag) {
    window.gtag("event", "rival_selected", {
      rival_name: rivalName,
      user_team: userTeamName,
    });
  }
};
