import React, { useState } from 'react';
import { CheckCircle, Clock, Linkedin, Twitter, Copy, Check, ChevronDown, ChevronUp } from 'lucide-react';
import type { SuccessStory } from '../types/content';
import { formatDate } from '../utils/dateUtils';

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
              <div className="px-4 pb-4">
                <div className="grid md:grid-cols-2 gap-4">
                  {/* Twitter Caption */}
                  <div className="bg-slate-50 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Twitter size={18} className="text-sky-500" />
                      <span className="font-medium text-slate-700">Twitter Caption</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          copyToClipboard(story.twitterCaption, story.id, 'twitter');
                        }}
                        className="ml-auto flex items-center gap-1 text-xs text-[#13BCC5] hover:underline"
                      >
                        {copiedId === `${story.id}-twitter` ? (
                          <>
                            <Check size={14} /> Copied!
                          </>
                        ) : (
                          <>
                            <Copy size={14} /> Copy
                          </>
                        )}
                      </button>
                    </div>
                    <p className="text-sm text-slate-600 whitespace-pre-wrap max-h-40 overflow-y-auto">
                      {story.twitterCaption || 'No Twitter caption'}
                    </p>
                  </div>

                  {/* LinkedIn Caption */}
                  <div className="bg-slate-50 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Linkedin size={18} className="text-blue-600" />
                      <span className="font-medium text-slate-700">LinkedIn Caption</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          copyToClipboard(story.linkedinCaption, story.id, 'linkedin');
                        }}
                        className="ml-auto flex items-center gap-1 text-xs text-[#13BCC5] hover:underline"
                      >
                        {copiedId === `${story.id}-linkedin` ? (
                          <>
                            <Check size={14} /> Copied!
                          </>
                        ) : (
                          <>
                            <Copy size={14} /> Copy
                          </>
                        )}
                      </button>
                    </div>
                    <p className="text-sm text-slate-600 whitespace-pre-wrap max-h-40 overflow-y-auto">
                      {story.linkedinCaption || 'No LinkedIn caption'}
                    </p>
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
