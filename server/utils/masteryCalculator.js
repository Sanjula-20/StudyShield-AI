/**
 * Topic Mastery Calculator Engine (09_PROGRESS_AND_ANALYTICS.md)
 * 
 * Multi-Factor Formula Inputs:
 * 1. Assessment Performance (A): 45% weight (latest score or recent avg)
 * 2. Previous Mastery (M_prev): 25% weight (historical score smoothing)
 * 3. Focused Learning Time (T): 15% weight (scaled up to 60 minutes)
 * 4. Session Frequency (F): 15% weight (scaled up to 5 sessions)
 */

function calculateTopicMastery({
  assessmentScore = 0,
  previousMastery = 0,
  totalSessions = 1,
  totalFocusedMinutes = 0,
  recentScores = []
}) {
  const avgRecent = recentScores.length > 0 
    ? recentScores.reduce((sum, val) => sum + val, 0) / recentScores.length 
    : assessmentScore;

  const scoreWeight = 0.45 * avgRecent;
  const prevWeight = 0.25 * (previousMastery || avgRecent);
  const timeFactor = Math.min(100, (totalFocusedMinutes / 60) * 100) * 0.15;
  const sessionFactor = Math.min(100, (totalSessions / 5) * 100) * 0.15;

  const rawScore = Math.round(scoreWeight + prevWeight + timeFactor + sessionFactor);
  const finalScore = Math.max(0, Math.min(100, rawScore));

  let trend = 'stable';
  if (finalScore > (previousMastery || 0) + 2) {
    trend = 'improving';
  } else if (finalScore < (previousMastery || 0) - 2) {
    trend = 'declining';
  }

  return {
    masteryScore: finalScore,
    previousScore: previousMastery || 0,
    trend,
    totalSessions,
    totalFocusedMinutes,
    averageScore: Math.round(avgRecent)
  };
}

module.exports = { calculateTopicMastery };
