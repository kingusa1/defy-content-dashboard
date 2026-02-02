import React, { useState, useMemo } from 'react';
import { Search, ExternalLink, Check, Linkedin, Twitter, ChevronDown, ChevronUp } from 'lucide-react';
import type { NewsArticle } from '../types/content';
import { formatDate, getRelativeTime } from '../utils/dateUtils';
import AISummary from './AISummary';

interface NewsArticlesTableProps {
  articles: NewsArticle[];
}

const NewsArticlesTable: React.FC<NewsArticlesTableProps> = ({ articles }) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'scheduled' | 'published'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filteredArticles = useMemo(() => {
    return articles.filter(article => {
      const matchesSearch = article.title.toLowerCase().includes(search.toLowerCase()) ||
        article.linkedinPost.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'all' || article.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [articles, search, statusFilter]);

  const copyToClipboard = async (text: string, id: string, type: 'linkedin' | 'twitter') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(`${id}-${type}`);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-slate-100">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-[#1b1e4c]">News Articles</h3>
            <p className="text-sm text-slate-500">{filteredArticles.length} articles</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search articles..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-64 bg-slate-50 border border-slate-200 rounded-lg py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#13BCC5]/30"
              />
            </div>
            {/* Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | 'scheduled' | 'published')}
              className="bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#13BCC5]/30"
            >
              <option value="all">All Status</option>
              <option value="scheduled">Scheduled</option>
              <option value="published">Published</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50/50">
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Title</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Publish Date</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredArticles.map((article) => (
              <React.Fragment key={article.id}>
                <tr
                  className="hover:bg-slate-50/50 transition-colors cursor-pointer"
                  onClick={() => setExpandedId(expandedId === article.id ? null : article.id)}
                >
                  <td className="px-6 py-4">
                    <div className="max-w-md">
                      <p className="font-medium text-[#1b1e4c] truncate">{article.title}</p>
                      <p className="text-xs text-slate-400 mt-1">{formatDate(article.date)}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-sm text-slate-700">{formatDate(article.publishDate)}</p>
                      <p className="text-xs text-slate-400">{getRelativeTime(article.publishDate)}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                      article.status === 'published'
                        ? 'bg-emerald-100 text-emerald-700'
                        : article.status === 'scheduled'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-slate-100 text-slate-700'
                    }`}>
                      {article.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {article.articleLink && (
                        <a
                          href={article.articleLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ExternalLink size={16} className="text-slate-500" />
                        </a>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          copyToClipboard(article.linkedinPost, article.id, 'linkedin');
                        }}
                        className="p-2 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Copy LinkedIn Post"
                      >
                        {copiedId === `${article.id}-linkedin` ? (
                          <Check size={16} className="text-emerald-500" />
                        ) : (
                          <Linkedin size={16} className="text-blue-600" />
                        )}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          copyToClipboard(article.twitterPost, article.id, 'twitter');
                        }}
                        className="p-2 hover:bg-sky-50 rounded-lg transition-colors"
                        title="Copy Twitter Post"
                      >
                        {copiedId === `${article.id}-twitter` ? (
                          <Check size={16} className="text-emerald-500" />
                        ) : (
                          <Twitter size={16} className="text-sky-500" />
                        )}
                      </button>
                      <button
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors ml-1"
                        title="View details"
                      >
                        {expandedId === article.id ? (
                          <ChevronUp size={16} className="text-[#13BCC5]" />
                        ) : (
                          <ChevronDown size={16} className="text-slate-400" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
                {/* Expanded Content */}
                {expandedId === article.id && (
                  <tr>
                    <td colSpan={4} className="px-6 py-4 bg-gradient-to-b from-slate-50 to-white border-l-4 border-[#13BCC5]">
                      <div className="space-y-4">
                        {/* AI Summary */}
                        <AISummary
                          content={`${article.linkedinPost || ''} ${article.twitterPost || ''}`}
                          type="article"
                          title={article.title}
                        />

                        {/* Post Content */}
                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="bg-white rounded-xl border border-blue-100 overflow-hidden">
                            <div className="flex items-center gap-2 p-3 bg-blue-50 border-b border-blue-100">
                              <Linkedin size={18} className="text-blue-600" />
                              <span className="text-sm font-semibold text-blue-900">LinkedIn Post</span>
                              <span className="text-xs text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full ml-auto">
                                {article.linkedinPost?.length || 0} chars
                              </span>
                              <button
                                onClick={() => copyToClipboard(article.linkedinPost, article.id, 'linkedin')}
                                className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                              >
                                {copiedId === `${article.id}-linkedin` ? '✓ Copied!' : 'Copy'}
                              </button>
                            </div>
                            <div className="p-4 text-sm text-slate-700 max-h-64 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                              {article.linkedinPost || 'No LinkedIn post content'}
                            </div>
                          </div>

                          <div className="bg-white rounded-xl border border-sky-100 overflow-hidden">
                            <div className="flex items-center gap-2 p-3 bg-sky-50 border-b border-sky-100">
                              <Twitter size={18} className="text-sky-500" />
                              <span className="text-sm font-semibold text-sky-900">Twitter Post</span>
                              <span className={`text-xs px-2 py-0.5 rounded-full ml-auto ${
                                (article.twitterPost?.length || 0) > 280
                                  ? 'text-red-600 bg-red-100'
                                  : 'text-sky-600 bg-sky-100'
                              }`}>
                                {article.twitterPost?.length || 0}/280
                              </span>
                              <button
                                onClick={() => copyToClipboard(article.twitterPost, article.id, 'twitter')}
                                className="text-xs text-sky-600 hover:text-sky-800 font-medium"
                              >
                                {copiedId === `${article.id}-twitter` ? '✓ Copied!' : 'Copy'}
                              </button>
                            </div>
                            <div className="p-4 text-sm text-slate-700 max-h-64 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                              {article.twitterPost || 'No Twitter post content'}
                            </div>
                          </div>
                        </div>

                        {/* Article Link */}
                        {article.articleLink && (
                          <div className="flex items-center gap-2 p-3 bg-slate-100 rounded-lg">
                            <ExternalLink size={16} className="text-slate-500" />
                            <span className="text-sm text-slate-600">Source:</span>
                            <a
                              href={article.articleLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-[#13BCC5] hover:underline truncate flex-1"
                            >
                              {article.articleLink}
                            </a>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>

        {filteredArticles.length === 0 && (
          <div className="text-center py-12">
            <p className="text-slate-500">No articles found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NewsArticlesTable;
