import React, { useState } from 'react';
import { RefreshCw, FileText, Calendar, Users, Clock, Download, BarChart3, Bot, Sparkles } from 'lucide-react';
import type { ContentData } from '../types/content';
import StatsOverview from './StatsOverview';
import NewsArticlesTable from './NewsArticlesTable';
import SuccessStoriesTable from './SuccessStoriesTable';
import ScheduleGrid from './ScheduleGrid';
import ContentAnalytics from './ContentAnalytics';
import AIAgent from './AIAgent';
import { exportAllToExcel, exportArticlesToExcel, exportStoriesToExcel } from '../utils/exportUtils';

interface ContentDashboardProps {
  data: ContentData;
  onRefresh: () => void;
  loading: boolean;
}

type TabType = 'overview' | 'articles' | 'stories' | 'schedule' | 'analytics' | 'ai';

const ContentDashboard: React.FC<ContentDashboardProps> = ({ data, onRefresh, loading }) => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [exporting, setExporting] = useState(false);

  const tabs = [
    { id: 'overview' as TabType, label: 'Overview', icon: <Calendar size={18} /> },
    { id: 'articles' as TabType, label: 'News Articles', icon: <FileText size={18} /> },
    { id: 'stories' as TabType, label: 'Success Stories', icon: <Users size={18} /> },
    { id: 'schedule' as TabType, label: 'Schedule', icon: <Clock size={18} /> },
    { id: 'analytics' as TabType, label: 'Analytics', icon: <BarChart3 size={18} /> },
    { id: 'ai' as TabType, label: 'AI Assistant', icon: <Bot size={18} />, highlight: true },
  ];

  const handleExportAll = async () => {
    setExporting(true);
    try {
      exportAllToExcel(data.articles, data.successStories, data.schedule);
    } finally {
      setTimeout(() => setExporting(false), 500);
    }
  };

  const handleExportArticles = () => {
    exportArticlesToExcel(data.articles);
  };

  const handleExportStories = () => {
    exportStoriesToExcel(data.successStories);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1b1e4c] font-[Manrope]">Content Dashboard</h1>
          <p className="text-slate-500 mt-1">Manage your social media content and publishing schedule</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {/* Export Dropdown */}
          <div className="relative group">
            <button
              disabled={exporting}
              className="flex items-center gap-2 px-4 py-2 bg-[#1b1e4c] text-white rounded-xl hover:bg-[#2a2e5c] transition-colors disabled:opacity-50"
            >
              <Download size={16} className={exporting ? 'animate-bounce' : ''} />
              Export
            </button>
            <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-100 py-2 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
              <button
                onClick={handleExportAll}
                className="w-full px-4 py-2 text-left text-sm text-slate-600 hover:bg-slate-50 flex items-center gap-2"
              >
                <Download size={14} /> Export All Data
              </button>
              <button
                onClick={handleExportArticles}
                className="w-full px-4 py-2 text-left text-sm text-slate-600 hover:bg-slate-50 flex items-center gap-2"
              >
                <FileText size={14} /> Export Articles
              </button>
              <button
                onClick={handleExportStories}
                className="w-full px-4 py-2 text-left text-sm text-slate-600 hover:bg-slate-50 flex items-center gap-2"
              >
                <Users size={14} /> Export Stories
              </button>
            </div>
          </div>

          <button
            onClick={onRefresh}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-[#13BCC5] text-white rounded-xl hover:bg-[#0FA8B0] transition-colors disabled:opacity-50"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
          <span className="text-xs text-slate-400 bg-slate-100 px-3 py-2 rounded-lg">
            Updated: {data.lastUpdated.toLocaleTimeString()}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl w-fit overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? tab.id === 'ai'
                  ? 'bg-gradient-to-r from-[#13BCC5] to-[#0FA8B0] text-white shadow-lg shadow-[#13BCC5]/30'
                  : 'bg-white text-[#1b1e4c] shadow-sm'
                : tab.id === 'ai'
                  ? 'text-[#13BCC5] hover:bg-[#13BCC5]/10'
                  : 'text-slate-600 hover:text-[#1b1e4c]'
            }`}
          >
            {tab.icon}
            {tab.label}
            {tab.id === 'ai' && (
              <Sparkles size={14} className={activeTab === 'ai' ? 'text-white' : 'text-[#13BCC5]'} />
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Stats */}
          <StatsOverview stats={data.stats} />

          {/* Analytics Preview */}
          <ContentAnalytics
            stats={data.stats}
            articles={data.articles}
            stories={data.successStories}
          />

          {/* Recent Articles Preview */}
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-[#1b1e4c]">Recent Articles</h3>
                <button
                  onClick={() => setActiveTab('articles')}
                  className="text-xs text-[#13BCC5] hover:underline"
                >
                  View all
                </button>
              </div>
              <div className="space-y-3">
                {data.articles.slice(0, 5).map((article) => (
                  <div key={article.id} className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl">
                    <div className={`w-2 h-2 rounded-full mt-2 ${
                      article.status === 'published' ? 'bg-emerald-500' : 'bg-blue-500'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#1b1e4c] truncate">{article.title}</p>
                      <p className="text-xs text-slate-500 mt-1">{article.publishDate}</p>
                    </div>
                  </div>
                ))}
                {data.articles.length === 0 && (
                  <p className="text-sm text-slate-500 text-center py-4">No articles yet</p>
                )}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-[#1b1e4c]">Recent Success Stories</h3>
                <button
                  onClick={() => setActiveTab('stories')}
                  className="text-xs text-[#13BCC5] hover:underline"
                >
                  View all
                </button>
              </div>
              <div className="space-y-3">
                {data.successStories.slice(0, 5).map((story) => (
                  <div key={story.id} className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl">
                    <div className={`w-2 h-2 rounded-full mt-2 ${
                      story.status === 'completed' ? 'bg-emerald-500' : 'bg-amber-500'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#1b1e4c]">Story for {story.date}</p>
                      <p className="text-xs text-slate-500 mt-1 truncate">
                        {story.twitterCaption?.slice(0, 80) || 'No caption'}
                      </p>
                    </div>
                  </div>
                ))}
                {data.successStories.length === 0 && (
                  <p className="text-sm text-slate-500 text-center py-4">No success stories yet</p>
                )}
              </div>
            </div>
          </div>

          {/* Schedule Preview */}
          {data.schedule.length > 0 && (
            <ScheduleGrid schedule={data.schedule} />
          )}
        </div>
      )}

      {activeTab === 'articles' && (
        <NewsArticlesTable articles={data.articles} />
      )}

      {activeTab === 'stories' && (
        <SuccessStoriesTable stories={data.successStories} />
      )}

      {activeTab === 'schedule' && (
        <ScheduleGrid schedule={data.schedule} />
      )}

      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h3 className="text-lg font-bold text-[#1b1e4c] mb-2">Content Analytics</h3>
            <p className="text-sm text-slate-500 mb-6">Visual insights into your content performance</p>
            <ContentAnalytics
              stats={data.stats}
              articles={data.articles}
              stories={data.successStories}
            />
          </div>

          {/* Summary Stats */}
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-[#13BCC5] to-[#0FA8B0] rounded-2xl p-6 text-white">
              <h4 className="text-sm font-medium opacity-80">Total Content</h4>
              <p className="text-3xl font-bold mt-2">
                {data.stats.totalArticles + data.stats.totalSuccessStories}
              </p>
              <p className="text-sm opacity-80 mt-1">Articles & Stories</p>
            </div>

            <div className="bg-gradient-to-br from-[#1b1e4c] to-[#2a2e5c] rounded-2xl p-6 text-white">
              <h4 className="text-sm font-medium opacity-80">Completion Rate</h4>
              <p className="text-3xl font-bold mt-2">
                {data.stats.totalSuccessStories > 0
                  ? Math.round((data.stats.completedStories / data.stats.totalSuccessStories) * 100)
                  : 0}%
              </p>
              <p className="text-sm opacity-80 mt-1">Stories Completed</p>
            </div>

            <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-6 text-white">
              <h4 className="text-sm font-medium opacity-80">Published Rate</h4>
              <p className="text-3xl font-bold mt-2">
                {data.stats.totalArticles > 0
                  ? Math.round((data.stats.publishedPosts / data.stats.totalArticles) * 100)
                  : 0}%
              </p>
              <p className="text-sm opacity-80 mt-1">Articles Published</p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'ai' && (
        <div className="space-y-6">
          {/* AI Header */}
          <div className="bg-gradient-to-r from-[#1b1e4c] via-[#2a2e5c] to-[#1b1e4c] rounded-2xl p-6 text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-50" />
            <div className="relative">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#13BCC5] to-[#0FA8B0] flex items-center justify-center">
                  <Bot className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    Defy AI Assistant
                    <Sparkles className="w-5 h-5 text-[#13BCC5]" />
                  </h3>
                  <p className="text-white/60 text-sm">Powered by Advanced Language Models</p>
                </div>
              </div>
              <p className="text-white/80 max-w-2xl">
                Your intelligent business analyst that can analyze your content data, predict outcomes,
                identify opportunities, and help you make strategic decisions.
              </p>
            </div>
          </div>

          {/* AI Agent Component */}
          <AIAgent data={data} />

          {/* AI Capabilities */}
          <div className="grid md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border border-slate-100 p-4">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center mb-3">
                <BarChart3 className="w-5 h-5 text-blue-600" />
              </div>
              <h4 className="font-semibold text-[#1b1e4c] text-sm">Data Analysis</h4>
              <p className="text-xs text-slate-500 mt-1">Deep insights from your content metrics</p>
            </div>
            <div className="bg-white rounded-xl border border-slate-100 p-4">
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center mb-3">
                <Sparkles className="w-5 h-5 text-purple-600" />
              </div>
              <h4 className="font-semibold text-[#1b1e4c] text-sm">Predictions</h4>
              <p className="text-xs text-slate-500 mt-1">Forecast future performance trends</p>
            </div>
            <div className="bg-white rounded-xl border border-slate-100 p-4">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center mb-3">
                <FileText className="w-5 h-5 text-emerald-600" />
              </div>
              <h4 className="font-semibold text-[#1b1e4c] text-sm">Content Ideas</h4>
              <p className="text-xs text-slate-500 mt-1">Generate creative post suggestions</p>
            </div>
            <div className="bg-white rounded-xl border border-slate-100 p-4">
              <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center mb-3">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
              <h4 className="font-semibold text-[#1b1e4c] text-sm">Strategy</h4>
              <p className="text-xs text-slate-500 mt-1">Optimal posting schedules & timing</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContentDashboard;
