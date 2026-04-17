export default {
  tournament: {
    year: 2026,
    name: "Masters Tournament",
    venueName: "Augusta National Golf Club",
    par: 72,
    tournamentId: "401811941",
    // Use the ESPN tournamentId URL for a stable final leaderboard page.
    leaderboardUrl: "https://www.espn.com/golf/leaderboard/_/tournamentId/401811941",
    // Masters stats page provides hole yardage/par; hole names are optional and may be missing.
    mastersHoleStatsUrl: "https://www.masters.com/en_US/course/index.html",
    // Optional fallback course page if you want to try to recover hole names.
    mastersCourseUrl: "https://www.masters.com/en_US/course/index.html",
    top10Mode: "position_lte_10" // or "first_10_rows"
  },
  espn: {
    eventName: "Masters Tournament",
    seasonYear: 2026,
    headless: true,
    timeoutMs: 45000,
    throttleMs: 350,
    maxConcurrency: 3
  },
  output: {
    root: "pipeline/out",
    rawDir: "pipeline/out/raw",
    generatedDir: "pipeline/out/generated",
    syncTargets: ["src/data", "public/data"]
  },
  files: {
    automated: [
      "tournament.json",
      "winner.json",
      "winner_scorecard.json",
      "winner_profile.json",
      "all_player_scorecards.json",
      "all_player_tournament_stats.json",
      "course_hole_stats.json",
      "methodology.json"
    ]
  }
};
