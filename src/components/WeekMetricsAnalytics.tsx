import React, { useMemo } from 'react';
import {
  Users,
  Target,
  BarChart3,
  Activity,
  Zap,
  Award,
  Percent,
  MessageSquare,
  UserPlus,
  Send,
  CheckCircle2
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

interface WeekMetricsAnalyticsProps {
  metrics: WeekMetric[];
}

const WeekMetricsAnalytics: React.FC<WeekMetricsAnalyticsProps> = ({ metrics }) => {
  // Calculate analytics from metrics data
  const analytics = useMemo(() => {
    if (metrics.length === 0) {
      return {
        totalInvited: 0,
        totalAccepted: 0,
        totalReplies: 0,
        totalMessaged: 0,
        avgAcceptanceRate: 0,
        avgReplyRate: 0,
        totalNetNewConnects: 0,
        totalActions: 0,
        campaignCount: 0,
        agentCount: 0,
        locationCount: 0,
        weeklyData: [],
        campaignPerformance: [],
        agentPerformance: [],
      };
    }

    const parseNum = (val: string) => {
      const num = parseFloat(val?.replace(/[^0-9.-]/g, '') || '0');
      return isNaN(num) ? 0 : num;
    };

    const totalInvited = metrics.reduce((sum, m) => sum + parseNum(m.totalInvited), 0);
    const totalAccepted = metrics.reduce((sum, m) => sum + parseNum(m.totalAccepted), 0);
    const totalReplies = metrics.reduce((sum, m) => sum + parseNum(m.replies), 0);
    const totalMessaged = metrics.reduce((sum, m) => sum + parseNum(m.totalMessaged), 0);
    const totalNetNewConnects = metrics.reduce((sum, m) => sum + parseNum(m.netNewConnects), 0);
    const totalActions = metrics.reduce((sum, m) => sum + parseNum(m.totalActions), 0);

    const acceptanceRates = metrics.map(m => parseNum(m.acceptanceRate)).filter(r => r > 0);
    const replyRates = metrics.map(m => parseNum(m.replyPercent)).filter(r => r > 0);

    const avgAcceptanceRate = acceptanceRates.length > 0
      ? acceptanceRates.reduce((a, b) => a + b, 0) / acceptanceRates.length
      : 0;

    const avgReplyRate = replyRates.length > 0
      ? replyRates.reduce((a, b) => a + b, 0) / replyRates.length
      : 0;

    // Unique counts
    const campaigns = [...new Set(metrics.map(m => m.campaign).filter(Boolean))];
    const agents = [...new Set(metrics.map(m => m.agent).filter(Boolean))];
    const locations = [...new Set(metrics.map(m => m.location).filter(Boolean))];

    // Weekly data for chart
    const weeklyMap = new Map<string, { invited: number; accepted: number; replies: number }>();
    metrics.forEach(m => {
      if (m.weekEnd) {
        const existing = weeklyMap.get(m.weekEnd) || { invited: 0, accepted: 0, replies: 0 };
        weeklyMap.set(m.weekEnd, {
          invited: existing.invited + parseNum(m.totalInvited),
          accepted: existing.accepted + parseNum(m.totalAccepted),
          replies: existing.replies + parseNum(m.replies),
        });
      }
    });

    const weeklyData = Array.from(weeklyMap.entries())
      .map(([week, data]) => ({ week, ...data }))
      .sort((a, b) => a.week.localeCompare(b.week));

    // Campaign performance
    const campaignMap = new Map<string, { invited: number; accepted: number; rate: number }>();
    metrics.forEach(m => {
      if (m.campaign) {
        const existing = campaignMap.get(m.campaign) || { invited: 0, accepted: 0, rate: 0 };
        const invited = existing.invited + parseNum(m.totalInvited);
        const accepted = existing.accepted + parseNum(m.totalAccepted);
        campaignMap.set(m.campaign, {
          invited,
          accepted,
          rate: invited > 0 ? (accepted / invited) * 100 : 0,
        });
      }
    });

    const campaignPerformance = Array.from(campaignMap.entries())
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.rate - a.rate)
      .slice(0, 5);

    // Agent performance
    const agentMap = new Map<string, { actions: number; replies: number; connects: number }>();
    metrics.forEach(m => {
      if (m.agent) {
        const existing = agentMap.get(m.agent) || { actions: 0, replies: 0, connects: 0 };
        agentMap.set(m.agent, {
          actions: existing.actions + parseNum(m.totalActions),
          replies: existing.replies + parseNum(m.replies),
          connects: existing.connects + parseNum(m.netNewConnects),
        });
      }
    });

    const agentPerformance = Array.from(agentMap.entries())
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.actions - a.actions)
      .slice(0, 5);

    return {
      totalInvited,
      totalAccepted,
      totalReplies,
      totalMessaged,
      avgAcceptanceRate,
      avgReplyRate,
      totalNetNewConnects,
      totalActions,
      campaignCount: campaigns.length,
      agentCount: agents.length,
      locationCount: locations.length,
      weeklyData,
      campaignPerformance,
      agentPerformance,
    };
  }, [metrics]);

  // Calculate max value for chart scaling
  const maxWeeklyValue = Math.max(
    ...analytics.weeklyData.flatMap(d => [d.invited, d.accepted, d.replies]),
    1
  );

  return (
    <div className="space-y-6">
      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          icon={<UserPlus className="w-5 h-5" />}
          label="Total Invited"
          value={analytics.totalInvited.toLocaleString()}
          color="blue"
        />
        <MetricCard
          icon={<CheckCircle2 className="w-5 h-5" />}
          label="Total Accepted"
          value={analytics.totalAccepted.toLocaleString()}
          change={analytics.totalInvited > 0 ? ((analytics.totalAccepted / analytics.totalInvited) * 100).toFixed(1) + '%' : '0%'}
          color="emerald"
        />
        <MetricCard
          icon={<MessageSquare className="w-5 h-5" />}
          label="Total Replies"
          value={analytics.totalReplies.toLocaleString()}
          color="purple"
        />
        <MetricCard
          icon={<Send className="w-5 h-5" />}
          label="Total Messaged"
          value={analytics.totalMessaged.toLocaleString()}
          color="amber"
        />
      </div>

      {/* Rate Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-[#13BCC5] to-[#0FA8B0] rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <Percent className="w-8 h-8 opacity-80" />
            <span className="text-3xl font-bold">{analytics.avgAcceptanceRate.toFixed(1)}%</span>
          </div>
          <p className="text-white/80 font-medium">Avg. Acceptance Rate</p>
          <div className="mt-3 h-2 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-white rounded-full transition-all duration-500"
              style={{ width: `${Math.min(analytics.avgAcceptanceRate, 100)}%` }}
            />
          </div>
        </div>

        <div className="bg-gradient-to-br from-[#1b1e4c] to-[#2a2e5c] rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <Activity className="w-8 h-8 opacity-80" />
            <span className="text-3xl font-bold">{analytics.avgReplyRate.toFixed(1)}%</span>
          </div>
          <p className="text-white/80 font-medium">Avg. Reply Rate</p>
          <div className="mt-3 h-2 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#13BCC5] rounded-full transition-all duration-500"
              style={{ width: `${Math.min(analytics.avgReplyRate, 100)}%` }}
            />
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <Zap className="w-8 h-8 opacity-80" />
            <span className="text-3xl font-bold">{analytics.totalActions.toLocaleString()}</span>
          </div>
          <p className="text-white/80 font-medium">Total Actions</p>
          <div className="flex items-center gap-4 mt-3 text-sm">
            <span>{analytics.campaignCount} Campaigns</span>
            <span>{analytics.agentCount} Agents</span>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Weekly Performance Chart */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-bold text-[#1b1e4c]">Weekly Performance</h3>
              <p className="text-sm text-slate-500">Invitations, Acceptances & Replies</p>
            </div>
            <div className="flex gap-4 text-xs">
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-full bg-blue-500" /> Invited
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-full bg-emerald-500" /> Accepted
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-full bg-purple-500" /> Replies
              </span>
            </div>
          </div>

          {analytics.weeklyData.length > 0 ? (
            <div className="space-y-4">
              {analytics.weeklyData.map((week, idx) => (
                <div key={idx} className="space-y-2">
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>{week.week}</span>
                    <span>{week.invited} / {week.accepted} / {week.replies}</span>
                  </div>
                  <div className="flex gap-1 h-6">
                    <div
                      className="bg-blue-500 rounded-l-md transition-all duration-500"
                      style={{ width: `${(week.invited / maxWeeklyValue) * 100}%` }}
                    />
                    <div
                      className="bg-emerald-500 transition-all duration-500"
                      style={{ width: `${(week.accepted / maxWeeklyValue) * 100}%` }}
                    />
                    <div
                      className="bg-purple-500 rounded-r-md transition-all duration-500"
                      style={{ width: `${(week.replies / maxWeeklyValue) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-slate-400">
              <BarChart3 className="w-12 h-12 opacity-50" />
              <span className="ml-2">No weekly data available</span>
            </div>
          )}
        </div>

        {/* Campaign Performance */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-bold text-[#1b1e4c]">Top Campaigns</h3>
              <p className="text-sm text-slate-500">By acceptance rate</p>
            </div>
            <Award className="w-5 h-5 text-[#13BCC5]" />
          </div>

          {analytics.campaignPerformance.length > 0 ? (
            <div className="space-y-4">
              {analytics.campaignPerformance.map((campaign, idx) => (
                <div key={idx} className="flex items-center gap-4">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm ${
                    idx === 0 ? 'bg-amber-500' :
                    idx === 1 ? 'bg-slate-400' :
                    idx === 2 ? 'bg-amber-700' :
                    'bg-slate-300'
                  }`}>
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-[#1b1e4c] truncate text-sm">{campaign.name}</p>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span>{campaign.invited} invited</span>
                      <span>•</span>
                      <span>{campaign.accepted} accepted</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`font-bold ${campaign.rate > 30 ? 'text-emerald-600' : campaign.rate > 15 ? 'text-amber-600' : 'text-slate-600'}`}>
                      {campaign.rate.toFixed(1)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-slate-400">
              <Target className="w-12 h-12 opacity-50" />
              <span className="ml-2">No campaign data</span>
            </div>
          )}
        </div>
      </div>

      {/* Agent Performance */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-bold text-[#1b1e4c]">Agent Performance</h3>
            <p className="text-sm text-slate-500">Top performing agents by total actions</p>
          </div>
          <Users className="w-5 h-5 text-[#13BCC5]" />
        </div>

        {analytics.agentPerformance.length > 0 ? (
          <div className="grid md:grid-cols-5 gap-4">
            {analytics.agentPerformance.map((agent, idx) => (
              <div key={idx} className="bg-slate-50 rounded-xl p-4 text-center">
                <div className={`w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center text-white font-bold ${
                  idx === 0 ? 'bg-gradient-to-br from-[#13BCC5] to-[#0FA8B0]' :
                  'bg-gradient-to-br from-[#1b1e4c] to-[#2a2e5c]'
                }`}>
                  {agent.name.charAt(0).toUpperCase()}
                </div>
                <p className="font-medium text-[#1b1e4c] text-sm truncate">{agent.name}</p>
                <div className="mt-2 space-y-1 text-xs text-slate-500">
                  <p><strong className="text-[#1b1e4c]">{agent.actions}</strong> actions</p>
                  <p><strong className="text-[#1b1e4c]">{agent.replies}</strong> replies</p>
                  <p><strong className="text-[#1b1e4c]">{agent.connects}</strong> connects</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="h-32 flex items-center justify-center text-slate-400">
            <Users className="w-12 h-12 opacity-50" />
            <span className="ml-2">No agent data available</span>
          </div>
        )}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-50 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-[#1b1e4c]">{analytics.totalNetNewConnects.toLocaleString()}</p>
          <p className="text-xs text-slate-500 mt-1">Net New Connects</p>
        </div>
        <div className="bg-slate-50 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-[#1b1e4c]">{analytics.campaignCount}</p>
          <p className="text-xs text-slate-500 mt-1">Active Campaigns</p>
        </div>
        <div className="bg-slate-50 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-[#1b1e4c]">{analytics.agentCount}</p>
          <p className="text-xs text-slate-500 mt-1">Active Agents</p>
        </div>
        <div className="bg-slate-50 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-[#1b1e4c]">{analytics.locationCount}</p>
          <p className="text-xs text-slate-500 mt-1">Locations</p>
        </div>
      </div>
    </div>
  );
};

// Metric Card Component
interface MetricCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  change?: string;
  color: 'blue' | 'emerald' | 'purple' | 'amber';
}

const MetricCard: React.FC<MetricCardProps> = ({ icon, label, value, change, color }) => {
  const colors = {
    blue: 'bg-blue-100 text-blue-600',
    emerald: 'bg-emerald-100 text-emerald-600',
    purple: 'bg-purple-100 text-purple-600',
    amber: 'bg-amber-100 text-amber-600',
  };

  return (
    <div className="bg-white rounded-xl border border-slate-100 p-4">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colors[color]}`}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xl md:text-2xl font-bold text-[#1b1e4c]">{value}</p>
          <p className="text-xs text-slate-500 truncate">{label}</p>
        </div>
        {change && (
          <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
            {change}
          </span>
        )}
      </div>
    </div>
  );
};

export default WeekMetricsAnalytics;
