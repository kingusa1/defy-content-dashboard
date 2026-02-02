import React, { useMemo } from 'react';
import {
  Users,
  CheckCircle2,
  Clock,
  TrendingUp,
  BarChart3,
  Award,
  Linkedin,
  Twitter,
  Zap
} from 'lucide-react';
import type { SuccessStory } from '../types/content';

interface SuccessStoriesAnalyticsProps {
  stories: SuccessStory[];
}

const SuccessStoriesAnalytics: React.FC<SuccessStoriesAnalyticsProps> = ({ stories }) => {
  const analytics = useMemo(() => {
    if (stories.length === 0) {
      return {
        total: 0,
        completed: 0,
        pending: 0,
        completionRate: 0,
        withTwitter: 0,
        withLinkedin: 0,
        byMonth: [],
        recentCompleted: [],
        avgCompletionTime: 0,
        streakDays: 0
      };
    }

    const completed = stories.filter(s => s.status === 'completed').length;
    const pending = stories.filter(s => s.status === 'pending').length;
    const withTwitter = stories.filter(s => s.twitterCaption && s.twitterCaption.trim()).length;
    const withLinkedin = stories.filter(s => s.linkedinCaption && s.linkedinCaption.trim()).length;

    // Group by month
    const monthMap = new Map<string, { total: number; completed: number }>();
    stories.forEach(story => {
      if (story.date) {
        const date = new Date(story.date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const existing = monthMap.get(monthKey) || { total: 0, completed: 0 };
        monthMap.set(monthKey, {
          total: existing.total + 1,
          completed: existing.completed + (story.status === 'completed' ? 1 : 0)
        });
      }
    });
    const byMonth = Array.from(monthMap.entries())
      .map(([month, data]) => ({ month, ...data }))
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-6);

    // Recent completed stories
    const recentCompleted = stories
      .filter(s => s.status === 'completed' && s.completedOn)
      .sort((a, b) => new Date(b.completedOn || 0).getTime() - new Date(a.completedOn || 0).getTime())
      .slice(0, 5);

    // Calculate streak (consecutive days with completed stories)
    const completedDates = stories
      .filter(s => s.status === 'completed' && s.completedOn)
      .map(s => new Date(s.completedOn!).toDateString())
      .filter((v, i, a) => a.indexOf(v) === i)
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

    let streak = 0;
    if (completedDates.length > 0) {
      streak = 1;
      for (let i = 0; i < completedDates.length - 1; i++) {
        const curr = new Date(completedDates[i]);
        const prev = new Date(completedDates[i + 1]);
        const diffDays = Math.round((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays === 1) {
          streak++;
        } else {
          break;
        }
      }
    }

    return {
      total: stories.length,
      completed,
      pending,
      completionRate: stories.length > 0 ? (completed / stories.length) * 100 : 0,
      withTwitter,
      withLinkedin,
      byMonth,
      recentCompleted,
      avgCompletionTime: 0,
      streakDays: streak
    };
  }, [stories]);

  const maxMonthTotal = Math.max(...analytics.byMonth.map(m => m.total), 1);

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          icon={<Users className="w-5 h-5" />}
          label="Total Stories"
          value={analytics.total.toString()}
          color="blue"
        />
        <MetricCard
          icon={<CheckCircle2 className="w-5 h-5" />}
          label="Completed"
          value={analytics.completed.toString()}
          change={`${analytics.completionRate.toFixed(0)}%`}
          color="emerald"
        />
        <MetricCard
          icon={<Clock className="w-5 h-5" />}
          label="Pending"
          value={analytics.pending.toString()}
          color="amber"
        />
        <MetricCard
          icon={<Zap className="w-5 h-5" />}
          label="Day Streak"
          value={analytics.streakDays.toString()}
          color="purple"
        />
      </div>

      {/* Completion Progress */}
      <div className="bg-gradient-to-r from-[#1b1e4c] via-[#2a2e5c] to-[#1b1e4c] rounded-2xl p-6 text-white">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h3 className="text-xl font-bold mb-1">Completion Progress</h3>
            <p className="text-white/60">Track your success story completion rate</p>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-[#13BCC5]">{analytics.completionRate.toFixed(0)}%</p>
              <p className="text-xs text-white/60">Complete</p>
            </div>
            <div className="w-32 h-32 relative">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="rgba(255,255,255,0.1)"
                  strokeWidth="12"
                  fill="none"
                />
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="#13BCC5"
                  strokeWidth="12"
                  fill="none"
                  strokeDasharray={`${analytics.completionRate * 3.52} 352`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <Award className="w-10 h-10 text-[#13BCC5]" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Social Media Coverage */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-100 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-[#0077B5]/10 flex items-center justify-center">
              <Linkedin className="w-5 h-5 text-[#0077B5]" />
            </div>
            <div>
              <p className="font-bold text-[#1b1e4c]">LinkedIn Captions</p>
              <p className="text-sm text-slate-500">{analytics.withLinkedin} of {analytics.total} stories</p>
            </div>
          </div>
          <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#0077B5] rounded-full transition-all duration-500"
              style={{ width: `${analytics.total > 0 ? (analytics.withLinkedin / analytics.total) * 100 : 0}%` }}
            />
          </div>
          <p className="text-right text-sm text-slate-500 mt-2">
            {analytics.total > 0 ? ((analytics.withLinkedin / analytics.total) * 100).toFixed(0) : 0}% coverage
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-[#1DA1F2]/10 flex items-center justify-center">
              <Twitter className="w-5 h-5 text-[#1DA1F2]" />
            </div>
            <div>
              <p className="font-bold text-[#1b1e4c]">Twitter Captions</p>
              <p className="text-sm text-slate-500">{analytics.withTwitter} of {analytics.total} stories</p>
            </div>
          </div>
          <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#1DA1F2] rounded-full transition-all duration-500"
              style={{ width: `${analytics.total > 0 ? (analytics.withTwitter / analytics.total) * 100 : 0}%` }}
            />
          </div>
          <p className="text-right text-sm text-slate-500 mt-2">
            {analytics.total > 0 ? ((analytics.withTwitter / analytics.total) * 100).toFixed(0) : 0}% coverage
          </p>
        </div>
      </div>

      {/* Monthly Trend */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-bold text-[#1b1e4c]">Monthly Progress</h3>
            <p className="text-sm text-slate-500">Stories created and completed per month</p>
          </div>
          <TrendingUp className="w-5 h-5 text-[#13BCC5]" />
        </div>

        {analytics.byMonth.length > 0 ? (
          <div className="space-y-4">
            {analytics.byMonth.map((month, idx) => (
              <div key={idx} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">{month.month}</span>
                  <span className="text-slate-500">{month.completed}/{month.total} completed</span>
                </div>
                <div className="flex gap-1 h-6">
                  <div
                    className="bg-emerald-500 rounded-l-md transition-all duration-500"
                    style={{ width: `${(month.completed / maxMonthTotal) * 100}%` }}
                  />
                  <div
                    className="bg-slate-200 rounded-r-md transition-all duration-500"
                    style={{ width: `${((month.total - month.completed) / maxMonthTotal) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="h-48 flex items-center justify-center text-slate-400">
            <BarChart3 className="w-12 h-12 opacity-50" />
            <span className="ml-2">No data available</span>
          </div>
        )}

        <div className="flex items-center gap-4 mt-4 text-xs">
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-emerald-500" /> Completed
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-slate-200" /> Pending
          </span>
        </div>
      </div>

      {/* Recent Completed */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-bold text-[#1b1e4c]">Recently Completed</h3>
            <p className="text-sm text-slate-500">Latest success stories</p>
          </div>
          <Award className="w-5 h-5 text-[#13BCC5]" />
        </div>

        {analytics.recentCompleted.length > 0 ? (
          <div className="space-y-3">
            {analytics.recentCompleted.map((story, idx) => (
              <div key={idx} className="flex items-center gap-4 p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-white">
                  <CheckCircle2 size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-[#1b1e4c] text-sm">Story for {story.date}</p>
                  <p className="text-xs text-slate-500 truncate">
                    {story.twitterCaption?.slice(0, 60) || story.linkedinCaption?.slice(0, 60) || 'No caption'}...
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-emerald-600 font-medium">Completed</p>
                  <p className="text-xs text-slate-400">{story.completedOn ? new Date(story.completedOn).toLocaleDateString() : ''}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-slate-400">
            <Users className="w-12 h-12 mx-auto opacity-50 mb-2" />
            <p>No completed stories yet</p>
          </div>
        )}
      </div>
    </div>
  );
};

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

export default SuccessStoriesAnalytics;
