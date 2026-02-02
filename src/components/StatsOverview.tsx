import React from 'react';
import { FileText, Calendar, CheckCircle, Clock, TrendingUp } from 'lucide-react';
import type { ContentStats } from '../types/content';

interface StatsOverviewProps {
  stats: ContentStats;
}

const StatsOverview: React.FC<StatsOverviewProps> = ({ stats }) => {
  const statCards = [
    {
      title: 'Total Articles',
      value: stats.totalArticles,
      icon: <FileText className="w-6 h-6" />,
      color: 'teal',
      bgColor: 'bg-[#13BCC5]'
    },
    {
      title: 'Scheduled Posts',
      value: stats.scheduledPosts,
      icon: <Calendar className="w-6 h-6" />,
      color: 'navy',
      bgColor: 'bg-[#1b1e4c]'
    },
    {
      title: 'Published Posts',
      value: stats.publishedPosts,
      icon: <CheckCircle className="w-6 h-6" />,
      color: 'green',
      bgColor: 'bg-emerald-500'
    },
    {
      title: 'Success Stories',
      value: stats.totalSuccessStories,
      icon: <TrendingUp className="w-6 h-6" />,
      color: 'purple',
      bgColor: 'bg-purple-500'
    },
    {
      title: 'Completed Stories',
      value: stats.completedStories,
      icon: <CheckCircle className="w-6 h-6" />,
      color: 'blue',
      bgColor: 'bg-blue-500'
    },
    {
      title: 'Pending Stories',
      value: stats.pendingStories,
      icon: <Clock className="w-6 h-6" />,
      color: 'orange',
      bgColor: 'bg-orange-500'
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {statCards.map((stat) => (
        <div
          key={stat.title}
          className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-all"
        >
          <div className={`${stat.bgColor} w-10 h-10 rounded-lg flex items-center justify-center mb-3`}>
            <div className="text-white">{stat.icon}</div>
          </div>
          <p className="text-2xl font-bold text-[#1b1e4c]">{stat.value}</p>
          <p className="text-xs text-slate-500 mt-1">{stat.title}</p>
        </div>
      ))}
    </div>
  );
};

export default StatsOverview;
