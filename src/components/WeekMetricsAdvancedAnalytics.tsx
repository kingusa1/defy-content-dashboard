import React, { useState, useMemo } from 'react';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ComposedChart, ReferenceLine, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import {
  TrendingUp, TrendingDown, Target, BarChart3, Activity,
  Zap, Award, Calendar, Filter, ChevronDown, ChevronUp, AlertTriangle,
  CheckCircle2, XCircle, ArrowUpRight, ArrowDownRight, Sparkles,
  Brain, Lightbulb, Network, UserPlus,
  MessageSquare, Percent, Star, Medal,
  Crown, Info
} from 'lucide-react';

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

interface WeekMetricsAdvancedAnalyticsProps {
  metrics: WeekMetric[];
}

// Color palette
const COLORS = {
  primary: '#13BCC5',
  secondary: '#1b1e4c',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  purple: '#8B5CF6',
  pink: '#EC4899',
  blue: '#3B82F6',
  indigo: '#6366F1',
  cyan: '#06B6D4',
};

const CHART_COLORS = ['#13BCC5', '#8B5CF6', '#F59E0B', '#10B981', '#EC4899', '#3B82F6', '#6366F1'];

// Parse number utility
const parseNum = (val: string): number => {
  const num = parseFloat(val?.replace(/[^0-9.-]/g, '') || '0');
  return isNaN(num) ? 0 : num;
};

// Format large numbers
const formatNumber = (num: number): string => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toFixed(0);
};

// Calculate trend (simple linear regression)
const calculateTrend = (data: number[]): { slope: number; direction: 'up' | 'down' | 'stable' } => {
  if (data.length < 2) return { slope: 0, direction: 'stable' };

  const n = data.length;
  const sumX = data.reduce((s, _, i) => s + i, 0);
  const sumY = data.reduce((s, v) => s + v, 0);
  const sumXY = data.reduce((s, v, i) => s + i * v, 0);
  const sumX2 = data.reduce((s, _, i) => s + i * i, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);

  if (Math.abs(slope) < 0.5) return { slope, direction: 'stable' };
  return { slope, direction: slope > 0 ? 'up' : 'down' };
};

// Predict next value using linear regression
const predictNext = (data: number[], periods: number = 1): number => {
  if (data.length < 2) return data[data.length - 1] || 0;

  const { slope } = calculateTrend(data);
  const lastValue = data[data.length - 1];
  return Math.max(0, lastValue + slope * periods);
};

// Performance score calculation (0-100)
const calculatePerformanceScore = (
  acceptanceRate: number,
  replyRate: number,
  inviteVolume: number,
  avgVolume: number
): number => {
  const acceptScore = Math.min(acceptanceRate / 30 * 40, 40); // 30% = max 40 points
  const replyScore = Math.min(replyRate / 10 * 30, 30); // 10% = max 30 points
  const volumeScore = Math.min((inviteVolume / Math.max(avgVolume, 1)) * 30, 30); // relative volume = max 30 points
  return Math.round(acceptScore + replyScore + volumeScore);
};

// Get performance tier
const getPerformanceTier = (score: number): { tier: string; color: string; icon: React.ReactNode } => {
  if (score >= 80) return { tier: 'Elite', color: 'text-purple-600 bg-purple-100', icon: <Crown size={16} /> };
  if (score >= 60) return { tier: 'Strong', color: 'text-emerald-600 bg-emerald-100', icon: <Medal size={16} /> };
  if (score >= 40) return { tier: 'Average', color: 'text-amber-600 bg-amber-100', icon: <Star size={16} /> };
  return { tier: 'Needs Work', color: 'text-red-600 bg-red-100', icon: <AlertTriangle size={16} /> };
};

const WeekMetricsAdvancedAnalytics: React.FC<WeekMetricsAdvancedAnalyticsProps> = ({ metrics }) => {
  // Filter states
  const [dateRange, setDateRange] = useState<'all' | '7d' | '30d' | '90d' | 'custom'>('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [selectedAgents, setSelectedAgents] = useState<string[]>([]);
  const [selectedCampaigns, setSelectedCampaigns] = useState<string[]>([]);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [performanceTier, setPerformanceTier] = useState<'all' | 'elite' | 'strong' | 'average' | 'weak'>('all');
  const [showFilters, setShowFilters] = useState(true);
  const [activeView, setActiveView] = useState<'overview' | 'trends' | 'agents' | 'predictions'>('overview');

  // Extract unique values
  const uniqueValues = useMemo(() => {
    const agents = [...new Set(metrics.map(m => m.agent).filter(Boolean))].sort();
    const campaigns = [...new Set(metrics.map(m => m.campaign).filter(Boolean))].sort();
    const locations = [...new Set(metrics.map(m => m.location).filter(Boolean))].sort();
    const dates = [...new Set(metrics.map(m => m.weekEnd).filter(Boolean))].sort();
    return { agents, campaigns, locations, dates };
  }, [metrics]);

  // Apply filters
  const filteredMetrics = useMemo(() => {
    let filtered = [...metrics];

    // Date range filter
    if (dateRange !== 'all') {
      const now = new Date();
      let cutoffDate = new Date();

      if (dateRange === '7d') cutoffDate.setDate(now.getDate() - 7);
      else if (dateRange === '30d') cutoffDate.setDate(now.getDate() - 30);
      else if (dateRange === '90d') cutoffDate.setDate(now.getDate() - 90);
      else if (dateRange === 'custom' && customStartDate && customEndDate) {
        filtered = filtered.filter(m => {
          const date = new Date(m.weekEnd);
          return date >= new Date(customStartDate) && date <= new Date(customEndDate);
        });
        return filtered;
      }

      filtered = filtered.filter(m => new Date(m.weekEnd) >= cutoffDate);
    }

    // Agent filter
    if (selectedAgents.length > 0) {
      filtered = filtered.filter(m => selectedAgents.includes(m.agent));
    }

    // Campaign filter
    if (selectedCampaigns.length > 0) {
      filtered = filtered.filter(m => selectedCampaigns.includes(m.campaign));
    }

    // Location filter
    if (selectedLocations.length > 0) {
      filtered = filtered.filter(m => selectedLocations.includes(m.location));
    }

    return filtered;
  }, [metrics, dateRange, customStartDate, customEndDate, selectedAgents, selectedCampaigns, selectedLocations]);

  // Calculate comprehensive analytics
  const analytics = useMemo(() => {
    if (filteredMetrics.length === 0) {
      return null;
    }

    // Basic totals
    const totalInvited = filteredMetrics.reduce((sum, m) => sum + parseNum(m.totalInvited), 0);
    const totalAccepted = filteredMetrics.reduce((sum, m) => sum + parseNum(m.totalAccepted), 0);
    const totalReplies = filteredMetrics.reduce((sum, m) => sum + parseNum(m.replies), 0);
    const totalMessaged = filteredMetrics.reduce((sum, m) => sum + parseNum(m.totalMessaged), 0);
    const totalNetNewConnects = filteredMetrics.reduce((sum, m) => sum + parseNum(m.netNewConnects), 0);
    const totalActions = filteredMetrics.reduce((sum, m) => sum + parseNum(m.totalActions), 0);

    // Network totals
    const latestMetricsByAgent = new Map<string, WeekMetric>();
    filteredMetrics.forEach(m => {
      if (m.agent && m.endingConnections) {
        const existing = latestMetricsByAgent.get(m.agent);
        if (!existing || new Date(m.weekEnd) > new Date(existing.weekEnd)) {
          latestMetricsByAgent.set(m.agent, m);
        }
      }
    });

    const totalNetworkSize = Array.from(latestMetricsByAgent.values())
      .reduce((sum, m) => sum + parseNum(m.endingConnections), 0);

    // Averages
    const avgAcceptanceRate = totalInvited > 0 ? (totalAccepted / totalInvited) * 100 : 0;
    const avgReplyRate = totalMessaged > 0 ? (totalReplies / totalMessaged) * 100 : 0;
    const avgInvitesPerWeek = totalInvited / Math.max(uniqueValues.dates.length, 1);

    // Weekly trends data
    const weeklyData = new Map<string, {
      invited: number;
      accepted: number;
      replies: number;
      messaged: number;
      netNew: number;
      acceptanceRate: number;
      replyRate: number;
    }>();

    filteredMetrics.forEach(m => {
      if (m.weekEnd) {
        const existing = weeklyData.get(m.weekEnd) || {
          invited: 0, accepted: 0, replies: 0, messaged: 0, netNew: 0, acceptanceRate: 0, replyRate: 0
        };
        existing.invited += parseNum(m.totalInvited);
        existing.accepted += parseNum(m.totalAccepted);
        existing.replies += parseNum(m.replies);
        existing.messaged += parseNum(m.totalMessaged);
        existing.netNew += parseNum(m.netNewConnects);
        weeklyData.set(m.weekEnd, existing);
      }
    });

    // Calculate rates for each week
    weeklyData.forEach((data) => {
      data.acceptanceRate = data.invited > 0 ? (data.accepted / data.invited) * 100 : 0;
      data.replyRate = data.messaged > 0 ? (data.replies / data.messaged) * 100 : 0;
    });

    const weeklyTrends = Array.from(weeklyData.entries())
      .map(([week, data]) => ({ week, ...data }))
      .sort((a, b) => new Date(a.week).getTime() - new Date(b.week).getTime());

    // Monthly aggregation
    const monthlyData = new Map<string, {
      invited: number;
      accepted: number;
      replies: number;
      messaged: number;
      netNew: number;
      weeks: number;
    }>();

    filteredMetrics.forEach(m => {
      if (m.weekEnd) {
        const date = new Date(m.weekEnd);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const existing = monthlyData.get(monthKey) || {
          invited: 0, accepted: 0, replies: 0, messaged: 0, netNew: 0, weeks: 0
        };
        existing.invited += parseNum(m.totalInvited);
        existing.accepted += parseNum(m.totalAccepted);
        existing.replies += parseNum(m.replies);
        existing.messaged += parseNum(m.totalMessaged);
        existing.netNew += parseNum(m.netNewConnects);
        existing.weeks += 1;
        monthlyData.set(monthKey, existing);
      }
    });

    const monthlyTrends = Array.from(monthlyData.entries())
      .map(([month, data]) => ({
        month,
        ...data,
        acceptanceRate: data.invited > 0 ? (data.accepted / data.invited) * 100 : 0,
        replyRate: data.messaged > 0 ? (data.replies / data.messaged) * 100 : 0,
        avgInvitedPerWeek: data.invited / Math.max(data.weeks, 1),
      }))
      .sort((a, b) => a.month.localeCompare(b.month));

    // Best month analysis
    const bestMonth = monthlyTrends.length > 0
      ? monthlyTrends.reduce((best, curr) => curr.invited > best.invited ? curr : best)
      : null;

    // Agent performance analysis
    const agentData = new Map<string, {
      invited: number;
      accepted: number;
      replies: number;
      messaged: number;
      netNew: number;
      weeks: number;
      latestNetwork: number;
    }>();

    filteredMetrics.forEach(m => {
      if (m.agent) {
        const existing = agentData.get(m.agent) || {
          invited: 0, accepted: 0, replies: 0, messaged: 0, netNew: 0, weeks: 0, latestNetwork: 0
        };
        existing.invited += parseNum(m.totalInvited);
        existing.accepted += parseNum(m.totalAccepted);
        existing.replies += parseNum(m.replies);
        existing.messaged += parseNum(m.totalMessaged);
        existing.netNew += parseNum(m.netNewConnects);
        existing.weeks += 1;
        const network = parseNum(m.endingConnections);
        if (network > existing.latestNetwork) existing.latestNetwork = network;
        agentData.set(m.agent, existing);
      }
    });

    const agentPerformance = Array.from(agentData.entries())
      .map(([agent, data]) => {
        const acceptanceRate = data.invited > 0 ? (data.accepted / data.invited) * 100 : 0;
        const replyRate = data.messaged > 0 ? (data.replies / data.messaged) * 100 : 0;
        const score = calculatePerformanceScore(acceptanceRate, replyRate, data.invited, avgInvitesPerWeek * data.weeks);
        const tier = getPerformanceTier(score);
        return {
          agent,
          ...data,
          acceptanceRate,
          replyRate,
          score,
          tier,
        };
      })
      .sort((a, b) => b.score - a.score);

    // Campaign performance
    const campaignData = new Map<string, {
      invited: number;
      accepted: number;
      replies: number;
      messaged: number;
    }>();

    filteredMetrics.forEach(m => {
      if (m.campaign) {
        const existing = campaignData.get(m.campaign) || {
          invited: 0, accepted: 0, replies: 0, messaged: 0
        };
        existing.invited += parseNum(m.totalInvited);
        existing.accepted += parseNum(m.totalAccepted);
        existing.replies += parseNum(m.replies);
        existing.messaged += parseNum(m.totalMessaged);
        campaignData.set(m.campaign, existing);
      }
    });

    const campaignPerformance = Array.from(campaignData.entries())
      .map(([campaign, data]) => ({
        campaign,
        ...data,
        acceptanceRate: data.invited > 0 ? (data.accepted / data.invited) * 100 : 0,
        replyRate: data.messaged > 0 ? (data.replies / data.messaged) * 100 : 0,
      }))
      .sort((a, b) => b.invited - a.invited);

    // Location distribution
    const locationData = new Map<string, number>();
    filteredMetrics.forEach(m => {
      if (m.location) {
        locationData.set(m.location, (locationData.get(m.location) || 0) + parseNum(m.totalInvited));
      }
    });

    const locationDistribution = Array.from(locationData.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    // Trend analysis
    const invitedTrend = calculateTrend(weeklyTrends.map(w => w.invited));
    const acceptanceTrend = calculateTrend(weeklyTrends.map(w => w.acceptanceRate));
    const replyTrend = calculateTrend(weeklyTrends.map(w => w.replyRate));

    // Predictions (next 4 weeks)
    const predictions = {
      nextWeekInvites: predictNext(weeklyTrends.map(w => w.invited)),
      nextWeekAccepted: predictNext(weeklyTrends.map(w => w.accepted)),
      nextMonthInvites: predictNext(weeklyTrends.map(w => w.invited), 4),
      projectedNetworkGrowth: predictNext(weeklyTrends.map(w => w.netNew), 4),
      expectedAcceptanceRate: predictNext(weeklyTrends.map(w => w.acceptanceRate)),
    };

    // Generate insights
    const insights: { type: 'success' | 'warning' | 'info' | 'action'; message: string; priority: number }[] = [];

    // Performance insights
    if (avgAcceptanceRate >= 25) {
      insights.push({ type: 'success', message: `Excellent acceptance rate of ${avgAcceptanceRate.toFixed(1)}%! You're in the top tier.`, priority: 1 });
    } else if (avgAcceptanceRate < 15) {
      insights.push({ type: 'warning', message: `Acceptance rate of ${avgAcceptanceRate.toFixed(1)}% is below average. Consider refining targeting.`, priority: 1 });
    }

    // Trend insights
    if (invitedTrend.direction === 'up') {
      insights.push({ type: 'success', message: 'Your outreach volume is trending upward. Great momentum!', priority: 2 });
    } else if (invitedTrend.direction === 'down') {
      insights.push({ type: 'warning', message: 'Outreach volume is declining. Consider increasing campaign activity.', priority: 2 });
    }

    // Agent insights
    const topAgent = agentPerformance[0];
    if (topAgent) {
      insights.push({ type: 'info', message: `${topAgent.agent} is your top performer with a score of ${topAgent.score}/100.`, priority: 3 });
    }

    // Reply rate insights
    if (avgReplyRate >= 8) {
      insights.push({ type: 'success', message: `Reply rate of ${avgReplyRate.toFixed(1)}% is excellent! Your messaging resonates well.`, priority: 2 });
    } else if (avgReplyRate < 3) {
      insights.push({ type: 'action', message: 'Low reply rate. Try A/B testing different message templates.', priority: 1 });
    }

    // Network growth insights
    if (totalNetNewConnects > 0) {
      const growthRate = totalNetworkSize > 0 ? (totalNetNewConnects / totalNetworkSize) * 100 : 0;
      if (growthRate >= 5) {
        insights.push({ type: 'success', message: `Network growing at ${growthRate.toFixed(1)}% - healthy expansion!`, priority: 2 });
      }
    }

    // Recommendations
    const recommendations: string[] = [];

    if (avgAcceptanceRate < 20) {
      recommendations.push('Focus on more targeted audience selection to improve acceptance rates.');
    }
    if (avgReplyRate < 5) {
      recommendations.push('Test personalized message templates to boost engagement.');
    }
    if (invitedTrend.direction === 'down') {
      recommendations.push('Increase weekly outreach volume to maintain pipeline growth.');
    }
    if (agentPerformance.some(a => a.score < 40)) {
      recommendations.push('Provide additional training to underperforming agents.');
    }
    if (locationDistribution.length === 1) {
      recommendations.push('Consider expanding to additional geographic markets.');
    }

    return {
      totals: {
        invited: totalInvited,
        accepted: totalAccepted,
        replies: totalReplies,
        messaged: totalMessaged,
        netNew: totalNetNewConnects,
        actions: totalActions,
        networkSize: totalNetworkSize,
      },
      rates: {
        acceptance: avgAcceptanceRate,
        reply: avgReplyRate,
        avgInvitesPerWeek,
      },
      trends: {
        invited: invitedTrend,
        acceptance: acceptanceTrend,
        reply: replyTrend,
      },
      weeklyTrends,
      monthlyTrends,
      bestMonth,
      agentPerformance,
      campaignPerformance,
      locationDistribution,
      predictions,
      insights: insights.sort((a, b) => a.priority - b.priority),
      recommendations,
    };
  }, [filteredMetrics, uniqueValues.dates.length]);

  if (!analytics || metrics.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center">
        <BarChart3 size={48} className="mx-auto text-slate-300 mb-4" />
        <h3 className="text-lg font-bold text-[#1b1e4c] mb-2">No Data Available</h3>
        <p className="text-slate-500">Add some metrics to see analytics.</p>
      </div>
    );
  }

  const clearFilters = () => {
    setDateRange('all');
    setSelectedAgents([]);
    setSelectedCampaigns([]);
    setSelectedLocations([]);
    setPerformanceTier('all');
    setCustomStartDate('');
    setCustomEndDate('');
  };

  const hasActiveFilters = dateRange !== 'all' || selectedAgents.length > 0 ||
    selectedCampaigns.length > 0 || selectedLocations.length > 0 || performanceTier !== 'all';

  return (
    <div className="space-y-6">
      {/* Header with View Tabs */}
      <div className="bg-white rounded-2xl border border-slate-100 p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#13BCC5] to-[#0FA8B0] flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#1b1e4c]">Advanced Analytics</h2>
              <p className="text-xs text-slate-500">{filteredMetrics.length} records analyzed</p>
            </div>
          </div>

          {/* View Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            {(['overview', 'trends', 'agents', 'predictions'] as const).map((view) => (
              <button
                key={view}
                onClick={() => setActiveView(view)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeView === view
                    ? 'bg-white text-[#13BCC5] shadow-sm'
                    : 'text-slate-600 hover:text-[#1b1e4c]'
                }`}
              >
                {view.charAt(0).toUpperCase() + view.slice(1)}
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              hasActiveFilters
                ? 'bg-[#13BCC5] text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Filter size={16} />
            Filters
            {hasActiveFilters && (
              <span className="w-5 h-5 rounded-full bg-white/20 text-xs flex items-center justify-center">
                {[dateRange !== 'all', selectedAgents.length > 0, selectedCampaigns.length > 0, selectedLocations.length > 0].filter(Boolean).length}
              </span>
            )}
            {showFilters ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-slate-100">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Date Range */}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-2">Date Range</label>
                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#13BCC5]/30"
                >
                  <option value="all">All Time</option>
                  <option value="7d">Last 7 Days</option>
                  <option value="30d">Last 30 Days</option>
                  <option value="90d">Last 90 Days</option>
                  <option value="custom">Custom Range</option>
                </select>
                {dateRange === 'custom' && (
                  <div className="flex gap-2 mt-2">
                    <input
                      type="date"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                      className="flex-1 px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs"
                    />
                    <input
                      type="date"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                      className="flex-1 px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs"
                    />
                  </div>
                )}
              </div>

              {/* Agent Filter */}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-2">Agents</label>
                <div className="relative">
                  <select
                    multiple
                    value={selectedAgents}
                    onChange={(e) => setSelectedAgents(Array.from(e.target.selectedOptions, o => o.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#13BCC5]/30 h-[76px]"
                  >
                    {uniqueValues.agents.map(agent => (
                      <option key={agent} value={agent}>{agent}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Campaign Filter */}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-2">Campaigns</label>
                <select
                  multiple
                  value={selectedCampaigns}
                  onChange={(e) => setSelectedCampaigns(Array.from(e.target.selectedOptions, o => o.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#13BCC5]/30 h-[76px]"
                >
                  {uniqueValues.campaigns.map(campaign => (
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
                  onChange={(e) => setSelectedLocations(Array.from(e.target.selectedOptions, o => o.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#13BCC5]/30 h-[76px]"
                >
                  {uniqueValues.locations.map(loc => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                </select>
              </div>
            </div>

            {hasActiveFilters && (
              <div className="flex items-center gap-2 mt-4">
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <XCircle size={14} />
                  Clear All Filters
                </button>
                <span className="text-xs text-slate-500">
                  Showing {filteredMetrics.length} of {metrics.length} records
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Overview View */}
      {activeView === 'overview' && (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <div className="bg-white rounded-xl border border-slate-100 p-4">
              <div className="flex items-center gap-2 text-slate-500 mb-2">
                <UserPlus size={16} />
                <span className="text-xs font-medium">Total Invited</span>
              </div>
              <p className="text-2xl font-bold text-[#1b1e4c]">{formatNumber(analytics.totals.invited)}</p>
              <div className={`flex items-center gap-1 text-xs mt-1 ${
                analytics.trends.invited.direction === 'up' ? 'text-emerald-600' :
                analytics.trends.invited.direction === 'down' ? 'text-red-600' : 'text-slate-500'
              }`}>
                {analytics.trends.invited.direction === 'up' ? <ArrowUpRight size={12} /> :
                 analytics.trends.invited.direction === 'down' ? <ArrowDownRight size={12} /> : null}
                {analytics.trends.invited.direction !== 'stable' &&
                  `${Math.abs(analytics.trends.invited.slope).toFixed(0)}/week`}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-100 p-4">
              <div className="flex items-center gap-2 text-slate-500 mb-2">
                <CheckCircle2 size={16} />
                <span className="text-xs font-medium">Total Accepted</span>
              </div>
              <p className="text-2xl font-bold text-emerald-600">{formatNumber(analytics.totals.accepted)}</p>
              <p className="text-xs text-slate-500 mt-1">{analytics.rates.acceptance.toFixed(1)}% rate</p>
            </div>

            <div className="bg-white rounded-xl border border-slate-100 p-4">
              <div className="flex items-center gap-2 text-slate-500 mb-2">
                <MessageSquare size={16} />
                <span className="text-xs font-medium">Total Replies</span>
              </div>
              <p className="text-2xl font-bold text-blue-600">{formatNumber(analytics.totals.replies)}</p>
              <p className="text-xs text-slate-500 mt-1">{analytics.rates.reply.toFixed(1)}% rate</p>
            </div>

            <div className="bg-white rounded-xl border border-slate-100 p-4">
              <div className="flex items-center gap-2 text-slate-500 mb-2">
                <Network size={16} />
                <span className="text-xs font-medium">Network Size</span>
              </div>
              <p className="text-2xl font-bold text-purple-600">{formatNumber(analytics.totals.networkSize)}</p>
              <p className="text-xs text-slate-500 mt-1">+{formatNumber(analytics.totals.netNew)} net new</p>
            </div>

            <div className="bg-white rounded-xl border border-slate-100 p-4">
              <div className="flex items-center gap-2 text-slate-500 mb-2">
                <Percent size={16} />
                <span className="text-xs font-medium">Acceptance Rate</span>
              </div>
              <p className={`text-2xl font-bold ${
                analytics.rates.acceptance >= 25 ? 'text-emerald-600' :
                analytics.rates.acceptance >= 15 ? 'text-amber-600' : 'text-red-600'
              }`}>{analytics.rates.acceptance.toFixed(1)}%</p>
              <div className={`flex items-center gap-1 text-xs mt-1 ${
                analytics.trends.acceptance.direction === 'up' ? 'text-emerald-600' :
                analytics.trends.acceptance.direction === 'down' ? 'text-red-600' : 'text-slate-500'
              }`}>
                {analytics.trends.acceptance.direction === 'up' ? <TrendingUp size={12} /> :
                 analytics.trends.acceptance.direction === 'down' ? <TrendingDown size={12} /> : null}
                {analytics.trends.acceptance.direction}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-100 p-4">
              <div className="flex items-center gap-2 text-slate-500 mb-2">
                <Activity size={16} />
                <span className="text-xs font-medium">Avg/Week</span>
              </div>
              <p className="text-2xl font-bold text-[#13BCC5]">{formatNumber(analytics.rates.avgInvitesPerWeek)}</p>
              <p className="text-xs text-slate-500 mt-1">invites per week</p>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Weekly Trend Chart */}
            <div className="bg-white rounded-2xl border border-slate-100 p-6">
              <h3 className="text-lg font-bold text-[#1b1e4c] mb-4">Weekly Performance</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={analytics.weeklyTrends}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="week" tick={{ fontSize: 10 }} tickFormatter={(v) => v.slice(5)} />
                    <YAxis yAxisId="left" tick={{ fontSize: 10 }} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} />
                    <Tooltip
                      contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }}
                      labelFormatter={(v) => `Week: ${v}`}
                    />
                    <Legend />
                    <Bar yAxisId="left" dataKey="invited" fill={COLORS.primary} name="Invited" radius={[4, 4, 0, 0]} />
                    <Bar yAxisId="left" dataKey="accepted" fill={COLORS.success} name="Accepted" radius={[4, 4, 0, 0]} />
                    <Line yAxisId="right" type="monotone" dataKey="acceptanceRate" stroke={COLORS.purple} name="Accept %" strokeWidth={2} dot={{ r: 3 }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Monthly Performance */}
            <div className="bg-white rounded-2xl border border-slate-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-[#1b1e4c]">Monthly Overview</h3>
                {analytics.bestMonth && (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-100 text-amber-700 rounded-lg text-xs font-medium">
                    <Award size={14} />
                    Best: {analytics.bestMonth.month}
                  </div>
                )}
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={analytics.monthlyTrends}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }} />
                    <Legend />
                    <Area type="monotone" dataKey="invited" stroke={COLORS.primary} fill={COLORS.primary} fillOpacity={0.3} name="Invited" />
                    <Area type="monotone" dataKey="accepted" stroke={COLORS.success} fill={COLORS.success} fillOpacity={0.3} name="Accepted" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* AI Insights */}
          <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl border border-purple-100 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#1b1e4c]">AI-Powered Insights</h3>
                <p className="text-xs text-slate-500">Automated analysis of your performance</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {analytics.insights.map((insight, idx) => (
                <div
                  key={idx}
                  className={`flex items-start gap-3 p-4 rounded-xl ${
                    insight.type === 'success' ? 'bg-emerald-50 border border-emerald-200' :
                    insight.type === 'warning' ? 'bg-amber-50 border border-amber-200' :
                    insight.type === 'action' ? 'bg-red-50 border border-red-200' :
                    'bg-blue-50 border border-blue-200'
                  }`}
                >
                  {insight.type === 'success' ? <CheckCircle2 className="text-emerald-600 mt-0.5" size={18} /> :
                   insight.type === 'warning' ? <AlertTriangle className="text-amber-600 mt-0.5" size={18} /> :
                   insight.type === 'action' ? <Zap className="text-red-600 mt-0.5" size={18} /> :
                   <Info className="text-blue-600 mt-0.5" size={18} />}
                  <p className={`text-sm ${
                    insight.type === 'success' ? 'text-emerald-800' :
                    insight.type === 'warning' ? 'text-amber-800' :
                    insight.type === 'action' ? 'text-red-800' :
                    'text-blue-800'
                  }`}>{insight.message}</p>
                </div>
              ))}
            </div>

            {analytics.recommendations.length > 0 && (
              <div className="mt-4 pt-4 border-t border-purple-200">
                <div className="flex items-center gap-2 mb-3">
                  <Lightbulb className="text-amber-500" size={18} />
                  <h4 className="font-semibold text-[#1b1e4c]">Recommendations</h4>
                </div>
                <ul className="space-y-2">
                  {analytics.recommendations.map((rec, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-slate-700">
                      <span className="text-[#13BCC5] mt-1">•</span>
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </>
      )}

      {/* Trends View */}
      {activeView === 'trends' && (
        <>
          {/* Acceptance & Reply Rate Trends */}
          <div className="bg-white rounded-2xl border border-slate-100 p-6">
            <h3 className="text-lg font-bold text-[#1b1e4c] mb-4">Rate Trends Over Time</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analytics.weeklyTrends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="week" tick={{ fontSize: 10 }} tickFormatter={(v) => v.slice(5)} />
                  <YAxis tick={{ fontSize: 10 }} domain={[0, 'auto']} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }} />
                  <Legend />
                  <ReferenceLine y={20} stroke="#10B981" strokeDasharray="5 5" label={{ value: 'Target 20%', fontSize: 10 }} />
                  <Line type="monotone" dataKey="acceptanceRate" stroke={COLORS.primary} name="Acceptance %" strokeWidth={3} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="replyRate" stroke={COLORS.purple} name="Reply %" strokeWidth={3} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Volume Trends */}
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-slate-100 p-6">
              <h3 className="text-lg font-bold text-[#1b1e4c] mb-4">Outreach Volume</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={analytics.weeklyTrends}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="week" tick={{ fontSize: 10 }} tickFormatter={(v) => v.slice(5)} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }} />
                    <Area type="monotone" dataKey="invited" stroke={COLORS.primary} fill={COLORS.primary} fillOpacity={0.6} name="Invited" />
                    <Area type="monotone" dataKey="messaged" stroke={COLORS.blue} fill={COLORS.blue} fillOpacity={0.4} name="Messaged" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 p-6">
              <h3 className="text-lg font-bold text-[#1b1e4c] mb-4">Network Growth</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.weeklyTrends}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="week" tick={{ fontSize: 10 }} tickFormatter={(v) => v.slice(5)} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }} />
                    <Bar dataKey="netNew" fill={COLORS.success} name="Net New Connections" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Campaign & Location Distribution */}
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-slate-100 p-6">
              <h3 className="text-lg font-bold text-[#1b1e4c] mb-4">Campaign Performance</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.campaignPerformance} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis type="number" tick={{ fontSize: 10 }} />
                    <YAxis dataKey="campaign" type="category" tick={{ fontSize: 10 }} width={100} />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }} />
                    <Bar dataKey="invited" fill={COLORS.primary} name="Invited" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 p-6">
              <h3 className="text-lg font-bold text-[#1b1e4c] mb-4">Location Distribution</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analytics.locationDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {analytics.locationDistribution.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Agents View */}
      {activeView === 'agents' && (
        <>
          {/* Agent Leaderboard */}
          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <h3 className="text-lg font-bold text-[#1b1e4c]">Agent Performance Leaderboard</h3>
              <p className="text-sm text-slate-500">Ranked by composite performance score</p>
            </div>
            <div className="divide-y divide-slate-100">
              {analytics.agentPerformance.map((agent, idx) => (
                <div key={agent.agent} className="p-4 flex items-center gap-4 hover:bg-slate-50 transition-colors">
                  {/* Rank Badge */}
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
                    idx === 0 ? 'bg-amber-100 text-amber-600' :
                    idx === 1 ? 'bg-slate-200 text-slate-600' :
                    idx === 2 ? 'bg-orange-100 text-orange-600' :
                    'bg-slate-100 text-slate-500'
                  }`}>
                    {idx + 1}
                  </div>

                  {/* Agent Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-[#1b1e4c] truncate">{agent.agent}</p>
                      <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${agent.tier.color}`}>
                        {agent.tier.icon}
                        {agent.tier.tier}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-xs text-slate-500">
                      <span>{formatNumber(agent.invited)} invited</span>
                      <span>{agent.acceptanceRate.toFixed(1)}% accept</span>
                      <span>{agent.replyRate.toFixed(1)}% reply</span>
                      <span>{formatNumber(agent.latestNetwork)} network</span>
                    </div>
                  </div>

                  {/* Score */}
                  <div className="text-right">
                    <p className={`text-2xl font-bold ${
                      agent.score >= 80 ? 'text-purple-600' :
                      agent.score >= 60 ? 'text-emerald-600' :
                      agent.score >= 40 ? 'text-amber-600' : 'text-red-600'
                    }`}>{agent.score}</p>
                    <p className="text-xs text-slate-500">score</p>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-32 hidden md:block">
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          agent.score >= 80 ? 'bg-purple-500' :
                          agent.score >= 60 ? 'bg-emerald-500' :
                          agent.score >= 40 ? 'bg-amber-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${agent.score}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Agent Comparison Radar */}
          {analytics.agentPerformance.length >= 2 && (
            <div className="bg-white rounded-2xl border border-slate-100 p-6">
              <h3 className="text-lg font-bold text-[#1b1e4c] mb-4">Agent Comparison</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={[
                    { metric: 'Invited', ...Object.fromEntries(analytics.agentPerformance.slice(0, 5).map(a => [a.agent, Math.min(a.invited / 1000, 100)])) },
                    { metric: 'Accept %', ...Object.fromEntries(analytics.agentPerformance.slice(0, 5).map(a => [a.agent, a.acceptanceRate])) },
                    { metric: 'Reply %', ...Object.fromEntries(analytics.agentPerformance.slice(0, 5).map(a => [a.agent, a.replyRate * 3])) },
                    { metric: 'Network', ...Object.fromEntries(analytics.agentPerformance.slice(0, 5).map(a => [a.agent, Math.min(a.latestNetwork / 100, 100)])) },
                    { metric: 'Score', ...Object.fromEntries(analytics.agentPerformance.slice(0, 5).map(a => [a.agent, a.score])) },
                  ]}>
                    <PolarGrid stroke="#e2e8f0" />
                    <PolarAngleAxis dataKey="metric" tick={{ fontSize: 10 }} />
                    <PolarRadiusAxis tick={{ fontSize: 8 }} domain={[0, 100]} />
                    {analytics.agentPerformance.slice(0, 5).map((agent, idx) => (
                      <Radar
                        key={agent.agent}
                        name={agent.agent}
                        dataKey={agent.agent}
                        stroke={CHART_COLORS[idx]}
                        fill={CHART_COLORS[idx]}
                        fillOpacity={0.2}
                      />
                    ))}
                    <Legend />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </>
      )}

      {/* Predictions View */}
      {activeView === 'predictions' && (
        <>
          {/* Prediction Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-[#13BCC5]/10 to-[#13BCC5]/5 rounded-xl border border-[#13BCC5]/20 p-4">
              <div className="flex items-center gap-2 text-[#13BCC5] mb-2">
                <TrendingUp size={16} />
                <span className="text-xs font-medium">Next Week Prediction</span>
              </div>
              <p className="text-2xl font-bold text-[#1b1e4c]">{formatNumber(analytics.predictions.nextWeekInvites)}</p>
              <p className="text-xs text-slate-500">expected invites</p>
            </div>

            <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 rounded-xl border border-emerald-500/20 p-4">
              <div className="flex items-center gap-2 text-emerald-600 mb-2">
                <CheckCircle2 size={16} />
                <span className="text-xs font-medium">Expected Accepted</span>
              </div>
              <p className="text-2xl font-bold text-[#1b1e4c]">{formatNumber(analytics.predictions.nextWeekAccepted)}</p>
              <p className="text-xs text-slate-500">next week</p>
            </div>

            <div className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 rounded-xl border border-purple-500/20 p-4">
              <div className="flex items-center gap-2 text-purple-600 mb-2">
                <Calendar size={16} />
                <span className="text-xs font-medium">Monthly Projection</span>
              </div>
              <p className="text-2xl font-bold text-[#1b1e4c]">{formatNumber(analytics.predictions.nextMonthInvites)}</p>
              <p className="text-xs text-slate-500">invites in 4 weeks</p>
            </div>

            <div className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 rounded-xl border border-blue-500/20 p-4">
              <div className="flex items-center gap-2 text-blue-600 mb-2">
                <Network size={16} />
                <span className="text-xs font-medium">Network Growth</span>
              </div>
              <p className="text-2xl font-bold text-[#1b1e4c]">+{formatNumber(analytics.predictions.projectedNetworkGrowth)}</p>
              <p className="text-xs text-slate-500">projected in 4 weeks</p>
            </div>
          </div>

          {/* Forecast Chart */}
          <div className="bg-white rounded-2xl border border-slate-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-[#1b1e4c]">Performance Forecast</h3>
                <p className="text-sm text-slate-500">Based on historical trends</p>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-100 text-purple-700 rounded-lg text-xs font-medium">
                <Sparkles size={14} />
                ML Prediction
              </div>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={[
                  ...analytics.weeklyTrends,
                  // Add predicted weeks
                  ...[1, 2, 3, 4].map((i) => ({
                    week: `Forecast +${i}w`,
                    invited: predictNext(analytics.weeklyTrends.map(w => w.invited), i),
                    accepted: predictNext(analytics.weeklyTrends.map(w => w.accepted), i),
                    isPrediction: true,
                  }))
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="week" tick={{ fontSize: 10 }} tickFormatter={(v) => v.includes('Forecast') ? v : v.slice(5)} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }} />
                  <Legend />
                  <Bar
                    dataKey="invited"
                    fill={COLORS.primary}
                    name="Invited"
                    radius={[4, 4, 0, 0]}
                  />
                  <Line
                    type="monotone"
                    dataKey="accepted"
                    stroke={COLORS.success}
                    name="Accepted"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center gap-4 mt-4 text-xs text-slate-500">
              <div className="flex items-center gap-2">
                <div className="w-4 h-0.5 bg-[#13BCC5]" />
                <span>Historical Data</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-0.5 bg-[#13BCC5] border-dashed border-t-2 border-[#13BCC5]" style={{ borderStyle: 'dashed' }} />
                <span>Predicted Values</span>
              </div>
            </div>
          </div>

          {/* Strategic Recommendations */}
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl border border-indigo-100 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <Target className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#1b1e4c]">Strategic Goals</h3>
                <p className="text-xs text-slate-500">Recommended targets based on your performance</p>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-white/80 rounded-xl p-4 border border-indigo-100">
                <div className="flex items-center gap-2 text-indigo-600 mb-2">
                  <Target size={16} />
                  <span className="text-sm font-medium">Weekly Target</span>
                </div>
                <p className="text-2xl font-bold text-[#1b1e4c]">
                  {formatNumber(Math.ceil(analytics.rates.avgInvitesPerWeek * 1.1))}
                </p>
                <p className="text-xs text-slate-500">invites (+10% from current)</p>
                <div className="mt-2 h-1.5 bg-indigo-100 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500 rounded-full" style={{ width: '70%' }} />
                </div>
              </div>

              <div className="bg-white/80 rounded-xl p-4 border border-indigo-100">
                <div className="flex items-center gap-2 text-emerald-600 mb-2">
                  <Percent size={16} />
                  <span className="text-sm font-medium">Acceptance Goal</span>
                </div>
                <p className="text-2xl font-bold text-[#1b1e4c]">
                  {Math.min(Math.ceil(analytics.rates.acceptance * 1.15), 35)}%
                </p>
                <p className="text-xs text-slate-500">target rate</p>
                <div className="mt-2 h-1.5 bg-emerald-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full"
                    style={{ width: `${Math.min((analytics.rates.acceptance / 35) * 100, 100)}%` }}
                  />
                </div>
              </div>

              <div className="bg-white/80 rounded-xl p-4 border border-indigo-100">
                <div className="flex items-center gap-2 text-purple-600 mb-2">
                  <Network size={16} />
                  <span className="text-sm font-medium">Network Goal</span>
                </div>
                <p className="text-2xl font-bold text-[#1b1e4c]">
                  {formatNumber(Math.ceil(analytics.totals.networkSize + analytics.predictions.projectedNetworkGrowth))}
                </p>
                <p className="text-xs text-slate-500">total connections</p>
                <div className="mt-2 h-1.5 bg-purple-100 rounded-full overflow-hidden">
                  <div className="h-full bg-purple-500 rounded-full" style={{ width: '85%' }} />
                </div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-indigo-200">
              <h4 className="font-semibold text-[#1b1e4c] mb-3 flex items-center gap-2">
                <Zap className="text-amber-500" size={16} />
                Action Items This Week
              </h4>
              <div className="grid md:grid-cols-2 gap-3">
                {[
                  { action: `Send at least ${formatNumber(Math.ceil(analytics.rates.avgInvitesPerWeek * 1.1))} connection requests`, priority: 'high' },
                  { action: 'A/B test 2 different message templates', priority: 'medium' },
                  { action: 'Follow up with pending connections from last week', priority: 'high' },
                  { action: 'Review and update targeting criteria', priority: 'low' },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3 bg-white/60 rounded-lg p-3">
                    <div className={`w-2 h-2 rounded-full mt-1.5 ${
                      item.priority === 'high' ? 'bg-red-500' :
                      item.priority === 'medium' ? 'bg-amber-500' : 'bg-emerald-500'
                    }`} />
                    <span className="text-sm text-slate-700">{item.action}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default WeekMetricsAdvancedAnalytics;
