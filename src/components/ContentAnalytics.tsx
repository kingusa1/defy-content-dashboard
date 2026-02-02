import React from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { ContentStats, NewsArticle, SuccessStory } from '../types/content';

interface ContentAnalyticsProps {
  stats: ContentStats;
  articles: NewsArticle[];
  stories: SuccessStory[];
}

const COLORS = {
  teal: '#13BCC5',
  navy: '#1b1e4c',
  emerald: '#10b981',
  amber: '#f59e0b',
  blue: '#3b82f6',
  purple: '#8b5cf6',
};

const ContentAnalytics: React.FC<ContentAnalyticsProps> = ({ stats, articles, stories: _stories }) => {
  // Note: _stories is available for future use (stories by month, etc.)
  // Article status data for pie chart
  const articleStatusData = [
    { name: 'Published', value: stats.publishedPosts, color: COLORS.emerald },
    { name: 'Scheduled', value: stats.scheduledPosts, color: COLORS.blue },
  ].filter(item => item.value > 0);

  // Story status data for pie chart
  const storyStatusData = [
    { name: 'Completed', value: stats.completedStories, color: COLORS.emerald },
    { name: 'Pending', value: stats.pendingStories, color: COLORS.amber },
  ].filter(item => item.value > 0);

  // Articles by month for bar chart
  const getMonthlyData = () => {
    const monthCounts: Record<string, number> = {};

    articles.forEach(article => {
      if (article.publishDate) {
        const date = new Date(article.publishDate);
        const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
        monthCounts[monthKey] = (monthCounts[monthKey] || 0) + 1;
      }
    });

    return Object.entries(monthCounts)
      .slice(-6) // Last 6 months
      .map(([month, count]) => ({ month, articles: count }));
  };

  const monthlyData = getMonthlyData();

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* Article Status Pie Chart */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h4 className="text-sm font-semibold text-[#1b1e4c] mb-4">Article Status</h4>
        {articleStatusData.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={articleStatusData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {articleStatusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
              />
              <Legend
                verticalAlign="bottom"
                height={36}
                formatter={(value) => <span className="text-xs text-slate-600">{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[200px] flex items-center justify-center text-slate-400">
            No article data
          </div>
        )}
      </div>

      {/* Story Status Pie Chart */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h4 className="text-sm font-semibold text-[#1b1e4c] mb-4">Success Story Status</h4>
        {storyStatusData.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={storyStatusData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {storyStatusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
              />
              <Legend
                verticalAlign="bottom"
                height={36}
                formatter={(value) => <span className="text-xs text-slate-600">{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[200px] flex items-center justify-center text-slate-400">
            No story data
          </div>
        )}
      </div>

      {/* Monthly Articles Bar Chart */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h4 className="text-sm font-semibold text-[#1b1e4c] mb-4">Articles by Month</h4>
        {monthlyData.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={monthlyData}>
              <XAxis
                dataKey="month"
                tick={{ fontSize: 11, fill: '#64748b' }}
                axisLine={{ stroke: '#e2e8f0' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#64748b' }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
              />
              <Bar dataKey="articles" fill={COLORS.teal} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[200px] flex items-center justify-center text-slate-400">
            No monthly data
          </div>
        )}
      </div>
    </div>
  );
};

export default ContentAnalytics;
