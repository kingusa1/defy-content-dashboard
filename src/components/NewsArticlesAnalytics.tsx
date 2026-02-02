import React, { useMemo } from 'react';
import {
  FileText,
  Calendar,
  TrendingUp,
  Clock,
  BarChart3,
  Linkedin,
  Twitter,
  ExternalLink,
  CheckCircle2,
  Newspaper
} from 'lucide-react';
import type { NewsArticle } from '../types/content';

interface NewsArticlesAnalyticsProps {
  articles: NewsArticle[];
}

const NewsArticlesAnalytics: React.FC<NewsArticlesAnalyticsProps> = ({ articles }) => {
  const analytics = useMemo(() => {
    if (articles.length === 0) {
      return {
        total: 0,
        published: 0,
        scheduled: 0,
        withLinkedin: 0,
        withTwitter: 0,
        byMonth: [],
        byWeekday: [],
        recentActivity: [],
        avgPostLength: { linkedin: 0, twitter: 0 },
        publishRate: 0
      };
    }

    const published = articles.filter(a => a.status === 'published').length;
    const scheduled = articles.filter(a => a.status === 'scheduled').length;
    const withLinkedin = articles.filter(a => a.linkedinPost && a.linkedinPost.trim()).length;
    const withTwitter = articles.filter(a => a.twitterPost && a.twitterPost.trim()).length;

    // Group by month
    const monthMap = new Map<string, number>();
    articles.forEach(article => {
      if (article.publishDate) {
        const date = new Date(article.publishDate);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        monthMap.set(monthKey, (monthMap.get(monthKey) || 0) + 1);
      }
    });
    const byMonth = Array.from(monthMap.entries())
      .map(([month, count]) => ({ month, count }))
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-6);

    // Group by weekday
    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const weekdayMap = new Map<number, number>();
    articles.forEach(article => {
      if (article.publishDate) {
        const date = new Date(article.publishDate);
        const day = date.getDay();
        weekdayMap.set(day, (weekdayMap.get(day) || 0) + 1);
      }
    });
    const byWeekday = weekdays.map((name, idx) => ({
      day: name,
      count: weekdayMap.get(idx) || 0
    }));

    // Average post lengths
    const linkedinLengths = articles
      .filter(a => a.linkedinPost)
      .map(a => a.linkedinPost?.length || 0);
    const twitterLengths = articles
      .filter(a => a.twitterPost)
      .map(a => a.twitterPost?.length || 0);

    const avgLinkedin = linkedinLengths.length > 0
      ? Math.round(linkedinLengths.reduce((a, b) => a + b, 0) / linkedinLengths.length)
      : 0;
    const avgTwitter = twitterLengths.length > 0
      ? Math.round(twitterLengths.reduce((a, b) => a + b, 0) / twitterLengths.length)
      : 0;

    // Recent activity (last 5)
    const recentActivity = [...articles]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);

    return {
      total: articles.length,
      published,
      scheduled,
      withLinkedin,
      withTwitter,
      byMonth,
      byWeekday,
      recentActivity,
      avgPostLength: { linkedin: avgLinkedin, twitter: avgTwitter },
      publishRate: articles.length > 0 ? (published / articles.length) * 100 : 0
    };
  }, [articles]);

  const maxMonthCount = Math.max(...analytics.byMonth.map(m => m.count), 1);
  const maxWeekdayCount = Math.max(...analytics.byWeekday.map(d => d.count), 1);

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          icon={<FileText className="w-5 h-5" />}
          label="Total Articles"
          value={analytics.total.toString()}
          color="blue"
        />
        <MetricCard
          icon={<CheckCircle2 className="w-5 h-5" />}
          label="Published"
          value={analytics.published.toString()}
          change={`${analytics.publishRate.toFixed(0)}%`}
          color="emerald"
        />
        <MetricCard
          icon={<Clock className="w-5 h-5" />}
          label="Scheduled"
          value={analytics.scheduled.toString()}
          color="amber"
        />
        <MetricCard
          icon={<Newspaper className="w-5 h-5" />}
          label="This Month"
          value={(analytics.byMonth[analytics.byMonth.length - 1]?.count || 0).toString()}
          color="purple"
        />
      </div>

      {/* Social Media Coverage */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-[#0077B5] to-[#005582] rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <Linkedin className="w-8 h-8 opacity-80" />
            <span className="text-3xl font-bold">{analytics.withLinkedin}</span>
          </div>
          <p className="text-white/80 font-medium">LinkedIn Posts</p>
          <div className="mt-3 flex items-center justify-between text-sm">
            <span className="text-white/60">Avg. Length</span>
            <span className="font-medium">{analytics.avgPostLength.linkedin} chars</span>
          </div>
          <div className="mt-2 h-2 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-white rounded-full"
              style={{ width: `${analytics.total > 0 ? (analytics.withLinkedin / analytics.total) * 100 : 0}%` }}
            />
          </div>
        </div>

        <div className="bg-gradient-to-br from-[#1DA1F2] to-[#0C85D0] rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <Twitter className="w-8 h-8 opacity-80" />
            <span className="text-3xl font-bold">{analytics.withTwitter}</span>
          </div>
          <p className="text-white/80 font-medium">Twitter Posts</p>
          <div className="mt-3 flex items-center justify-between text-sm">
            <span className="text-white/60">Avg. Length</span>
            <span className="font-medium">{analytics.avgPostLength.twitter} chars</span>
          </div>
          <div className="mt-2 h-2 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-white rounded-full"
              style={{ width: `${analytics.total > 0 ? (analytics.withTwitter / analytics.total) * 100 : 0}%` }}
            />
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Monthly Trend */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-bold text-[#1b1e4c]">Monthly Publishing</h3>
              <p className="text-sm text-slate-500">Articles published per month</p>
            </div>
            <TrendingUp className="w-5 h-5 text-[#13BCC5]" />
          </div>

          {analytics.byMonth.length > 0 ? (
            <div className="space-y-3">
              {analytics.byMonth.map((month, idx) => (
                <div key={idx} className="flex items-center gap-4">
                  <span className="text-xs text-slate-500 w-16">{month.month}</span>
                  <div className="flex-1 h-6 bg-slate-100 rounded-md overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#13BCC5] to-[#0FA8B0] rounded-md transition-all duration-500"
                      style={{ width: `${(month.count / maxMonthCount) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-bold text-[#1b1e4c] w-8 text-right">{month.count}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-slate-400">
              <BarChart3 className="w-12 h-12 opacity-50" />
              <span className="ml-2">No data available</span>
            </div>
          )}
        </div>

        {/* Weekday Distribution */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-bold text-[#1b1e4c]">Publishing by Weekday</h3>
              <p className="text-sm text-slate-500">Best days for publishing</p>
            </div>
            <Calendar className="w-5 h-5 text-[#13BCC5]" />
          </div>

          <div className="flex items-end justify-between h-40 gap-2">
            {analytics.byWeekday.map((day, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center">
                <div
                  className={`w-full rounded-t-md transition-all duration-500 ${
                    day.count === maxWeekdayCount ? 'bg-[#13BCC5]' : 'bg-slate-200'
                  }`}
                  style={{ height: `${maxWeekdayCount > 0 ? (day.count / maxWeekdayCount) * 100 : 0}%`, minHeight: '4px' }}
                />
                <span className="text-xs text-slate-500 mt-2">{day.day}</span>
                <span className="text-xs font-bold text-[#1b1e4c]">{day.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-bold text-[#1b1e4c]">Recent Articles</h3>
            <p className="text-sm text-slate-500">Latest content activity</p>
          </div>
          <Clock className="w-5 h-5 text-[#13BCC5]" />
        </div>

        {analytics.recentActivity.length > 0 ? (
          <div className="space-y-3">
            {analytics.recentActivity.map((article, idx) => (
              <div key={idx} className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                  article.status === 'published' ? 'bg-emerald-500' : 'bg-amber-500'
                }`} />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-[#1b1e4c] text-sm truncate">{article.title}</p>
                  <p className="text-xs text-slate-500">{article.publishDate || 'No date'}</p>
                </div>
                <div className="flex items-center gap-2">
                  {article.linkedinPost && <Linkedin size={14} className="text-[#0077B5]" />}
                  {article.twitterPost && <Twitter size={14} className="text-[#1DA1F2]" />}
                  {article.articleLink && (
                    <a href={article.articleLink} target="_blank" rel="noopener noreferrer">
                      <ExternalLink size={14} className="text-slate-400 hover:text-[#13BCC5]" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-slate-400">
            <FileText className="w-12 h-12 mx-auto opacity-50 mb-2" />
            <p>No recent articles</p>
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

export default NewsArticlesAnalytics;
