import React, { useState } from 'react';
import { CheckCircle, Clock, Linkedin, Twitter, ChevronDown, ChevronUp } from 'lucide-react';
import type { SuccessStory } from '../types/content';
import { formatDate } from '../utils/dateUtils';
import AISummary from './AISummary';

interface SuccessStoriesTableProps {
  stories: SuccessStory[];
}

const SuccessStoriesTable: React.FC<SuccessStoriesTableProps> = ({ stories }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'completed' | 'pending'>('all');

  const filteredStories = stories.filter(story => {
    if (filter === 'all') return true;
    return story.status === filter;
  });

  const copyToClipboard = async (text: string, id: string, type: string) => {
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
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-[#1b1e4c]">Customer Success Stories</h3>
            <p className="text-sm text-slate-500">{filteredStories.length} stories</p>
          </div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as 'all' | 'completed' | 'pending')}
            className="bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#13BCC5]/30"
          >
            <option value="all">All Status</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
          </select>
        </div>
      </div>

      {/* Stories List */}
      <div className="divide-y divide-slate-100">
        {filteredStories.map((story) => (
          <div key={story.id} className="hover:bg-slate-50/50 transition-colors">
            {/* Story Header */}
            <div
              className="p-4 cursor-pointer flex items-center justify-between"
              onClick={() => setExpandedId(expandedId === story.id ? null : story.id)}
            >
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  story.status === 'completed' ? 'bg-emerald-100' : 'bg-amber-100'
                }`}>
                  {story.status === 'completed' ? (
                    <CheckCircle size={20} className="text-emerald-600" />
                  ) : (
                    <Clock size={20} className="text-amber-600" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-[#1b1e4c]">
                    Story for {formatDate(story.date)}
                  </p>
                  <p className="text-sm text-slate-500">
                    {story.status === 'completed'
                      ? `Completed: ${formatDate(story.completedOn || '')}`
                      : 'Pending completion'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                  story.status === 'completed'
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-amber-100 text-amber-700'
                }`}>
                  {story.status}
                </span>
                {expandedId === story.id ? (
                  <ChevronUp size={20} className="text-slate-400" />
                ) : (
                  <ChevronDown size={20} className="text-slate-400" />
                )}
              </div>
            </div>

            {/* Expanded Content */}
            {expandedId === story.id && (
              <div className="px-4 pb-4 border-l-4 border-[#13BCC5] ml-4 bg-gradient-to-r from-slate-50 to-white">
                <div className="space-y-4 py-4">
                  {/* AI Summary */}
                  <AISummary
                    content={`${story.twitterCaption || ''} ${story.linkedinCaption || ''}`}
                    type="story"
                    status={story.status}
                  />

                  {/* Post Content */}
                  <div className="grid md:grid-cols-2 gap-4">
                    {/* Twitter Caption */}
                    <div className="bg-white rounded-xl border border-sky-100 overflow-hidden">
                      <div className="flex items-center gap-2 p-3 bg-sky-50 border-b border-sky-100">
                        <Twitter size={18} className="text-sky-500" />
                        <span className="text-sm font-semibold text-sky-900">Twitter Caption</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ml-auto ${
                          (story.twitterCaption?.length || 0) > 280
                            ? 'text-red-600 bg-red-100'
                            : 'text-sky-600 bg-sky-100'
                        }`}>
                          {story.twitterCaption?.length || 0}/280
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            copyToClipboard(story.twitterCaption, story.id, 'twitter');
                          }}
                          className="text-xs text-sky-600 hover:text-sky-800 font-medium"
                        >
                          {copiedId === `${story.id}-twitter` ? '✓ Copied!' : 'Copy'}
                        </button>
                      </div>
                      <div className="p-4 text-sm text-slate-700 max-h-48 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                        {story.twitterCaption || 'No Twitter caption'}
                      </div>
                    </div>

                    {/* LinkedIn Caption */}
                    <div className="bg-white rounded-xl border border-blue-100 overflow-hidden">
                      <div className="flex items-center gap-2 p-3 bg-blue-50 border-b border-blue-100">
                        <Linkedin size={18} className="text-blue-600" />
                        <span className="text-sm font-semibold text-blue-900">LinkedIn Caption</span>
                        <span className="text-xs text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full ml-auto">
                          {story.linkedinCaption?.length || 0} chars
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            copyToClipboard(story.linkedinCaption, story.id, 'linkedin');
                          }}
                          className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                        >
                          {copiedId === `${story.id}-linkedin` ? '✓ Copied!' : 'Copy'}
                        </button>
                      </div>
                      <div className="p-4 text-sm text-slate-700 max-h-48 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                        {story.linkedinCaption || 'No LinkedIn caption'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}

        {filteredStories.length === 0 && (
          <div className="text-center py-12">
            <p className="text-slate-500">No success stories found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SuccessStoriesTable;
