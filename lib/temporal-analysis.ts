import {
  AIEnhancedCommit,
  TemporalAnalysis,
  HourlyDistribution,
  DailyDistribution,
  TemporalPattern,
  VelocityData,
  QualityTimeCorrelation,
} from '@/types';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/**
 * Analyze temporal patterns in commits
 */
export function analyzeTemporalPatterns(commits: AIEnhancedCommit[]): TemporalAnalysis {
  const hourlyDistribution = calculateHourlyDistribution(commits);
  const dailyDistribution = calculateDailyDistribution(commits);
  const patterns = detectTemporalPatterns(commits, hourlyDistribution, dailyDistribution);
  const velocity = calculateVelocity(commits);
  const qualityTimeCorrelation = analyzeQualityTimeCorrelation(commits, hourlyDistribution);
  const heatmapData = generateHeatmapData(commits);
  const contributorPatterns = analyzeContributorPatterns(commits);

  return {
    hourlyDistribution,
    dailyDistribution,
    patterns,
    velocity,
    qualityTimeCorrelation,
    heatmapData,
    contributorPatterns,
  };
}

/**
 * Calculate hourly distribution of commits
 */
function calculateHourlyDistribution(commits: AIEnhancedCommit[]): HourlyDistribution[] {
  const hourData: { count: number; totalScore: number }[] = Array.from(
    { length: 24 },
    () => ({ count: 0, totalScore: 0 })
  );

  for (const commit of commits) {
    const date = new Date(commit.timestamp);
    const hour = date.getHours();
    const score = commit.enhancedScore?.overallScore ?? commit.score.overallScore;

    hourData[hour].count++;
    hourData[hour].totalScore += score;
  }

  return hourData.map((data, hour) => ({
    hour,
    count: data.count,
    averageScore: data.count > 0 ? Math.round(data.totalScore / data.count) : 0,
  }));
}

/**
 * Calculate daily distribution of commits
 */
function calculateDailyDistribution(commits: AIEnhancedCommit[]): DailyDistribution[] {
  const dayData: { count: number; totalScore: number }[] = Array.from(
    { length: 7 },
    () => ({ count: 0, totalScore: 0 })
  );

  for (const commit of commits) {
    const date = new Date(commit.timestamp);
    const day = date.getDay();
    const score = commit.enhancedScore?.overallScore ?? commit.score.overallScore;

    dayData[day].count++;
    dayData[day].totalScore += score;
  }

  return dayData.map((data, day) => ({
    day,
    dayName: DAY_NAMES[day],
    count: data.count,
    averageScore: data.count > 0 ? Math.round(data.totalScore / data.count) : 0,
  }));
}

/**
 * Detect temporal patterns from commit data
 */
function detectTemporalPatterns(
  commits: AIEnhancedCommit[],
  hourlyDist: HourlyDistribution[],
  dailyDist: DailyDistribution[]
): TemporalPattern {
  // Weekend commits (Saturday + Sunday)
  const totalCommits = commits.length;
  const weekendCommits = dailyDist[0].count + dailyDist[6].count;
  const isWeekendCommitter = weekendCommits / totalCommits > 0.2;

  // Night owl (10pm - 6am)
  const nightCommits = hourlyDist
    .filter((h) => h.hour >= 22 || h.hour < 6)
    .reduce((sum, h) => sum + h.count, 0);
  const isNightOwl = nightCommits / totalCommits > 0.25;

  // Early bird (5am - 9am)
  const earlyCommits = hourlyDist
    .filter((h) => h.hour >= 5 && h.hour < 9)
    .reduce((sum, h) => sum + h.count, 0);
  const isEarlyBird = earlyCommits / totalCommits > 0.2;

  // Working hours ratio (9am - 5pm)
  const workingHoursCommits = hourlyDist
    .filter((h) => h.hour >= 9 && h.hour < 17)
    .reduce((sum, h) => sum + h.count, 0);
  const workingHoursRatio = totalCommits > 0 ? workingHoursCommits / totalCommits : 0;

  // Most active hour
  const mostActiveHour = hourlyDist.reduce(
    (max, h) => (h.count > max.count ? h : max),
    hourlyDist[0]
  ).hour;

  // Most active day
  const mostActiveDay = dailyDist.reduce(
    (max, d) => (d.count > max.count ? d : max),
    dailyDist[0]
  ).dayName;

  return {
    isWeekendCommitter,
    isNightOwl,
    isEarlyBird,
    workingHoursRatio: Math.round(workingHoursRatio * 100) / 100,
    mostActiveHour,
    mostActiveDay,
  };
}

/**
 * Calculate weekly velocity metrics
 */
function calculateVelocity(commits: AIEnhancedCommit[]): VelocityData[] {
  if (commits.length === 0) return [];

  // Group commits by week
  const weekMap = new Map<string, { commits: AIEnhancedCommit[]; lines: number; totalScore: number }>();

  for (const commit of commits) {
    const date = new Date(commit.timestamp);
    const weekKey = getWeekKey(date);

    if (!weekMap.has(weekKey)) {
      weekMap.set(weekKey, { commits: [], lines: 0, totalScore: 0 });
    }

    const weekData = weekMap.get(weekKey)!;
    weekData.commits.push(commit);
    weekData.lines += commit.stats.total;
    weekData.totalScore += commit.enhancedScore?.overallScore ?? commit.score.overallScore;
  }

  // Convert to array and sort by week
  return Array.from(weekMap.entries())
    .map(([week, data]) => ({
      week,
      commitCount: data.commits.length,
      linesChanged: data.lines,
      averageScore: Math.round(data.totalScore / data.commits.length),
    }))
    .sort((a, b) => a.week.localeCompare(b.week));
}

/**
 * Get ISO week key for a date
 */
function getWeekKey(date: Date): string {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const yearStart = new Date(d.getFullYear(), 0, 1);
  const weekNumber = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${d.getFullYear()}-W${weekNumber.toString().padStart(2, '0')}`;
}

/**
 * Analyze correlation between commit timing and quality
 */
function analyzeQualityTimeCorrelation(
  commits: AIEnhancedCommit[],
  hourlyDist: HourlyDistribution[]
): QualityTimeCorrelation {
  // Calculate hourly correlation
  const hoursWithCommits = hourlyDist.filter((h) => h.count > 0);
  const hourlyCorrelation = calculateCorrelation(
    hoursWithCommits.map((h) => h.hour),
    hoursWithCommits.map((h) => h.averageScore)
  );

  // Calculate daily correlation
  const dayScores = commits.map((c) => ({
    day: new Date(c.timestamp).getDay(),
    score: c.enhancedScore?.overallScore ?? c.score.overallScore,
  }));
  const dayCorrelation = calculateCorrelation(
    dayScores.map((d) => d.day),
    dayScores.map((d) => d.score)
  );

  // Find best and worst hours
  const sortedHours = [...hoursWithCommits].sort((a, b) => b.averageScore - a.averageScore);
  const bestHours = sortedHours.slice(0, 3).map((h) => h.hour);
  const worstHours = sortedHours.slice(-3).reverse().map((h) => h.hour);

  return {
    hourlyCorrelation: Math.round(hourlyCorrelation * 100) / 100,
    dayCorrelation: Math.round(dayCorrelation * 100) / 100,
    bestHours,
    worstHours,
  };
}

/**
 * Calculate Pearson correlation coefficient
 */
function calculateCorrelation(x: number[], y: number[]): number {
  if (x.length !== y.length || x.length < 2) return 0;

  const n = x.length;
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
  const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
  const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);

  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

  if (denominator === 0) return 0;
  return numerator / denominator;
}

/**
 * Generate heatmap data (7 days x 24 hours)
 */
function generateHeatmapData(commits: AIEnhancedCommit[]): number[][] {
  // Initialize 7x24 matrix
  const heatmap: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0));

  for (const commit of commits) {
    const date = new Date(commit.timestamp);
    const day = date.getDay();
    const hour = date.getHours();
    heatmap[day][hour]++;
  }

  return heatmap;
}

/**
 * Analyze temporal patterns per contributor
 */
function analyzeContributorPatterns(
  commits: AIEnhancedCommit[]
): Record<string, TemporalPattern> {
  // Group commits by contributor
  const contributorCommits = new Map<string, AIEnhancedCommit[]>();

  for (const commit of commits) {
    const email = commit.author.email.toLowerCase();
    if (!contributorCommits.has(email)) {
      contributorCommits.set(email, []);
    }
    contributorCommits.get(email)!.push(commit);
  }

  // Analyze patterns for each contributor
  const patterns: Record<string, TemporalPattern> = {};

  for (const [email, contribCommits] of contributorCommits) {
    if (contribCommits.length < 3) continue; // Skip contributors with few commits

    const hourlyDist = calculateHourlyDistribution(contribCommits);
    const dailyDist = calculateDailyDistribution(contribCommits);
    patterns[email] = detectTemporalPatterns(contribCommits, hourlyDist, dailyDist);
  }

  return patterns;
}

/**
 * Flag unusual temporal patterns
 */
export function flagUnusualPatterns(analysis: TemporalAnalysis): string[] {
  const flags: string[] = [];

  if (analysis.patterns.isNightOwl) {
    flags.push('High volume of late-night commits (10pm-6am) - may indicate deadline pressure or timezone differences');
  }

  if (analysis.patterns.isWeekendCommitter) {
    flags.push('Significant weekend commit activity (>20%) - consider work-life balance');
  }

  if (analysis.patterns.workingHoursRatio < 0.3) {
    flags.push('Low working hours ratio - most commits made outside 9am-5pm');
  }

  // Check for highly variable velocity
  if (analysis.velocity.length >= 4) {
    const counts = analysis.velocity.map((v) => v.commitCount);
    const avg = counts.reduce((a, b) => a + b, 0) / counts.length;
    const variance = counts.reduce((sum, c) => sum + Math.pow(c - avg, 2), 0) / counts.length;
    const stdDev = Math.sqrt(variance);
    const cv = stdDev / avg;

    if (cv > 1) {
      flags.push('Highly variable commit velocity - consider more consistent development pace');
    }
  }

  // Check quality-time correlation
  if (analysis.qualityTimeCorrelation.hourlyCorrelation < -0.3) {
    flags.push('Commit quality decreases at certain hours - consider scheduling important work during peak quality times');
  }

  return flags;
}
