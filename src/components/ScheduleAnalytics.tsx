import React, { useMemo } from 'react';
import {
  Clock,
  Calendar,
  Users,
  Activity,
  TrendingUp,
  Zap,
  Sun,
  Moon,
  Sunrise,
  Target
} from 'lucide-react';
import type { ScheduleEntry } from '../types/content';

interface ScheduleAnalyticsProps {
  schedule: ScheduleEntry[];
}

const ScheduleAnalytics: React.FC<ScheduleAnalyticsProps> = ({ schedule }) => {
  const analytics = useMemo(() => {
    if (schedule.length === 0) {
      return {
        totalAgents: 0,
        totalSlots: 0,
        busiestDay: '',
        quietestDay: '',
        peakHour: '',
        slotsPerDay: [],
        agentActivity: [],
        timeDistribution: { morning: 0, afternoon: 0, evening: 0 }
      };
    }

    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // Count slots per day
    const slotsPerDay = days.map((day, idx) => {
      const count = schedule.reduce((acc, entry) => {
        const value = entry[day as keyof ScheduleEntry];
        if (value && typeof value === 'string' && value.trim()) {
          // Count multiple times if comma-separated
          return acc + value.split(',').filter(t => t.trim()).length;
        }
        return acc;
      }, 0);
      return { day: dayLabels[idx], count };
    });

    // Find busiest and quietest days
    const maxSlots = Math.max(...slotsPerDay.map(d => d.count));
    const minSlots = Math.min(...slotsPerDay.filter(d => d.count > 0).map(d => d.count));
    const busiestDay = slotsPerDay.find(d => d.count === maxSlots)?.day || '';
    const quietestDay = slotsPerDay.find(d => d.count === minSlots && d.count > 0)?.day || '';

    // Count total slots
    const totalSlots = slotsPerDay.reduce((acc, d) => acc + d.count, 0);

    // Agent activity
    const agentActivity = schedule.map(entry => {
      const totalPosts = days.reduce((acc, day) => {
        const value = entry[day as keyof ScheduleEntry];
        if (value && typeof value === 'string' && value.trim()) {
          return acc + value.split(',').filter(t => t.trim()).length;
        }
        return acc;
      }, 0);
      return {
        name: entry.agentName,
        posts: totalPosts
      };
    }).sort((a, b) => b.posts - a.posts);

    // Time distribution (morning, afternoon, evening)
    let morning = 0, afternoon = 0, evening = 0;
    schedule.forEach(entry => {
      days.forEach(day => {
        const value = entry[day as keyof ScheduleEntry];
        if (value && typeof value === 'string') {
          const times = value.split(',').map(t => t.trim()).filter(Boolean);
          times.forEach(time => {
            const hour = parseInt(time.split(':')[0]) || 0;
            const isPM = time.toLowerCase().includes('pm');
            const hour24 = isPM && hour !== 12 ? hour + 12 : (hour === 12 && !isPM ? 0 : hour);

            if (hour24 >= 5 && hour24 < 12) morning++;
            else if (hour24 >= 12 && hour24 < 17) afternoon++;
            else evening++;
          });
        }
      });
    });

    // Peak hour
    const hourCounts: Record<string, number> = {};
    schedule.forEach(entry => {
      days.forEach(day => {
        const value = entry[day as keyof ScheduleEntry];
        if (value && typeof value === 'string') {
          const times = value.split(',').map(t => t.trim()).filter(Boolean);
          times.forEach(time => {
            hourCounts[time] = (hourCounts[time] || 0) + 1;
          });
        }
      });
    });
    const peakHour = Object.entries(hourCounts)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

    return {
      totalAgents: schedule.length,
      totalSlots,
      busiestDay,
      quietestDay,
      peakHour,
      slotsPerDay,
      agentActivity,
      timeDistribution: { morning, afternoon, evening }
    };
  }, [schedule]);

  const maxDaySlots = Math.max(...analytics.slotsPerDay.map(d => d.count), 1);
  const maxAgentPosts = Math.max(...analytics.agentActivity.map(a => a.posts), 1);
  const totalTimeSlots = analytics.timeDistribution.morning + analytics.timeDistribution.afternoon + analytics.timeDistribution.evening || 1;

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          icon={<Users className="w-5 h-5" />}
          label="Active Agents"
          value={analytics.totalAgents.toString()}
          color="blue"
        />
        <MetricCard
          icon={<Calendar className="w-5 h-5" />}
          label="Weekly Slots"
          value={analytics.totalSlots.toString()}
          color="emerald"
        />
        <MetricCard
          icon={<TrendingUp className="w-5 h-5" />}
          label="Busiest Day"
          value={analytics.busiestDay || 'N/A'}
          color="purple"
        />
        <MetricCard
          icon={<Clock className="w-5 h-5" />}
          label="Peak Time"
          value={analytics.peakHour}
          color="amber"
        />
      </div>

      {/* Time of Day Distribution */}
      <div className="bg-gradient-to-r from-[#1b1e4c] via-[#2a2e5c] to-[#1b1e4c] rounded-2xl p-6 text-white">
        <h3 className="text-xl font-bold mb-6">Posting Time Distribution</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white/10 rounded-xl p-4 text-center">
            <Sunrise className="w-8 h-8 mx-auto mb-2 text-amber-400" />
            <p className="text-2xl font-bold">{analytics.timeDistribution.morning}</p>
            <p className="text-sm text-white/60">Morning</p>
            <p className="text-xs text-white/40">5 AM - 12 PM</p>
            <div className="mt-2 h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-400 rounded-full"
                style={{ width: `${(analytics.timeDistribution.morning / totalTimeSlots) * 100}%` }}
              />
            </div>
          </div>
          <div className="bg-white/10 rounded-xl p-4 text-center">
            <Sun className="w-8 h-8 mx-auto mb-2 text-[#13BCC5]" />
            <p className="text-2xl font-bold">{analytics.timeDistribution.afternoon}</p>
            <p className="text-sm text-white/60">Afternoon</p>
            <p className="text-xs text-white/40">12 PM - 5 PM</p>
            <div className="mt-2 h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#13BCC5] rounded-full"
                style={{ width: `${(analytics.timeDistribution.afternoon / totalTimeSlots) * 100}%` }}
              />
            </div>
          </div>
          <div className="bg-white/10 rounded-xl p-4 text-center">
            <Moon className="w-8 h-8 mx-auto mb-2 text-purple-400" />
            <p className="text-2xl font-bold">{analytics.timeDistribution.evening}</p>
            <p className="text-sm text-white/60">Evening</p>
            <p className="text-xs text-white/40">5 PM - 5 AM</p>
            <div className="mt-2 h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-purple-400 rounded-full"
                style={{ width: `${(analytics.timeDistribution.evening / totalTimeSlots) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Weekly Distribution */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-bold text-[#1b1e4c]">Weekly Schedule Distribution</h3>
            <p className="text-sm text-slate-500">Posts scheduled per day of week</p>
          </div>
          <Calendar className="w-5 h-5 text-[#13BCC5]" />
        </div>

        <div className="flex items-end justify-between h-48 gap-3">
          {analytics.slotsPerDay.map((day, idx) => (
            <div key={idx} className="flex-1 flex flex-col items-center">
              <div className="flex-1 w-full flex items-end">
                <div
                  className={`w-full rounded-t-lg transition-all duration-500 ${
                    day.day === analytics.busiestDay
                      ? 'bg-gradient-to-t from-[#13BCC5] to-[#0FA8B0]'
                      : 'bg-slate-200'
                  }`}
                  style={{ height: `${maxDaySlots > 0 ? (day.count / maxDaySlots) * 100 : 0}%`, minHeight: day.count > 0 ? '8px' : '0' }}
                />
              </div>
              <span className="text-sm font-medium text-[#1b1e4c] mt-2">{day.day}</span>
              <span className="text-xs text-slate-500">{day.count} posts</span>
            </div>
          ))}
        </div>
      </div>

      {/* Agent Activity */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-bold text-[#1b1e4c]">Agent Posting Activity</h3>
            <p className="text-sm text-slate-500">Weekly posts per agent</p>
          </div>
          <Activity className="w-5 h-5 text-[#13BCC5]" />
        </div>

        {analytics.agentActivity.length > 0 ? (
          <div className="space-y-4">
            {analytics.agentActivity.map((agent, idx) => (
              <div key={idx} className="flex items-center gap-4">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm ${
                  idx === 0 ? 'bg-gradient-to-br from-[#13BCC5] to-[#0FA8B0]' :
                  idx === 1 ? 'bg-[#1b1e4c]' :
                  'bg-slate-400'
                }`}>
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-[#1b1e4c] text-sm truncate">{agent.name}</p>
                  <div className="mt-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        idx === 0 ? 'bg-gradient-to-r from-[#13BCC5] to-[#0FA8B0]' : 'bg-slate-300'
                      }`}
                      style={{ width: `${(agent.posts / maxAgentPosts) * 100}%` }}
                    />
                  </div>
                </div>
                <span className="font-bold text-[#1b1e4c] text-sm">{agent.posts} posts/week</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-slate-400">
            <Users className="w-12 h-12 mx-auto opacity-50 mb-2" />
            <p>No schedule data available</p>
          </div>
        )}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-50 rounded-xl p-4 text-center">
          <Target className="w-6 h-6 mx-auto text-[#13BCC5] mb-2" />
          <p className="text-2xl font-bold text-[#1b1e4c]">
            {analytics.totalSlots > 0 ? (analytics.totalSlots / 7).toFixed(1) : 0}
          </p>
          <p className="text-xs text-slate-500">Avg Posts/Day</p>
        </div>
        <div className="bg-slate-50 rounded-xl p-4 text-center">
          <Zap className="w-6 h-6 mx-auto text-purple-500 mb-2" />
          <p className="text-2xl font-bold text-[#1b1e4c]">
            {analytics.totalAgents > 0 ? (analytics.totalSlots / analytics.totalAgents).toFixed(1) : 0}
          </p>
          <p className="text-xs text-slate-500">Avg Posts/Agent</p>
        </div>
        <div className="bg-slate-50 rounded-xl p-4 text-center">
          <TrendingUp className="w-6 h-6 mx-auto text-emerald-500 mb-2" />
          <p className="text-lg font-bold text-[#1b1e4c]">{analytics.busiestDay || 'N/A'}</p>
          <p className="text-xs text-slate-500">Busiest Day</p>
        </div>
        <div className="bg-slate-50 rounded-xl p-4 text-center">
          <Clock className="w-6 h-6 mx-auto text-amber-500 mb-2" />
          <p className="text-lg font-bold text-[#1b1e4c]">{analytics.peakHour}</p>
          <p className="text-xs text-slate-500">Peak Time</p>
        </div>
      </div>
    </div>
  );
};

interface MetricCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: 'blue' | 'emerald' | 'purple' | 'amber';
}

const MetricCard: React.FC<MetricCardProps> = ({ icon, label, value, color }) => {
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
      </div>
    </div>
  );
};

export default ScheduleAnalytics;
