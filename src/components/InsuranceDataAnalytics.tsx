import React, { useState, useMemo } from 'react';
import {
  Line, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ComposedChart, ReferenceLine
} from 'recharts';
import {
  Target, BarChart3, Activity,
  Zap, Calendar, Filter, ChevronDown, ChevronUp, AlertTriangle,
  CheckCircle2, XCircle, ArrowUpRight, ArrowDownRight, Sparkles,
  Brain, Lightbulb, Network, UserPlus, Users,
  MessageSquare, Star, Crown, Info,
  Shield, Building2, AlertCircle, ThumbsUp, Download, FileSpreadsheet,
  Trophy, Flame
} from 'lucide-react';
import { exportToCSV } from '../utils/metricsUtils';

// Personal goals storage key
const GOALS_STORAGE_KEY = 'insurance_analytics_goals';

// ============================================================================
// INDUSTRY BENCHMARKS (2024-2025 Research Data)
// Sources: Belkins, Expandi, Alsona, InsureSoft, InsightSoftware
// ============================================================================
const INDUSTRY_BENCHMARKS = {
  linkedin: {
    acceptanceRate: {
      poor: 15,
      average: 29.61, // Industry standard benchmark
      good: 40,
      excellent: 50,
      elite: 60
    },
    replyRate: {
      poor: 3,
      average: 7.22, // Expandi benchmark
      good: 15,
      excellent: 25,
      elite: 35
    },
    // Best days for outreach
    bestDays: {
      acceptance: ['Monday', 'Thursday', 'Wednesday'],
      reply: ['Tuesday', 'Monday', 'Wednesday']
    },
    // Message optimization
    personalization: {
      noMessage: 5.44, // Reply rate without message
      withMessage: 9.36, // Reply rate with personalized message
      multiTouch: 11.87 // Reply rate with multi-touch campaign
    }
  },
  insurance: {
    quoteToBindRate: {
      poor: 10,
      average: 25,
      good: 35,
      excellent: 45
    },
    contactRate: {
      poor: 20,
      average: 40,
      good: 55,
      excellent: 70
    },
    customerRetention: {
      poor: 70,
      average: 80,
      good: 88,
      excellent: 95
    },
    leadConversion: {
      basic: 7.2,
      withLeadScoring: 12.8 // HubSpot 2023 data
    }
  }
};

// Performance tier thresholds
const PERFORMANCE_TIERS = {
  elite: { min: 50, label: 'Elite', color: '#8B5CF6', icon: Crown },
  excellent: { min: 40, label: 'Excellent', color: '#10B981', icon: Star },
  good: { min: 29.61, label: 'Above Benchmark', color: '#13BCC5', icon: ThumbsUp },
  average: { min: 20, label: 'Average', color: '#F59E0B', icon: Activity },
  needsWork: { min: 0, label: 'Needs Improvement', color: '#EF4444', icon: AlertTriangle }
};

// Chart colors
const CHART_COLORS = ['#13BCC5', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#3B82F6', '#EC4899', '#6366F1'];
const COLORS = {
  primary: '#13BCC5',
  secondary: '#1b1e4c',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  purple: '#8B5CF6',
  blue: '#3B82F6'
};

interface WeekMetric {
  id: string;
  rowIndex: number;
  status: string;
  campaign: string;
  message: string;
  audience: string;
  agent: string;
  acceptanceRate: string;
  replies: string;
  replyPercent: string;
  defyLead: string;
  target: string;
  algoType: string;
  weekEnd: string;
  location: string;
  queue: string;
  totalInvited: string;
  totalAccepted: string;
  netNewConnects: string;
  startingConnects: string;
  endingConnections: string;
  totalMessaged: string;
  totalActions: string;
}

interface InsuranceDataAnalyticsProps {
  metrics: WeekMetric[];
  allMetrics?: WeekMetric[];
  selectedAgent?: string;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================
const parseNum = (val: string | undefined): number => {
  if (!val) return 0;
  const cleaned = val.replace(/[%,]/g, '').trim();
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
};

const formatNumber = (num: number): string => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toFixed(0);
};

const getPerformanceTier = (acceptanceRate: number): typeof PERFORMANCE_TIERS[keyof typeof PERFORMANCE_TIERS] & { key: string } => {
  if (acceptanceRate >= PERFORMANCE_TIERS.elite.min) return { ...PERFORMANCE_TIERS.elite, key: 'elite' };
  if (acceptanceRate >= PERFORMANCE_TIERS.excellent.min) return { ...PERFORMANCE_TIERS.excellent, key: 'excellent' };
  if (acceptanceRate >= PERFORMANCE_TIERS.good.min) return { ...PERFORMANCE_TIERS.good, key: 'good' };
  if (acceptanceRate >= PERFORMANCE_TIERS.average.min) return { ...PERFORMANCE_TIERS.average, key: 'average' };
  return { ...PERFORMANCE_TIERS.needsWork, key: 'needsWork' };
};

// Linear regression for predictions
const linearRegression = (data: number[]): { slope: number; intercept: number; r2: number } => {
  const n = data.length;
  if (n < 2) return { slope: 0, intercept: data[0] || 0, r2: 0 };

  const xMean = (n - 1) / 2;
  const yMean = data.reduce((a, b) => a + b, 0) / n;

  let ssXY = 0, ssXX = 0, ssYY = 0;
  for (let i = 0; i < n; i++) {
    ssXY += (i - xMean) * (data[i] - yMean);
    ssXX += (i - xMean) ** 2;
    ssYY += (data[i] - yMean) ** 2;
  }

  const slope = ssXX !== 0 ? ssXY / ssXX : 0;
  const intercept = yMean - slope * xMean;
  const r2 = ssYY !== 0 ? (ssXY ** 2) / (ssXX * ssYY) : 0;

  return { slope, intercept, r2 };
};

// Predict future values
const predictFuture = (data: number[], periods: number): number[] => {
  const { slope, intercept } = linearRegression(data);
  const predictions: number[] = [];
  for (let i = 0; i < periods; i++) {
    const predicted = slope * (data.length + i) + intercept;
    predictions.push(Math.max(0, predicted));
  }
  return predictions;
};

// Calculate confidence interval
const calculateConfidenceInterval = (data: number[], confidence: number = 0.95): { lower: number; upper: number; mean: number } => {
  const n = data.length;
  if (n === 0) return { lower: 0, upper: 0, mean: 0 };

  const mean = data.reduce((a, b) => a + b, 0) / n;
  const stdDev = Math.sqrt(data.reduce((sq, val) => sq + (val - mean) ** 2, 0) / n);
  const z = confidence === 0.95 ? 1.96 : confidence === 0.99 ? 2.576 : 1.645;
  const margin = z * (stdDev / Math.sqrt(n));

  return { lower: mean - margin, upper: mean + margin, mean };
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================
// Goal type definition
interface PersonalGoal {
  id: string;
  agentName: string;
  metric: 'acceptanceRate' | 'replyRate' | 'invited' | 'accepted';
  target: number;
  createdAt: string;
}

const InsuranceDataAnalytics: React.FC<InsuranceDataAnalyticsProps> = ({ metrics, allMetrics, selectedAgent }) => {
  const [activeTab, setActiveTab] = useState<'executive' | 'performance' | 'benchmarks' | 'predictions' | 'insights'>('executive');
  const [showFilters, setShowFilters] = useState(false);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [selectedCampaigns, setSelectedCampaigns] = useState<string[]>([]);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);

  // Personal goals state
  const [goals, setGoals] = useState<PersonalGoal[]>(() => {
    try {
      const saved = localStorage.getItem(GOALS_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [newGoal, setNewGoal] = useState<{ metric: string; target: string }>({ metric: 'acceptanceRate', target: '' });

  // Determine if viewing individual or team
  const isIndividualView = selectedAgent && selectedAgent !== 'all';
  const teamMetrics = allMetrics || metrics;

  // Save goals to localStorage
  React.useEffect(() => {
    localStorage.setItem(GOALS_STORAGE_KEY, JSON.stringify(goals));
  }, [goals]);

  // Get goals for current agent
  const agentGoals = useMemo(() => {
    if (!selectedAgent || selectedAgent === 'all') return [];
    return goals.filter(g => g.agentName === selectedAgent);
  }, [goals, selectedAgent]);

  // Add new goal
  const handleAddGoal = () => {
    if (!selectedAgent || selectedAgent === 'all' || !newGoal.target) return;

    const goal: PersonalGoal = {
      id: Date.now().toString(),
      agentName: selectedAgent,
      metric: newGoal.metric as PersonalGoal['metric'],
      target: parseFloat(newGoal.target),
      createdAt: new Date().toISOString()
    };

    setGoals(prev => [...prev, goal]);
    setNewGoal({ metric: 'acceptanceRate', target: '' });
    setShowGoalModal(false);
  };

  // Remove goal
  const handleRemoveGoal = (goalId: string) => {
    setGoals(prev => prev.filter(g => g.id !== goalId));
  };

  // Get unique filter options (from current metrics, not all)
  const filterOptions = useMemo(() => ({
    campaigns: [...new Set(metrics.map(m => m.campaign).filter(Boolean))].sort(),
    locations: [...new Set(metrics.map(m => m.location).filter(Boolean))].sort(),
    audiences: [...new Set(metrics.map(m => m.audience).filter(Boolean))].sort()
  }), [metrics]);

  // Filter metrics (already agent-filtered from parent, just apply additional filters)
  const filteredMetrics = useMemo(() => {
    return metrics.filter(m => {
      if (dateRange.start && m.weekEnd < dateRange.start) return false;
      if (dateRange.end && m.weekEnd > dateRange.end) return false;
      if (selectedCampaigns.length > 0 && !selectedCampaigns.includes(m.campaign)) return false;
      if (selectedLocations.length > 0 && !selectedLocations.includes(m.location)) return false;
      return true;
    });
  }, [metrics, dateRange, selectedCampaigns, selectedLocations]);

  // Calculate team averages for comparison (when viewing individual)
  const teamAnalytics = useMemo(() => {
    if (!isIndividualView || !teamMetrics.length) return null;

    const totalInvited = teamMetrics.reduce((sum, m) => sum + parseNum(m.totalInvited), 0);
    const totalAccepted = teamMetrics.reduce((sum, m) => sum + parseNum(m.totalAccepted), 0);
    const totalMessaged = teamMetrics.reduce((sum, m) => sum + parseNum(m.totalMessaged), 0);
    const totalReplies = teamMetrics.reduce((sum, m) => sum + parseNum(m.replies), 0);

    return {
      avgAcceptanceRate: totalInvited > 0 ? (totalAccepted / totalInvited) * 100 : 0,
      avgReplyRate: totalMessaged > 0 ? (totalReplies / totalMessaged) * 100 : 0,
      totalInvited,
      totalAccepted,
      totalReplies
    };
  }, [isIndividualView, teamMetrics]);

  // ============================================================================
  // COMPREHENSIVE ANALYTICS CALCULATIONS
  // ============================================================================
  const analytics = useMemo(() => {
    if (filteredMetrics.length === 0) {
      return null;
    }

    // Core metrics
    const totalInvited = filteredMetrics.reduce((sum, m) => sum + parseNum(m.totalInvited), 0);
    const totalAccepted = filteredMetrics.reduce((sum, m) => sum + parseNum(m.totalAccepted), 0);
    const totalMessaged = filteredMetrics.reduce((sum, m) => sum + parseNum(m.totalMessaged), 0);
    const totalReplies = filteredMetrics.reduce((sum, m) => sum + parseNum(m.replies), 0);
    const totalActions = filteredMetrics.reduce((sum, m) => sum + parseNum(m.totalActions), 0);
    const netNewConnects = filteredMetrics.reduce((sum, m) => sum + parseNum(m.netNewConnects), 0);

    // Rates
    const overallAcceptanceRate = totalInvited > 0 ? (totalAccepted / totalInvited) * 100 : 0;
    const overallReplyRate = totalMessaged > 0 ? (totalReplies / totalMessaged) * 100 : 0;
    const engagementRate = totalAccepted > 0 ? (totalReplies / totalAccepted) * 100 : 0;
    const actionRate = totalInvited > 0 ? (totalActions / totalInvited) * 100 : 0;

    // Network growth
    const startingConnects = filteredMetrics.length > 0 ? parseNum(filteredMetrics[0].startingConnects) : 0;
    const endingConnects = filteredMetrics.length > 0 ? parseNum(filteredMetrics[filteredMetrics.length - 1].endingConnections) : 0;
    const networkGrowth = startingConnects > 0 ? ((endingConnects - startingConnects) / startingConnects) * 100 : 0;

    // Benchmark comparisons
    const acceptanceBenchmark = INDUSTRY_BENCHMARKS.linkedin.acceptanceRate.average;
    const replyBenchmark = INDUSTRY_BENCHMARKS.linkedin.replyRate.average;
    const acceptanceVsBenchmark = overallAcceptanceRate - acceptanceBenchmark;
    const replyVsBenchmark = overallReplyRate - replyBenchmark;

    // Performance tier
    const performanceTier = getPerformanceTier(overallAcceptanceRate);

    // Weekly trends
    const weeklyData = new Map<string, {
      invited: number;
      accepted: number;
      messaged: number;
      replies: number;
      actions: number;
      netNew: number;
      acceptanceRate: number;
      replyRate: number;
    }>();

    filteredMetrics.forEach(m => {
      if (!m.weekEnd) return;
      const existing = weeklyData.get(m.weekEnd) || {
        invited: 0, accepted: 0, messaged: 0, replies: 0, actions: 0, netNew: 0,
        acceptanceRate: 0, replyRate: 0
      };
      existing.invited += parseNum(m.totalInvited);
      existing.accepted += parseNum(m.totalAccepted);
      existing.messaged += parseNum(m.totalMessaged);
      existing.replies += parseNum(m.replies);
      existing.actions += parseNum(m.totalActions);
      existing.netNew += parseNum(m.netNewConnects);
      weeklyData.set(m.weekEnd, existing);
    });

    // Calculate weekly rates
    weeklyData.forEach((data) => {
      data.acceptanceRate = data.invited > 0 ? (data.accepted / data.invited) * 100 : 0;
      data.replyRate = data.messaged > 0 ? (data.replies / data.messaged) * 100 : 0;
    });

    const weeklyTrends = Array.from(weeklyData.entries())
      .map(([week, data]) => ({ week, ...data }))
      .sort((a, b) => new Date(a.week).getTime() - new Date(b.week).getTime());

    // Monthly aggregation
    const monthlyData = new Map<string, typeof weeklyData extends Map<string, infer V> ? V : never>();
    filteredMetrics.forEach(m => {
      if (!m.weekEnd) return;
      const month = m.weekEnd.substring(0, 7);
      const existing = monthlyData.get(month) || {
        invited: 0, accepted: 0, messaged: 0, replies: 0, actions: 0, netNew: 0,
        acceptanceRate: 0, replyRate: 0
      };
      existing.invited += parseNum(m.totalInvited);
      existing.accepted += parseNum(m.totalAccepted);
      existing.messaged += parseNum(m.totalMessaged);
      existing.replies += parseNum(m.replies);
      existing.actions += parseNum(m.totalActions);
      existing.netNew += parseNum(m.netNewConnects);
      monthlyData.set(month, existing);
    });

    monthlyData.forEach((data) => {
      data.acceptanceRate = data.invited > 0 ? (data.accepted / data.invited) * 100 : 0;
      data.replyRate = data.messaged > 0 ? (data.replies / data.messaged) * 100 : 0;
    });

    const monthlyTrends = Array.from(monthlyData.entries())
      .map(([month, data]) => ({ month, ...data }))
      .sort((a, b) => a.month.localeCompare(b.month));

    // Agent performance with comprehensive scoring
    const agentData = new Map<string, {
      invited: number;
      accepted: number;
      messaged: number;
      replies: number;
      actions: number;
      campaigns: Set<string>;
      weeks: number;
    }>();

    filteredMetrics.forEach(m => {
      if (!m.agent) return;
      const existing = agentData.get(m.agent) || {
        invited: 0, accepted: 0, messaged: 0, replies: 0, actions: 0,
        campaigns: new Set(), weeks: 0
      };
      existing.invited += parseNum(m.totalInvited);
      existing.accepted += parseNum(m.totalAccepted);
      existing.messaged += parseNum(m.totalMessaged);
      existing.replies += parseNum(m.replies);
      existing.actions += parseNum(m.totalActions);
      if (m.campaign) existing.campaigns.add(m.campaign);
      existing.weeks++;
      agentData.set(m.agent, existing);
    });

    const agentPerformance = Array.from(agentData.entries()).map(([agent, data]) => {
      const acceptanceRate = data.invited > 0 ? (data.accepted / data.invited) * 100 : 0;
      const replyRate = data.messaged > 0 ? (data.replies / data.messaged) * 100 : 0;
      const engagementRate = data.accepted > 0 ? (data.replies / data.accepted) * 100 : 0;

      // Comprehensive scoring (0-100)
      // Weight: Acceptance 35%, Reply 30%, Volume 20%, Consistency 15%
      const acceptanceScore = Math.min(100, (acceptanceRate / 50) * 100) * 0.35;
      const replyScore = Math.min(100, (replyRate / 30) * 100) * 0.30;
      const volumeScore = Math.min(100, (data.invited / 1000) * 100) * 0.20;
      const consistencyScore = Math.min(100, (data.weeks / 12) * 100) * 0.15;
      const totalScore = acceptanceScore + replyScore + volumeScore + consistencyScore;

      const tier = getPerformanceTier(acceptanceRate);
      const vsBenchmark = acceptanceRate - acceptanceBenchmark;

      return {
        agent,
        ...data,
        campaigns: data.campaigns.size,
        acceptanceRate,
        replyRate,
        engagementRate,
        score: Math.round(totalScore),
        tier,
        vsBenchmark
      };
    }).sort((a, b) => b.score - a.score);

    // Campaign analysis
    const campaignData = new Map<string, {
      invited: number;
      accepted: number;
      messaged: number;
      replies: number;
      agents: Set<string>;
    }>();

    filteredMetrics.forEach(m => {
      if (!m.campaign) return;
      const existing = campaignData.get(m.campaign) || {
        invited: 0, accepted: 0, messaged: 0, replies: 0, agents: new Set()
      };
      existing.invited += parseNum(m.totalInvited);
      existing.accepted += parseNum(m.totalAccepted);
      existing.messaged += parseNum(m.totalMessaged);
      existing.replies += parseNum(m.replies);
      if (m.agent) existing.agents.add(m.agent);
      campaignData.set(m.campaign, existing);
    });

    const campaignPerformance = Array.from(campaignData.entries()).map(([campaign, data]) => ({
      campaign,
      ...data,
      agents: data.agents.size,
      acceptanceRate: data.invited > 0 ? (data.accepted / data.invited) * 100 : 0,
      replyRate: data.messaged > 0 ? (data.replies / data.messaged) * 100 : 0
    })).sort((a, b) => b.acceptanceRate - a.acceptanceRate);

    // Location analysis
    const locationData = new Map<string, { invited: number; accepted: number; replies: number }>();
    filteredMetrics.forEach(m => {
      const loc = m.location || 'Unknown';
      const existing = locationData.get(loc) || { invited: 0, accepted: 0, replies: 0 };
      existing.invited += parseNum(m.totalInvited);
      existing.accepted += parseNum(m.totalAccepted);
      existing.replies += parseNum(m.replies);
      locationData.set(loc, existing);
    });

    const locationPerformance = Array.from(locationData.entries()).map(([location, data]) => ({
      location,
      ...data,
      acceptanceRate: data.invited > 0 ? (data.accepted / data.invited) * 100 : 0
    })).sort((a, b) => b.invited - a.invited);

    // Audience analysis
    const audienceData = new Map<string, { invited: number; accepted: number; replies: number }>();
    filteredMetrics.forEach(m => {
      const aud = m.audience || 'Unknown';
      const existing = audienceData.get(aud) || { invited: 0, accepted: 0, replies: 0 };
      existing.invited += parseNum(m.totalInvited);
      existing.accepted += parseNum(m.totalAccepted);
      existing.replies += parseNum(m.replies);
      audienceData.set(aud, existing);
    });

    const audiencePerformance = Array.from(audienceData.entries()).map(([audience, data]) => ({
      audience,
      ...data,
      acceptanceRate: data.invited > 0 ? (data.accepted / data.invited) * 100 : 0
    })).sort((a, b) => b.acceptanceRate - a.acceptanceRate);

    // Predictions using linear regression
    const acceptanceRates = weeklyTrends.map(w => w.acceptanceRate);
    const replyRates = weeklyTrends.map(w => w.replyRate);
    const invitedCounts = weeklyTrends.map(w => w.invited);

    const acceptancePredictions = predictFuture(acceptanceRates, 4);
    const replyPredictions = predictFuture(replyRates, 4);
    const volumePredictions = predictFuture(invitedCounts, 4);

    const acceptanceTrend = linearRegression(acceptanceRates);
    const replyTrend = linearRegression(replyRates);

    // Confidence intervals
    const acceptanceCI = calculateConfidenceInterval(acceptanceRates);
    const replyCI = calculateConfidenceInterval(replyRates);

    // Generate AI insights
    const insights = generateInsights({
      overallAcceptanceRate,
      overallReplyRate,
      acceptanceBenchmark,
      replyBenchmark,
      acceptanceTrend,
      replyTrend,
      agentPerformance,
      campaignPerformance,
      audiencePerformance,
      weeklyTrends,
      performanceTier
    });

    return {
      // Core metrics
      totalInvited,
      totalAccepted,
      totalMessaged,
      totalReplies,
      totalActions,
      netNewConnects,

      // Rates
      overallAcceptanceRate,
      overallReplyRate,
      engagementRate,
      actionRate,

      // Network
      startingConnects,
      endingConnects,
      networkGrowth,

      // Benchmarks
      acceptanceBenchmark,
      replyBenchmark,
      acceptanceVsBenchmark,
      replyVsBenchmark,
      performanceTier,

      // Trends
      weeklyTrends,
      monthlyTrends,

      // Performance data
      agentPerformance,
      campaignPerformance,
      locationPerformance,
      audiencePerformance,

      // Predictions
      acceptancePredictions,
      replyPredictions,
      volumePredictions,
      acceptanceTrend,
      replyTrend,
      acceptanceCI,
      replyCI,

      // Insights
      insights
    };
  }, [filteredMetrics]);

  // ============================================================================
  // AI INSIGHTS GENERATOR
  // ============================================================================
  function generateInsights(data: {
    overallAcceptanceRate: number;
    overallReplyRate: number;
    acceptanceBenchmark: number;
    replyBenchmark: number;
    acceptanceTrend: { slope: number; r2: number };
    replyTrend: { slope: number; r2: number };
    agentPerformance: Array<{ agent: string; acceptanceRate: number; score: number }>;
    campaignPerformance: Array<{ campaign: string; acceptanceRate: number }>;
    audiencePerformance: Array<{ audience: string; acceptanceRate: number; invited: number }>;
    weeklyTrends: Array<{ week: string; acceptanceRate: number }>;
    performanceTier: { label: string; color: string };
  }) {
    const insights: Array<{
      type: 'success' | 'warning' | 'info' | 'danger';
      title: string;
      description: string;
      action?: string;
      metric?: string;
      priority: 'high' | 'medium' | 'low';
    }> = [];

    // Benchmark comparison insights
    if (data.overallAcceptanceRate >= data.acceptanceBenchmark * 1.3) {
      insights.push({
        type: 'success',
        title: 'Exceptional Acceptance Rate',
        description: `Your acceptance rate of ${data.overallAcceptanceRate.toFixed(1)}% is ${((data.overallAcceptanceRate / data.acceptanceBenchmark - 1) * 100).toFixed(0)}% above the industry benchmark of ${data.acceptanceBenchmark}%.`,
        action: 'Scale up outreach volume while maintaining quality.',
        metric: `+${(data.overallAcceptanceRate - data.acceptanceBenchmark).toFixed(1)}% vs benchmark`,
        priority: 'medium'
      });
    } else if (data.overallAcceptanceRate < data.acceptanceBenchmark * 0.7) {
      insights.push({
        type: 'danger',
        title: 'Acceptance Rate Below Benchmark',
        description: `Your acceptance rate of ${data.overallAcceptanceRate.toFixed(1)}% is ${((1 - data.overallAcceptanceRate / data.acceptanceBenchmark) * 100).toFixed(0)}% below the industry benchmark.`,
        action: 'Review targeting criteria and connection request messaging. Consider adding personalization.',
        metric: `${(data.overallAcceptanceRate - data.acceptanceBenchmark).toFixed(1)}% vs benchmark`,
        priority: 'high'
      });
    }

    // Trend analysis
    if (data.acceptanceTrend.slope > 0.5 && data.acceptanceTrend.r2 > 0.5) {
      insights.push({
        type: 'success',
        title: 'Positive Trend Detected',
        description: `Acceptance rate is trending upward with ${(data.acceptanceTrend.r2 * 100).toFixed(0)}% confidence.`,
        action: 'Continue current strategy - it\'s working.',
        metric: `+${(data.acceptanceTrend.slope).toFixed(2)}% per week`,
        priority: 'low'
      });
    } else if (data.acceptanceTrend.slope < -0.5 && data.acceptanceTrend.r2 > 0.5) {
      insights.push({
        type: 'warning',
        title: 'Declining Performance Trend',
        description: `Acceptance rate is declining by ${Math.abs(data.acceptanceTrend.slope).toFixed(2)}% per week.`,
        action: 'Audit recent campaigns and messaging. Test new approaches.',
        metric: `${data.acceptanceTrend.slope.toFixed(2)}% per week`,
        priority: 'high'
      });
    }

    // Agent performance insights
    const topAgent = data.agentPerformance[0];
    const bottomAgent = data.agentPerformance[data.agentPerformance.length - 1];
    if (topAgent && bottomAgent && data.agentPerformance.length > 1) {
      const gap = topAgent.acceptanceRate - bottomAgent.acceptanceRate;
      if (gap > 15) {
        insights.push({
          type: 'info',
          title: 'Agent Performance Gap',
          description: `${gap.toFixed(0)}% acceptance rate gap between top (${topAgent.agent}) and bottom performers.`,
          action: `Have ${topAgent.agent} share best practices with the team. Consider peer mentoring.`,
          metric: `${topAgent.acceptanceRate.toFixed(1)}% vs ${bottomAgent.acceptanceRate.toFixed(1)}%`,
          priority: 'medium'
        });
      }
    }

    // Best performing audience
    const topAudience = data.audiencePerformance[0];
    if (topAudience && topAudience.invited > 100) {
      insights.push({
        type: 'info',
        title: 'Top Performing Audience',
        description: `"${topAudience.audience}" has the highest acceptance rate at ${topAudience.acceptanceRate.toFixed(1)}%.`,
        action: 'Increase targeting of this audience segment.',
        metric: `${topAudience.acceptanceRate.toFixed(1)}% acceptance`,
        priority: 'medium'
      });
    }

    // Campaign insights
    const topCampaign = data.campaignPerformance[0];
    if (topCampaign) {
      insights.push({
        type: 'success',
        title: 'Top Campaign',
        description: `"${topCampaign.campaign}" leads with ${topCampaign.acceptanceRate.toFixed(1)}% acceptance rate.`,
        action: 'Analyze what makes this campaign successful and replicate.',
        metric: `${topCampaign.acceptanceRate.toFixed(1)}% acceptance`,
        priority: 'low'
      });
    }

    // Reply rate insight
    if (data.overallReplyRate < data.replyBenchmark) {
      insights.push({
        type: 'warning',
        title: 'Reply Rate Optimization Needed',
        description: `Reply rate of ${data.overallReplyRate.toFixed(1)}% is below the ${data.replyBenchmark}% benchmark.`,
        action: 'Implement multi-touch follow-up sequences. Research shows follow-ups increase reply rates by 50%+.',
        metric: `${(data.overallReplyRate - data.replyBenchmark).toFixed(1)}% vs benchmark`,
        priority: 'high'
      });
    }

    // Personalization recommendation
    insights.push({
      type: 'info',
      title: 'Personalization Opportunity',
      description: `Industry data shows personalized messages get ${INDUSTRY_BENCHMARKS.linkedin.personalization.withMessage}% reply rate vs ${INDUSTRY_BENCHMARKS.linkedin.personalization.noMessage}% without.`,
      action: 'Add at least one personalized element per message. Multiple personalization points can reach 15-25% response rates.',
      metric: `+${((INDUSTRY_BENCHMARKS.linkedin.personalization.withMessage / INDUSTRY_BENCHMARKS.linkedin.personalization.noMessage - 1) * 100).toFixed(0)}% lift`,
      priority: 'medium'
    });

    return insights.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }

  // ============================================================================
  // RENDER FUNCTIONS
  // ============================================================================
  const renderFilters = () => (
    <div className={`bg-white rounded-xl border border-slate-200 overflow-hidden transition-all duration-300 ${showFilters ? 'mb-6' : 'mb-4'}`}>
      <button
        onClick={() => setShowFilters(!showFilters)}
        className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Filter size={20} className="text-[#13BCC5]" />
          <span className="font-semibold text-[#1b1e4c]">Filters & Controls</span>
          {(selectedCampaigns.length > 0 || selectedLocations.length > 0 || dateRange.start || dateRange.end) && (
            <span className="text-xs bg-[#13BCC5] text-white px-2 py-0.5 rounded-full">
              {selectedCampaigns.length + selectedLocations.length + (dateRange.start ? 1 : 0) + (dateRange.end ? 1 : 0)} active
            </span>
          )}
        </div>
        {showFilters ? <ChevronUp size={20} className="text-slate-400" /> : <ChevronDown size={20} className="text-slate-400" />}
      </button>

      {showFilters && (
        <div className="p-4 border-t border-slate-100 bg-slate-50">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Date Range */}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-2">Date Range</label>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={e => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                  className="flex-1 text-sm border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#13BCC5]/30 focus:border-[#13BCC5]"
                />
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={e => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                  className="flex-1 text-sm border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#13BCC5]/30 focus:border-[#13BCC5]"
                />
              </div>
            </div>

            {/* Campaign Filter */}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-2">Campaigns</label>
              <select
                multiple
                value={selectedCampaigns}
                onChange={e => setSelectedCampaigns(Array.from(e.target.selectedOptions, o => o.value))}
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#13BCC5]/30 focus:border-[#13BCC5] max-h-24"
              >
                {filterOptions.campaigns.map(campaign => (
                  <option key={campaign} value={campaign}>{campaign}</option>
                ))}
              </select>
            </div>

            {/* Location Filter */}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-2">Locations</label>
              <select
                multiple
                value={selectedLocations}
                onChange={e => setSelectedLocations(Array.from(e.target.selectedOptions, o => o.value))}
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#13BCC5]/30 focus:border-[#13BCC5] max-h-24"
              >
                {filterOptions.locations.map(location => (
                  <option key={location} value={location}>{location}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Clear Filters */}
          {(selectedCampaigns.length > 0 || selectedLocations.length > 0 || dateRange.start || dateRange.end) && (
            <button
              onClick={() => {
                setSelectedCampaigns([]);
                setSelectedLocations([]);
                setDateRange({ start: '', end: '' });
              }}
              className="mt-4 text-sm text-[#13BCC5] hover:text-[#0FA8B0] font-medium"
            >
              Clear all filters
            </button>
          )}
        </div>
      )}
    </div>
  );

  const renderTabs = () => (
    <div className="flex flex-wrap gap-2 mb-6 bg-slate-100 p-1 rounded-xl">
      {[
        { id: 'executive', label: 'Executive Summary', icon: Building2 },
        { id: 'performance', label: 'Performance', icon: BarChart3 },
        { id: 'benchmarks', label: 'Benchmarks', icon: Target },
        { id: 'predictions', label: 'Predictions', icon: Brain },
        { id: 'insights', label: 'AI Insights', icon: Sparkles }
      ].map(tab => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id as typeof activeTab)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === tab.id
              ? 'bg-white text-[#13BCC5] shadow-sm'
              : 'text-slate-600 hover:text-slate-800'
          }`}
        >
          <tab.icon size={16} />
          <span className="hidden sm:inline">{tab.label}</span>
        </button>
      ))}
    </div>
  );

  // ============================================================================
  // EXECUTIVE SUMMARY TAB
  // ============================================================================
  const renderExecutiveSummary = () => {
    if (!analytics) return null;

    const TierIcon = analytics.performanceTier.icon;

    return (
      <div className="space-y-6">
        {/* Performance Tier Banner */}
        <div
          className="p-6 rounded-2xl border-2"
          style={{
            backgroundColor: `${analytics.performanceTier.color}10`,
            borderColor: `${analytics.performanceTier.color}30`
          }}
        >
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{ backgroundColor: analytics.performanceTier.color }}
              >
                <TierIcon size={32} className="text-white" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Overall Performance Tier</p>
                <h2 className="text-2xl font-bold" style={{ color: analytics.performanceTier.color }}>
                  {analytics.performanceTier.label}
                </h2>
                <p className="text-sm text-slate-500">
                  Based on {formatNumber(analytics.totalInvited)} total invitations
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-600">Acceptance Rate</p>
              <p className="text-4xl font-bold text-[#1b1e4c]">{analytics.overallAcceptanceRate.toFixed(1)}%</p>
              <p className={`text-sm font-medium flex items-center justify-end gap-1 ${
                analytics.acceptanceVsBenchmark >= 0 ? 'text-emerald-600' : 'text-red-500'
              }`}>
                {analytics.acceptanceVsBenchmark >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                {analytics.acceptanceVsBenchmark >= 0 ? '+' : ''}{analytics.acceptanceVsBenchmark.toFixed(1)}% vs benchmark
              </p>
            </div>
          </div>
        </div>

        {/* KPI Cards Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Invited */}
          <div className="bg-white rounded-xl border border-slate-100 p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <UserPlus size={20} className="text-blue-600" />
              </div>
              <span className="text-sm text-slate-600">Total Invited</span>
            </div>
            <p className="text-2xl font-bold text-[#1b1e4c]">{formatNumber(analytics.totalInvited)}</p>
            <p className="text-xs text-slate-500 mt-1">Connection requests sent</p>
          </div>

          {/* Total Accepted */}
          <div className="bg-white rounded-xl border border-slate-100 p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                <CheckCircle2 size={20} className="text-emerald-600" />
              </div>
              <span className="text-sm text-slate-600">Total Accepted</span>
            </div>
            <p className="text-2xl font-bold text-[#1b1e4c]">{formatNumber(analytics.totalAccepted)}</p>
            <p className="text-xs text-slate-500 mt-1">{analytics.overallAcceptanceRate.toFixed(1)}% acceptance rate</p>
          </div>

          {/* Total Replies */}
          <div className="bg-white rounded-xl border border-slate-100 p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <MessageSquare size={20} className="text-purple-600" />
              </div>
              <span className="text-sm text-slate-600">Total Replies</span>
            </div>
            <p className="text-2xl font-bold text-[#1b1e4c]">{formatNumber(analytics.totalReplies)}</p>
            <p className="text-xs text-slate-500 mt-1">{analytics.overallReplyRate.toFixed(1)}% reply rate</p>
          </div>

          {/* Network Growth */}
          <div className="bg-white rounded-xl border border-slate-100 p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                <Network size={20} className="text-amber-600" />
              </div>
              <span className="text-sm text-slate-600">Network Growth</span>
            </div>
            <p className="text-2xl font-bold text-[#1b1e4c]">+{formatNumber(analytics.netNewConnects)}</p>
            <p className="text-xs text-slate-500 mt-1">{analytics.networkGrowth.toFixed(1)}% growth</p>
          </div>
        </div>

        {/* Weekly Trend Chart */}
        <div className="bg-white rounded-xl border border-slate-100 p-6">
          <h3 className="text-lg font-bold text-[#1b1e4c] mb-4">Weekly Performance Trend</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={analytics.weeklyTrends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  dataKey="week"
                  tick={{ fontSize: 11 }}
                  tickFormatter={v => new Date(v).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                />
                <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }}
                  formatter={(value, name) => [
                    typeof name === 'string' && name.includes('Rate') ? `${Number(value || 0).toFixed(1)}%` : formatNumber(Number(value || 0)),
                    name
                  ]}
                />
                <Legend />
                <ReferenceLine
                  y={INDUSTRY_BENCHMARKS.linkedin.acceptanceRate.average}
                  yAxisId="right"
                  stroke="#F59E0B"
                  strokeDasharray="5 5"
                  label={{ value: 'Benchmark', position: 'right', fontSize: 10, fill: '#F59E0B' }}
                />
                <Bar yAxisId="left" dataKey="invited" fill={COLORS.primary} name="Invited" radius={[4, 4, 0, 0]} />
                <Line yAxisId="right" type="monotone" dataKey="acceptanceRate" stroke={COLORS.success} name="Acceptance Rate" strokeWidth={2} dot={{ r: 4 }} />
                <Line yAxisId="right" type="monotone" dataKey="replyRate" stroke={COLORS.purple} name="Reply Rate" strokeWidth={2} dot={{ r: 4 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Personal vs Team Comparison (Individual View Only) */}
        {isIndividualView && teamAnalytics && (
          <div className="bg-white rounded-xl border border-slate-100 p-6">
            <h3 className="text-lg font-bold text-[#1b1e4c] mb-4 flex items-center gap-2">
              <Users size={20} className="text-[#13BCC5]" />
              Your Performance vs Team
            </h3>
            <div className="grid md:grid-cols-2 gap-6">
              {/* Acceptance Rate Comparison */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Acceptance Rate</span>
                  <span className={`text-sm font-bold ${
                    analytics.overallAcceptanceRate >= teamAnalytics.avgAcceptanceRate
                      ? 'text-emerald-600' : 'text-red-500'
                  }`}>
                    {analytics.overallAcceptanceRate >= teamAnalytics.avgAcceptanceRate ? '↑' : '↓'}
                    {Math.abs(analytics.overallAcceptanceRate - teamAnalytics.avgAcceptanceRate).toFixed(1)}%
                    {analytics.overallAcceptanceRate >= teamAnalytics.avgAcceptanceRate ? ' above' : ' below'} team
                  </span>
                </div>
                <div className="relative h-6 bg-slate-100 rounded-full overflow-hidden">
                  {/* Team average marker */}
                  <div
                    className="absolute top-0 h-full w-0.5 bg-amber-500 z-10"
                    style={{ left: `${Math.min(100, teamAnalytics.avgAcceptanceRate * 1.5)}%` }}
                  />
                  {/* Your rate bar */}
                  <div
                    className={`h-full rounded-full transition-all ${
                      analytics.overallAcceptanceRate >= teamAnalytics.avgAcceptanceRate
                        ? 'bg-gradient-to-r from-emerald-400 to-emerald-500'
                        : 'bg-gradient-to-r from-amber-400 to-amber-500'
                    }`}
                    style={{ width: `${Math.min(100, analytics.overallAcceptanceRate * 1.5)}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-slate-500">
                  <span>You: {analytics.overallAcceptanceRate.toFixed(1)}%</span>
                  <span>Team Avg: {teamAnalytics.avgAcceptanceRate.toFixed(1)}%</span>
                </div>
              </div>

              {/* Reply Rate Comparison */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Reply Rate</span>
                  <span className={`text-sm font-bold ${
                    analytics.overallReplyRate >= teamAnalytics.avgReplyRate
                      ? 'text-emerald-600' : 'text-red-500'
                  }`}>
                    {analytics.overallReplyRate >= teamAnalytics.avgReplyRate ? '↑' : '↓'}
                    {Math.abs(analytics.overallReplyRate - teamAnalytics.avgReplyRate).toFixed(1)}%
                    {analytics.overallReplyRate >= teamAnalytics.avgReplyRate ? ' above' : ' below'} team
                  </span>
                </div>
                <div className="relative h-6 bg-slate-100 rounded-full overflow-hidden">
                  {/* Team average marker */}
                  <div
                    className="absolute top-0 h-full w-0.5 bg-amber-500 z-10"
                    style={{ left: `${Math.min(100, teamAnalytics.avgReplyRate * 3)}%` }}
                  />
                  {/* Your rate bar */}
                  <div
                    className={`h-full rounded-full transition-all ${
                      analytics.overallReplyRate >= teamAnalytics.avgReplyRate
                        ? 'bg-gradient-to-r from-purple-400 to-purple-500'
                        : 'bg-gradient-to-r from-amber-400 to-amber-500'
                    }`}
                    style={{ width: `${Math.min(100, analytics.overallReplyRate * 3)}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-slate-500">
                  <span>You: {analytics.overallReplyRate.toFixed(1)}%</span>
                  <span>Team Avg: {teamAnalytics.avgReplyRate.toFixed(1)}%</span>
                </div>
              </div>
            </div>

            {/* Volume Comparison */}
            <div className="mt-6 grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl">
                <p className="text-2xl font-bold text-blue-800">{formatNumber(analytics.totalInvited)}</p>
                <p className="text-xs text-blue-600">Your Invitations</p>
                <p className="text-xs text-blue-500 mt-1">
                  {((analytics.totalInvited / (teamAnalytics.totalInvited || 1)) * 100).toFixed(0)}% of team total
                </p>
              </div>
              <div className="text-center p-4 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl">
                <p className="text-2xl font-bold text-emerald-800">{formatNumber(analytics.totalAccepted)}</p>
                <p className="text-xs text-emerald-600">Your Connections</p>
                <p className="text-xs text-emerald-500 mt-1">
                  {((analytics.totalAccepted / (teamAnalytics.totalAccepted || 1)) * 100).toFixed(0)}% of team total
                </p>
              </div>
              <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl">
                <p className="text-2xl font-bold text-purple-800">{formatNumber(analytics.totalReplies)}</p>
                <p className="text-xs text-purple-600">Your Replies</p>
                <p className="text-xs text-purple-500 mt-1">
                  {((analytics.totalReplies / (teamAnalytics.totalReplies || 1)) * 100).toFixed(0)}% of team total
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Personal Goals Tracking (Individual View Only) */}
        {isIndividualView && (
          <div className="bg-white rounded-xl border border-slate-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-[#1b1e4c] flex items-center gap-2">
                <Trophy size={20} className="text-amber-500" />
                Personal Goals
              </h3>
              <button
                onClick={() => setShowGoalModal(true)}
                className="flex items-center gap-2 px-3 py-2 bg-amber-50 text-amber-600 rounded-lg hover:bg-amber-100 transition-colors text-sm font-medium"
                aria-label="Add new personal goal"
              >
                <Target size={16} />
                Add Goal
              </button>
            </div>

            {agentGoals.length === 0 ? (
              <div className="text-center py-8">
                <Target size={40} className="text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">No goals set yet</p>
                <p className="text-sm text-slate-400 mt-1">Add a goal to track your progress</p>
              </div>
            ) : (
              <div className="space-y-4">
                {agentGoals.map(goal => {
                  let currentValue = 0;
                  let label = '';
                  let icon = Target;

                  if (goal.metric === 'acceptanceRate') {
                    currentValue = analytics.overallAcceptanceRate;
                    label = 'Acceptance Rate';
                    icon = CheckCircle2;
                  } else if (goal.metric === 'replyRate') {
                    currentValue = analytics.overallReplyRate;
                    label = 'Reply Rate';
                    icon = MessageSquare;
                  } else if (goal.metric === 'invited') {
                    currentValue = analytics.totalInvited;
                    label = 'Invitations';
                    icon = UserPlus;
                  } else if (goal.metric === 'accepted') {
                    currentValue = analytics.totalAccepted;
                    label = 'Connections';
                    icon = Users;
                  }

                  const progress = Math.min(100, (currentValue / goal.target) * 100);
                  const achieved = currentValue >= goal.target;
                  const Icon = icon;

                  return (
                    <div key={goal.id} className={`p-4 rounded-xl border-2 ${achieved ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'}`}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${achieved ? 'bg-emerald-100' : 'bg-slate-200'}`}>
                            <Icon size={20} className={achieved ? 'text-emerald-600' : 'text-slate-500'} />
                          </div>
                          <div>
                            <p className="font-semibold text-[#1b1e4c]">{label}</p>
                            <p className="text-xs text-slate-500">
                              Target: {goal.metric.includes('Rate') ? `${goal.target}%` : formatNumber(goal.target)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {achieved && (
                            <span className="flex items-center gap-1 px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">
                              <Flame size={12} />
                              Achieved!
                            </span>
                          )}
                          <button
                            onClick={() => handleRemoveGoal(goal.id)}
                            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            aria-label="Remove goal"
                          >
                            <XCircle size={16} />
                          </button>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="space-y-2">
                        <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              achieved
                                ? 'bg-gradient-to-r from-emerald-400 to-emerald-500'
                                : 'bg-gradient-to-r from-amber-400 to-amber-500'
                            }`}
                            style={{ width: `${Math.min(100, progress)}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-600">
                            Current: {goal.metric.includes('Rate') ? `${currentValue.toFixed(1)}%` : formatNumber(currentValue)}
                          </span>
                          <span className={`font-medium ${achieved ? 'text-emerald-600' : 'text-amber-600'}`}>
                            {progress.toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Goal Modal */}
        {showGoalModal && isIndividualView && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-bold text-[#1b1e4c] text-lg flex items-center gap-2">
                  <Trophy size={20} className="text-amber-500" />
                  Set New Goal
                </h4>
                <button
                  onClick={() => {
                    setShowGoalModal(false);
                    setNewGoal({ metric: 'acceptanceRate', target: '' });
                  }}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                  aria-label="Close modal"
                >
                  <XCircle size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-2">
                    Metric to Track
                  </label>
                  <select
                    value={newGoal.metric}
                    onChange={(e) => setNewGoal(prev => ({ ...prev, metric: e.target.value }))}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
                  >
                    <option value="acceptanceRate">Acceptance Rate (%)</option>
                    <option value="replyRate">Reply Rate (%)</option>
                    <option value="invited">Total Invitations</option>
                    <option value="accepted">Total Connections</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-2">
                    Target Value
                  </label>
                  <input
                    type="number"
                    value={newGoal.target}
                    onChange={(e) => setNewGoal(prev => ({ ...prev, target: e.target.value }))}
                    placeholder={newGoal.metric.includes('Rate') ? 'e.g., 35' : 'e.g., 500'}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
                    min="0"
                    step={newGoal.metric.includes('Rate') ? '0.1' : '1'}
                  />
                  <p className="text-xs text-slate-400 mt-1">
                    {newGoal.metric.includes('Rate')
                      ? `Industry benchmark: ${INDUSTRY_BENCHMARKS.linkedin.acceptanceRate.average}%`
                      : 'Set a realistic target based on your capacity'
                    }
                  </p>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => {
                      setShowGoalModal(false);
                      setNewGoal({ metric: 'acceptanceRate', target: '' });
                    }}
                    className="flex-1 px-4 py-3 text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddGoal}
                    disabled={!newGoal.target}
                    className="flex-1 px-4 py-3 bg-amber-500 text-white rounded-xl hover:bg-amber-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Set Goal
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4">
            <p className="text-sm text-blue-600 font-medium">{isIndividualView ? 'Your Campaigns' : 'Active Agents'}</p>
            <p className="text-3xl font-bold text-blue-800">
              {isIndividualView ? analytics.campaignPerformance.length : analytics.agentPerformance.length}
            </p>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4">
            <p className="text-sm text-purple-600 font-medium">Active Campaigns</p>
            <p className="text-3xl font-bold text-purple-800">{analytics.campaignPerformance.length}</p>
          </div>
          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-4">
            <p className="text-sm text-emerald-600 font-medium">Weeks Analyzed</p>
            <p className="text-3xl font-bold text-emerald-800">{analytics.weeklyTrends.length}</p>
          </div>
          <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-4">
            <p className="text-sm text-amber-600 font-medium">Locations</p>
            <p className="text-3xl font-bold text-amber-800">{analytics.locationPerformance.length}</p>
          </div>
        </div>
      </div>
    );
  };

  // ============================================================================
  // PERFORMANCE TAB
  // ============================================================================
  const renderPerformance = () => {
    if (!analytics) return null;

    return (
      <div className="space-y-6">
        {/* Agent Leaderboard */}
        <div className="bg-white rounded-xl border border-slate-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-[#1b1e4c]">Agent Performance Leaderboard</h3>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Info size={14} />
              Score based on acceptance rate, reply rate, volume & consistency
            </div>
          </div>

          <div className="space-y-3">
            {analytics.agentPerformance.slice(0, 10).map((agent, index) => {
              const AgentTierIcon = agent.tier.icon;
              return (
                <div
                  key={agent.agent}
                  className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors"
                >
                  {/* Rank */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
                    index === 0 ? 'bg-amber-500' : index === 1 ? 'bg-slate-400' : index === 2 ? 'bg-amber-700' : 'bg-slate-300'
                  }`}>
                    {index + 1}
                  </div>

                  {/* Agent Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-[#1b1e4c]">{agent.agent}</p>
                      <span
                        className="text-xs px-2 py-0.5 rounded-full flex items-center gap-1"
                        style={{ backgroundColor: `${agent.tier.color}20`, color: agent.tier.color }}
                      >
                        <AgentTierIcon size={10} />
                        {agent.tier.label}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">{agent.campaigns} campaigns • {agent.weeks} weeks</p>
                  </div>

                  {/* Metrics */}
                  <div className="flex items-center gap-6 text-sm">
                    <div className="text-center">
                      <p className="font-semibold text-[#1b1e4c]">{agent.acceptanceRate.toFixed(1)}%</p>
                      <p className="text-xs text-slate-500">Acceptance</p>
                    </div>
                    <div className="text-center">
                      <p className="font-semibold text-[#1b1e4c]">{agent.replyRate.toFixed(1)}%</p>
                      <p className="text-xs text-slate-500">Reply</p>
                    </div>
                    <div className="text-center">
                      <p className="font-semibold text-[#1b1e4c]">{formatNumber(agent.invited)}</p>
                      <p className="text-xs text-slate-500">Invited</p>
                    </div>
                    <div className={`text-center px-3 py-1 rounded-lg ${
                      agent.vsBenchmark >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                    }`}>
                      <p className="font-bold text-lg">{agent.score}</p>
                      <p className="text-xs">Score</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Campaign Performance */}
        <div className="bg-white rounded-xl border border-slate-100 p-6">
          <h3 className="text-lg font-bold text-[#1b1e4c] mb-4">Campaign Performance</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.campaignPerformance.slice(0, 10)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="campaign" tick={{ fontSize: 10 }} width={150} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }} />
                <ReferenceLine x={INDUSTRY_BENCHMARKS.linkedin.acceptanceRate.average} stroke="#F59E0B" strokeDasharray="5 5" />
                <Bar dataKey="acceptanceRate" fill={COLORS.primary} name="Acceptance Rate %" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Audience & Location Analysis */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Audience Performance */}
          <div className="bg-white rounded-xl border border-slate-100 p-6">
            <h3 className="text-lg font-bold text-[#1b1e4c] mb-4">Top Audiences by Acceptance Rate</h3>
            <div className="space-y-3">
              {analytics.audiencePerformance.slice(0, 5).map((aud, index) => (
                <div key={aud.audience} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-xs font-medium text-slate-600">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#1b1e4c] truncate">{aud.audience}</p>
                    <div className="w-full bg-slate-100 rounded-full h-2 mt-1">
                      <div
                        className="h-2 rounded-full bg-[#13BCC5]"
                        style={{ width: `${Math.min(100, aud.acceptanceRate * 2)}%` }}
                      />
                    </div>
                  </div>
                  <p className="font-semibold text-[#1b1e4c]">{aud.acceptanceRate.toFixed(1)}%</p>
                </div>
              ))}
            </div>
          </div>

          {/* Location Distribution */}
          <div className="bg-white rounded-xl border border-slate-100 p-6">
            <h3 className="text-lg font-bold text-[#1b1e4c] mb-4">Location Distribution</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analytics.locationPerformance.slice(0, 6)}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="invited"
                    nameKey="location"
                    label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {analytics.locationPerformance.slice(0, 6).map((_, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ============================================================================
  // BENCHMARKS TAB
  // ============================================================================
  const renderBenchmarks = () => {
    if (!analytics) return null;

    const benchmarkComparisons = [
      {
        metric: 'Acceptance Rate',
        yours: analytics.overallAcceptanceRate,
        benchmark: INDUSTRY_BENCHMARKS.linkedin.acceptanceRate.average,
        unit: '%',
        icon: CheckCircle2,
        color: COLORS.success,
        tiers: INDUSTRY_BENCHMARKS.linkedin.acceptanceRate
      },
      {
        metric: 'Reply Rate',
        yours: analytics.overallReplyRate,
        benchmark: INDUSTRY_BENCHMARKS.linkedin.replyRate.average,
        unit: '%',
        icon: MessageSquare,
        color: COLORS.purple,
        tiers: INDUSTRY_BENCHMARKS.linkedin.replyRate
      }
    ];

    return (
      <div className="space-y-6">
        {/* Benchmark Header */}
        <div className="bg-gradient-to-r from-[#13BCC5]/10 to-purple-100/50 rounded-2xl p-6 border border-[#13BCC5]/20">
          <div className="flex items-center gap-3 mb-2">
            <Target size={24} className="text-[#13BCC5]" />
            <h2 className="text-xl font-bold text-[#1b1e4c]">Industry Benchmarks Comparison</h2>
          </div>
          <p className="text-slate-600">
            Based on 2024-2025 research from 20M+ LinkedIn outreach attempts across B2B industries.
          </p>
          <p className="text-xs text-slate-500 mt-2">
            Sources: Belkins, Expandi, Alsona, HubSpot
          </p>
        </div>

        {/* Benchmark Cards */}
        {benchmarkComparisons.map(({ metric, yours, benchmark, unit, icon: Icon, color, tiers }) => {
          const diff = yours - benchmark;
          const percentDiff = ((yours / benchmark) - 1) * 100;
          const isAbove = diff >= 0;

          return (
            <div key={metric} className="bg-white rounded-xl border border-slate-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${color}20` }}>
                    <Icon size={24} style={{ color }} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-[#1b1e4c]">{metric}</h3>
                    <p className="text-sm text-slate-500">vs Industry Benchmark</p>
                  </div>
                </div>
                <div className={`px-4 py-2 rounded-xl ${isAbove ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                  <div className="flex items-center gap-1">
                    {isAbove ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                    <span className="font-bold">{isAbove ? '+' : ''}{diff.toFixed(1)}{unit}</span>
                  </div>
                  <p className="text-xs">{isAbove ? '+' : ''}{percentDiff.toFixed(0)}% {isAbove ? 'above' : 'below'}</p>
                </div>
              </div>

              {/* Visual Comparison */}
              <div className="relative mb-6">
                <div className="h-8 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(100, (yours / (tiers.elite || 60)) * 100)}%`,
                      backgroundColor: color
                    }}
                  />
                </div>
                {/* Benchmark marker */}
                <div
                  className="absolute top-0 h-8 w-0.5 bg-amber-500"
                  style={{ left: `${(benchmark / (tiers.elite || 60)) * 100}%` }}
                >
                  <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs text-amber-600 whitespace-nowrap">
                    Benchmark: {benchmark}{unit}
                  </div>
                </div>
                {/* Your value marker */}
                <div
                  className="absolute top-10 text-sm font-bold"
                  style={{ left: `${Math.min(90, (yours / (tiers.elite || 60)) * 100)}%`, color }}
                >
                  You: {yours.toFixed(1)}{unit}
                </div>
              </div>

              {/* Tier Breakdown */}
              <div className="grid grid-cols-5 gap-2 mt-8">
                {Object.entries(tiers).map(([tier, value]) => (
                  <div
                    key={tier}
                    className={`text-center p-2 rounded-lg ${yours >= value ? 'bg-emerald-50 border border-emerald-200' : 'bg-slate-50'}`}
                  >
                    <p className="text-xs text-slate-600 capitalize">{tier}</p>
                    <p className={`font-bold ${yours >= value ? 'text-emerald-600' : 'text-slate-400'}`}>
                      {value}{unit}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {/* Best Practices */}
        <div className="bg-white rounded-xl border border-slate-100 p-6">
          <h3 className="text-lg font-bold text-[#1b1e4c] mb-4">LinkedIn Outreach Best Practices (2024-2025)</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 rounded-xl">
              <h4 className="font-semibold text-blue-900 flex items-center gap-2">
                <Calendar size={16} />
                Best Days to Reach Out
              </h4>
              <p className="text-sm text-blue-700 mt-2">
                <strong>Acceptance:</strong> Monday, Thursday, Wednesday<br />
                <strong>Replies:</strong> Tuesday (6.90%), Monday (6.85%)
              </p>
            </div>
            <div className="p-4 bg-purple-50 rounded-xl">
              <h4 className="font-semibold text-purple-900 flex items-center gap-2">
                <MessageSquare size={16} />
                Personalization Impact
              </h4>
              <p className="text-sm text-purple-700 mt-2">
                No message: {INDUSTRY_BENCHMARKS.linkedin.personalization.noMessage}% reply<br />
                With message: {INDUSTRY_BENCHMARKS.linkedin.personalization.withMessage}% reply (+72% lift)<br />
                Multi-touch: {INDUSTRY_BENCHMARKS.linkedin.personalization.multiTouch}% reply
              </p>
            </div>
            <div className="p-4 bg-emerald-50 rounded-xl">
              <h4 className="font-semibold text-emerald-900 flex items-center gap-2">
                <Zap size={16} />
                Follow-up Impact
              </h4>
              <p className="text-sm text-emerald-700 mt-2">
                Follow-ups increase reply rates by <strong>50%+</strong><br />
                Most people send one message and give up.
              </p>
            </div>
            <div className="p-4 bg-amber-50 rounded-xl">
              <h4 className="font-semibold text-amber-900 flex items-center gap-2">
                <Users size={16} />
                Profile Engagement
              </h4>
              <p className="text-sm text-amber-700 mt-2">
                Companies that engage with profiles before sending see<br />
                <strong>15-25% response rates</strong> (3x higher than cold outreach)
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ============================================================================
  // PREDICTIONS TAB
  // ============================================================================
  const renderPredictions = () => {
    if (!analytics) return null;

    // Prepare prediction data for charts
    const predictionData = analytics.weeklyTrends.slice(-8).map((w) => ({
      period: new Date(w.week).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      acceptanceRate: w.acceptanceRate,
      replyRate: w.replyRate,
      invited: w.invited,
      isPrediction: false
    }));

    // Add predictions
    const lastDate = analytics.weeklyTrends.length > 0
      ? new Date(analytics.weeklyTrends[analytics.weeklyTrends.length - 1].week)
      : new Date();

    analytics.acceptancePredictions.forEach((pred, i) => {
      const futureDate = new Date(lastDate);
      futureDate.setDate(futureDate.getDate() + (i + 1) * 7);
      predictionData.push({
        period: futureDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        acceptanceRate: pred,
        replyRate: analytics.replyPredictions[i],
        invited: analytics.volumePredictions[i],
        isPrediction: true
      });
    });

    return (
      <div className="space-y-6">
        {/* Prediction Header */}
        <div className="bg-gradient-to-r from-purple-100 to-indigo-100 rounded-2xl p-6 border border-purple-200">
          <div className="flex items-center gap-3 mb-2">
            <Brain size={24} className="text-purple-600" />
            <h2 className="text-xl font-bold text-[#1b1e4c]">ML-Powered Predictions</h2>
          </div>
          <p className="text-slate-600">
            4-week forecasts using linear regression on your historical data.
            Confidence interval: 95%
          </p>
        </div>

        {/* Prediction Cards */}
        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-slate-100 p-6">
            <div className="flex items-center gap-2 mb-3">
              <Activity size={20} className="text-emerald-500" />
              <span className="text-sm text-slate-600">Acceptance Rate Trend</span>
            </div>
            <p className="text-3xl font-bold text-[#1b1e4c]">
              {analytics.acceptanceTrend.slope >= 0 ? '+' : ''}{analytics.acceptanceTrend.slope.toFixed(2)}%
            </p>
            <p className="text-sm text-slate-500">per week</p>
            <div className="mt-3 flex items-center gap-2">
              <div className="flex-1 h-2 bg-slate-100 rounded-full">
                <div
                  className="h-2 bg-emerald-500 rounded-full"
                  style={{ width: `${analytics.acceptanceTrend.r2 * 100}%` }}
                />
              </div>
              <span className="text-xs text-slate-500">{(analytics.acceptanceTrend.r2 * 100).toFixed(0)}% confidence</span>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-100 p-6">
            <div className="flex items-center gap-2 mb-3">
              <Target size={20} className="text-purple-500" />
              <span className="text-sm text-slate-600">Predicted 4-Week Acceptance</span>
            </div>
            <p className="text-3xl font-bold text-[#1b1e4c]">
              {analytics.acceptancePredictions[3]?.toFixed(1)}%
            </p>
            <p className="text-sm text-slate-500">
              Range: {analytics.acceptanceCI.lower.toFixed(1)}% - {analytics.acceptanceCI.upper.toFixed(1)}%
            </p>
          </div>

          <div className="bg-white rounded-xl border border-slate-100 p-6">
            <div className="flex items-center gap-2 mb-3">
              <UserPlus size={20} className="text-blue-500" />
              <span className="text-sm text-slate-600">Projected 4-Week Volume</span>
            </div>
            <p className="text-3xl font-bold text-[#1b1e4c]">
              {formatNumber(analytics.volumePredictions.reduce((a, b) => a + b, 0))}
            </p>
            <p className="text-sm text-slate-500">total invitations</p>
          </div>
        </div>

        {/* Prediction Chart */}
        <div className="bg-white rounded-xl border border-slate-100 p-6">
          <h3 className="text-lg font-bold text-[#1b1e4c] mb-4">Forecast: Acceptance & Reply Rates</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={predictionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 'auto']} tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }}
                  formatter={(value, name) => [
                    `${Number(value || 0).toFixed(1)}%`,
                    name
                  ]}
                />
                <Legend />
                <ReferenceLine
                  y={INDUSTRY_BENCHMARKS.linkedin.acceptanceRate.average}
                  stroke="#F59E0B"
                  strokeDasharray="5 5"
                  label={{ value: 'Benchmark', position: 'right', fontSize: 10, fill: '#F59E0B' }}
                />
                <Area
                  type="monotone"
                  dataKey="acceptanceRate"
                  fill={COLORS.success}
                  fillOpacity={0.2}
                  stroke={COLORS.success}
                  strokeWidth={2}
                  name="Acceptance Rate"
                />
                <Line
                  type="monotone"
                  dataKey="replyRate"
                  stroke={COLORS.purple}
                  strokeWidth={2}
                  name="Reply Rate"
                  dot={{ r: 4 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center justify-center gap-6 mt-4 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <div className="w-8 h-0.5 bg-emerald-500" />
              <span>Historical</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-0.5 bg-emerald-500 border-dashed border-t-2 border-emerald-500" style={{ borderStyle: 'dashed' }} />
              <span>Predicted</span>
            </div>
          </div>
        </div>

        {/* Scenario Analysis */}
        <div className="bg-white rounded-xl border border-slate-100 p-6">
          <h3 className="text-lg font-bold text-[#1b1e4c] mb-4">Scenario Analysis</h3>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="p-4 bg-red-50 rounded-xl border border-red-100">
              <h4 className="font-semibold text-red-800">Pessimistic</h4>
              <p className="text-2xl font-bold text-red-600 mt-2">{analytics.acceptanceCI.lower.toFixed(1)}%</p>
              <p className="text-sm text-red-700">acceptance rate</p>
              <p className="text-xs text-red-600 mt-2">Lower bound (95% CI)</p>
            </div>
            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
              <h4 className="font-semibold text-emerald-800">Expected</h4>
              <p className="text-2xl font-bold text-emerald-600 mt-2">{analytics.acceptanceCI.mean.toFixed(1)}%</p>
              <p className="text-sm text-emerald-700">acceptance rate</p>
              <p className="text-xs text-emerald-600 mt-2">Most likely outcome</p>
            </div>
            <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
              <h4 className="font-semibold text-blue-800">Optimistic</h4>
              <p className="text-2xl font-bold text-blue-600 mt-2">{analytics.acceptanceCI.upper.toFixed(1)}%</p>
              <p className="text-sm text-blue-700">acceptance rate</p>
              <p className="text-xs text-blue-600 mt-2">Upper bound (95% CI)</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ============================================================================
  // INSIGHTS TAB
  // ============================================================================
  const renderInsights = () => {
    if (!analytics) return null;

    const priorityColors = {
      high: { bg: 'bg-red-50', border: 'border-red-200', badge: 'bg-red-100 text-red-700' },
      medium: { bg: 'bg-amber-50', border: 'border-amber-200', badge: 'bg-amber-100 text-amber-700' },
      low: { bg: 'bg-blue-50', border: 'border-blue-200', badge: 'bg-blue-100 text-blue-700' }
    };

    const typeIcons = {
      success: CheckCircle2,
      warning: AlertTriangle,
      info: Info,
      danger: XCircle
    };

    const typeColors = {
      success: 'text-emerald-500',
      warning: 'text-amber-500',
      info: 'text-blue-500',
      danger: 'text-red-500'
    };

    return (
      <div className="space-y-6">
        {/* Insights Header */}
        <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-2xl p-6 border border-purple-200">
          <div className="flex items-center gap-3 mb-2">
            <Sparkles size={24} className="text-purple-600" />
            <h2 className="text-xl font-bold text-[#1b1e4c]">AI-Powered Insights & Recommendations</h2>
          </div>
          <p className="text-slate-600">
            Actionable insights generated from your data patterns and industry benchmarks.
          </p>
        </div>

        {/* High Priority Insights */}
        <div>
          <h3 className="text-lg font-bold text-[#1b1e4c] mb-4 flex items-center gap-2">
            <AlertCircle size={20} className="text-red-500" />
            High Priority Actions
          </h3>
          <div className="space-y-3">
            {analytics.insights.filter(i => i.priority === 'high').map((insight, index) => {
              const Icon = typeIcons[insight.type];
              return (
                <div
                  key={index}
                  className={`p-4 rounded-xl border ${priorityColors.high.bg} ${priorityColors.high.border}`}
                >
                  <div className="flex items-start gap-3">
                    <Icon size={20} className={typeColors[insight.type]} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-[#1b1e4c]">{insight.title}</h4>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${priorityColors.high.badge}`}>
                          High Priority
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 mb-2">{insight.description}</p>
                      {insight.action && (
                        <div className="flex items-start gap-2 p-2 bg-white rounded-lg">
                          <Lightbulb size={16} className="text-amber-500 mt-0.5 flex-shrink-0" />
                          <p className="text-sm text-slate-700">{insight.action}</p>
                        </div>
                      )}
                      {insight.metric && (
                        <p className="text-xs text-slate-500 mt-2">Metric: {insight.metric}</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Medium Priority Insights */}
        <div>
          <h3 className="text-lg font-bold text-[#1b1e4c] mb-4 flex items-center gap-2">
            <Activity size={20} className="text-amber-500" />
            Optimization Opportunities
          </h3>
          <div className="grid md:grid-cols-2 gap-3">
            {analytics.insights.filter(i => i.priority === 'medium').map((insight, index) => {
              const Icon = typeIcons[insight.type];
              return (
                <div
                  key={index}
                  className={`p-4 rounded-xl border ${priorityColors.medium.bg} ${priorityColors.medium.border}`}
                >
                  <div className="flex items-start gap-3">
                    <Icon size={18} className={typeColors[insight.type]} />
                    <div>
                      <h4 className="font-semibold text-[#1b1e4c] text-sm">{insight.title}</h4>
                      <p className="text-xs text-slate-600 mt-1">{insight.description}</p>
                      {insight.action && (
                        <p className="text-xs text-slate-500 mt-2 italic">→ {insight.action}</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Low Priority / Positive Insights */}
        <div>
          <h3 className="text-lg font-bold text-[#1b1e4c] mb-4 flex items-center gap-2">
            <CheckCircle2 size={20} className="text-emerald-500" />
            What's Working Well
          </h3>
          <div className="grid md:grid-cols-3 gap-3">
            {analytics.insights.filter(i => i.priority === 'low').map((insight, index) => {
              const Icon = typeIcons[insight.type];
              return (
                <div
                  key={index}
                  className={`p-4 rounded-xl border ${priorityColors.low.bg} ${priorityColors.low.border}`}
                >
                  <div className="flex items-start gap-2">
                    <Icon size={16} className={typeColors[insight.type]} />
                    <div>
                      <h4 className="font-medium text-[#1b1e4c] text-sm">{insight.title}</h4>
                      <p className="text-xs text-slate-600 mt-1">{insight.description}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Strategic Recommendations */}
        <div className="bg-white rounded-xl border border-slate-100 p-6">
          <h3 className="text-lg font-bold text-[#1b1e4c] mb-4">Strategic Recommendations</h3>
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl">
              <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold">1</span>
              </div>
              <div>
                <h4 className="font-semibold text-emerald-800">Scale What Works</h4>
                <p className="text-sm text-emerald-700">
                  Your top-performing agents and campaigns have proven strategies.
                  Document their approaches and train the team.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl">
              <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold">2</span>
              </div>
              <div>
                <h4 className="font-semibold text-blue-800">Implement Multi-Touch Sequences</h4>
                <p className="text-sm text-blue-700">
                  Research shows multi-touch campaigns achieve up to {INDUSTRY_BENCHMARKS.linkedin.personalization.multiTouch}% reply rates.
                  Add profile visits and follow-ups to your sequences.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl">
              <div className="w-8 h-8 rounded-lg bg-purple-500 flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold">3</span>
              </div>
              <div>
                <h4 className="font-semibold text-purple-800">Optimize Timing</h4>
                <p className="text-sm text-purple-700">
                  Schedule outreach for Tuesday-Thursday when reply rates are highest.
                  Avoid weekends for initial contact.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ============================================================================
  // MAIN RENDER
  // ============================================================================
  if (!analytics) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
        <AlertCircle size={48} className="text-slate-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-slate-600 mb-2">No Data Available</h3>
        <p className="text-slate-500">Add some metrics to see your insurance data analytics.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Individual Agent Profile Banner */}
      {isIndividualView && analytics && (
        <div className="bg-gradient-to-r from-[#1b1e4c] via-[#2a2e5c] to-[#1b1e4c] rounded-2xl p-6 text-white">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#13BCC5] to-purple-500 flex items-center justify-center text-2xl font-bold shadow-lg">
                {selectedAgent?.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-2xl font-bold">{selectedAgent}'s Dashboard</h2>
                <p className="text-white/70">Personal performance & insights</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="bg-white/10 rounded-xl p-3">
                <p className="text-2xl font-bold text-[#13BCC5]">{analytics.overallAcceptanceRate.toFixed(1)}%</p>
                <p className="text-xs text-white/70">Your Acceptance</p>
              </div>
              <div className="bg-white/10 rounded-xl p-3">
                <p className="text-2xl font-bold text-purple-400">{teamAnalytics?.avgAcceptanceRate.toFixed(1) || 0}%</p>
                <p className="text-xs text-white/70">Team Average</p>
              </div>
              <div className="bg-white/10 rounded-xl p-3">
                <p className={`text-2xl font-bold ${
                  (analytics.overallAcceptanceRate - (teamAnalytics?.avgAcceptanceRate || 0)) >= 0
                    ? 'text-emerald-400' : 'text-red-400'
                }`}>
                  {(analytics.overallAcceptanceRate - (teamAnalytics?.avgAcceptanceRate || 0)) >= 0 ? '+' : ''}
                  {(analytics.overallAcceptanceRate - (teamAnalytics?.avgAcceptanceRate || 0)).toFixed(1)}%
                </p>
                <p className="text-xs text-white/70">vs Team</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1b1e4c]">
            {isIndividualView ? `${selectedAgent}'s Analytics` : 'Insurance Data Analytics'}
          </h1>
          <p className="text-slate-500">
            {isIndividualView
              ? 'Personal performance metrics & insights'
              : 'Enterprise-grade insights with industry benchmarks'
            }
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Shield size={16} className="text-[#13BCC5]" />
            <span>Analyzing {filteredMetrics.length} records</span>
          </div>
          {/* Export Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const exportData = filteredMetrics.map(m => ({
                  Agent: m.agent,
                  Campaign: m.campaign,
                  'Week End': m.weekEnd,
                  'Total Invited': m.totalInvited,
                  'Total Accepted': m.totalAccepted,
                  'Acceptance Rate': m.acceptanceRate,
                  'Total Messaged': m.totalMessaged,
                  Replies: m.replies,
                  'Reply %': m.replyPercent,
                  'Defy Lead': m.defyLead,
                  Location: m.location,
                  Audience: m.audience,
                  Status: m.status
                }));
                exportToCSV(exportData, isIndividualView ? `${selectedAgent}_metrics` : 'team_metrics');
              }}
              className="flex items-center gap-2 px-3 py-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-colors text-sm font-medium"
              aria-label="Export data to CSV"
            >
              <FileSpreadsheet size={16} />
              <span className="hidden sm:inline">Export CSV</span>
            </button>
            {analytics && (
              <button
                onClick={() => {
                  const summaryData = [{
                    Metric: 'Total Invited',
                    Value: analytics.totalInvited
                  }, {
                    Metric: 'Total Accepted',
                    Value: analytics.totalAccepted
                  }, {
                    Metric: 'Acceptance Rate',
                    Value: analytics.overallAcceptanceRate.toFixed(1) + '%'
                  }, {
                    Metric: 'Total Messaged',
                    Value: analytics.totalMessaged
                  }, {
                    Metric: 'Total Replies',
                    Value: analytics.totalReplies
                  }, {
                    Metric: 'Reply Rate',
                    Value: analytics.overallReplyRate.toFixed(1) + '%'
                  }, {
                    Metric: 'Net New Connects',
                    Value: analytics.netNewConnects
                  }, {
                    Metric: 'Performance Tier',
                    Value: analytics.performanceTier.label
                  }, {
                    Metric: 'vs Benchmark',
                    Value: (analytics.acceptanceVsBenchmark >= 0 ? '+' : '') + analytics.acceptanceVsBenchmark.toFixed(1) + '%'
                  }];
                  exportToCSV(summaryData, isIndividualView ? `${selectedAgent}_summary` : 'analytics_summary');
                }}
                className="flex items-center gap-2 px-3 py-2 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-colors text-sm font-medium"
                aria-label="Export summary report"
              >
                <Download size={16} />
                <span className="hidden sm:inline">Summary</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Filters */}
      {renderFilters()}

      {/* Tabs */}
      {renderTabs()}

      {/* Tab Content */}
      {activeTab === 'executive' && renderExecutiveSummary()}
      {activeTab === 'performance' && renderPerformance()}
      {activeTab === 'benchmarks' && renderBenchmarks()}
      {activeTab === 'predictions' && renderPredictions()}
      {activeTab === 'insights' && renderInsights()}
    </div>
  );
};

export default InsuranceDataAnalytics;
