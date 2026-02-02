import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Loader2, RefreshCw, Copy, Check, Bot } from 'lucide-react';

interface AISummaryProps {
  content: string;
  type: 'article' | 'story' | 'metric';
  title?: string;
  metadata?: Record<string, string>;
  status?: 'scheduled' | 'published' | 'completed' | 'pending' | 'draft';
}

// Available Pollinations AI models to try in order
const AI_MODELS = [
  'openai',
  'mistral',
  'llama',
  'qwen',
  'deepseek',
];

// Simple cache for AI summaries (persists during session)
const summaryCache = new Map<string, { summary: string; model: string }>();

// Generate a cache key from content
const getCacheKey = (content: string, type: string, title?: string, metadata?: Record<string, string>, status?: string): string => {
  const metaStr = metadata ? JSON.stringify(metadata) : '';
  return `${type}:${status || ''}:${title || ''}:${content.slice(0, 200)}:${metaStr.slice(0, 100)}`;
};

const AISummary: React.FC<AISummaryProps> = ({ content, type, title, metadata, status }) => {
  const [summary, setSummary] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [usedModel, setUsedModel] = useState<string | null>(null);
  const [currentModel, setCurrentModel] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const generateSummary = async (forceRefresh = false) => {
    if (!content || content.trim().length < 10) {
      setSummary('Not enough content to generate a summary.');
      return;
    }

    // Check cache first (unless forcing refresh)
    const cacheKey = getCacheKey(content, type, title, metadata, status);
    if (!forceRefresh && summaryCache.has(cacheKey)) {
      const cached = summaryCache.get(cacheKey)!;
      setSummary(cached.summary);
      setUsedModel(cached.model);
      return;
    }

    // Cancel any existing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    setLoading(true);
    setError(null);
    setUsedModel(null);
    setCurrentModel(null);

    // Check for missing/empty content
    const hasContent = content && content.trim().length > 20;
    const statusLabel = status === 'published' ? 'PUBLISHED' : status === 'completed' ? 'COMPLETED' : status === 'pending' ? 'PENDING' : status === 'draft' ? 'DRAFT' : 'SCHEDULED';

    const prompt = type === 'article'
      ? hasContent
        ? `This is a ${statusLabel} social media post. Summarize in 2-3 sentences what it's about. Focus on the actual topic, key message, and target audience.

Status: ${statusLabel}
Title: ${title || 'Untitled'}
Content: ${content.slice(0, 500)}

Summary:`
        : `This article "${title || 'Untitled'}" is ${statusLabel} but has no post content yet. State that the content is missing and needs to be written.`
      : type === 'story'
      ? hasContent
        ? `This customer success story is ${statusLabel}. Summarize in 2-3 sentences what the story is about and what results are highlighted.

Status: ${statusLabel}
Content: ${content.slice(0, 500)}

Summary:`
        : `This success story is ${statusLabel} but has no content yet. State that the captions need to be written.`
      : `Analyze these LinkedIn outreach metrics. State the actual numbers and whether performance is good, average, or needs improvement.

Agent: ${metadata?.agent || 'No agent specified'}
Campaign: ${metadata?.campaign || 'No campaign'}
Acceptance Rate: ${metadata?.acceptanceRate || 'No data'}
Replies: ${metadata?.replies || 'No data'}
Total Invited: ${metadata?.totalInvited || 'No data'}
Total Accepted: ${metadata?.totalAccepted || 'No data'}
Week: ${metadata?.weekEnd || 'Unknown week'}
Lead: ${metadata?.defyLead || 'No lead assigned'}

Analysis:`;

    // Try each model in sequence until one succeeds
    for (const model of AI_MODELS) {
      try {
        setCurrentModel(model);

        abortControllerRef.current = new AbortController();
        const timeoutId = setTimeout(() => abortControllerRef.current?.abort(), 10000); // 10s timeout per model

        const response = await fetch(
          `https://text.pollinations.ai/${encodeURIComponent(prompt)}?model=${model}`,
          {
            method: 'GET',
            headers: { 'Accept': 'text/plain' },
            signal: abortControllerRef.current.signal
          }
        );

        clearTimeout(timeoutId);

        if (response.ok) {
          const text = await response.text();
          if (text && text.trim().length > 10) {
            const trimmedText = text.trim();
            setSummary(trimmedText);
            setUsedModel(model);
            setCurrentModel(null);
            setLoading(false);
            // Cache the successful result
            summaryCache.set(cacheKey, { summary: trimmedText, model });
            return; // Success! Exit the loop
          }
        }

        // Small delay before trying next model to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (err) {
        if ((err as Error).name === 'AbortError') {
          console.log(`Model ${model} timed out, trying next...`);
        } else {
          console.log(`Model ${model} failed, trying next...`, err);
        }
        // Continue to next model
      }
    }

    // All models failed, use fallback
    console.log('All AI models failed, using fallback summary');
    const fallback = generateFallbackSummary(content, type, metadata, status);
    setSummary(fallback);
    setUsedModel('fallback');
    setCurrentModel(null);
    setError(null);
    setLoading(false);
    // Cache the fallback too
    summaryCache.set(cacheKey, { summary: fallback, model: 'fallback' });
  };

  const generateFallbackSummary = (
    text: string,
    contentType: string,
    meta?: Record<string, string>,
    itemStatus?: string
  ): string => {
    const statusLabel = itemStatus === 'published' ? '📤 PUBLISHED' : itemStatus === 'completed' ? '✅ COMPLETED' : itemStatus === 'pending' ? '⏳ PENDING' : itemStatus === 'draft' ? '📝 DRAFT' : '📅 SCHEDULED';
    const hasContent = text && text.trim().length > 20;

    if (contentType === 'metric' && meta) {
      const acceptRate = parseFloat(meta.acceptanceRate?.replace('%', '') || '0');
      const replies = parseInt(meta.replies || '0');
      const invited = parseInt(meta.totalInvited || '0');
      const hasData = acceptRate > 0 || replies > 0 || invited > 0;

      if (!hasData) {
        return `⚠️ NO DATA | Metrics for ${meta.agent || 'this agent'} have no recorded activity. Check if data was entered correctly.`;
      }

      let verdict = 'NEEDS REVIEW';
      let insight = '';

      if (acceptRate >= 30) {
        verdict = '✅ STRONG';
        insight = `${acceptRate}% acceptance rate is above average.`;
      } else if (acceptRate >= 15) {
        verdict = '⚠️ AVERAGE';
        insight = `${acceptRate}% acceptance rate - room for improvement.`;
      } else if (acceptRate > 0) {
        verdict = '🔴 LOW';
        insight = `${acceptRate}% acceptance rate is below target.`;
      }

      const replyInfo = replies > 0 && invited > 0
        ? `Reply rate: ${((replies / invited) * 100).toFixed(1)}%.`
        : '';

      return `${verdict} | ${insight} ${replyInfo} ${meta.defyLead ? 'Lead: ' + meta.defyLead : 'No lead assigned.'}`;
    }

    // Handle missing content
    if (!hasContent) {
      if (contentType === 'article') {
        return `${statusLabel} | ⚠️ NO CONTENT - This article needs LinkedIn and Twitter posts written.`;
      }
      return `${statusLabel} | ⚠️ NO CONTENT - This success story needs captions written.`;
    }

    const wordCount = text.split(/\s+/).length;

    if (contentType === 'article') {
      return `${statusLabel} | ${wordCount} words. Post about ${text.slice(0, 100).split(' ').slice(0, 10).join(' ')}...`;
    }

    // Success story
    return `${statusLabel} | ${wordCount} words. Story content ready for review.`;
  };

  useEffect(() => {
    generateSummary(false);
    // Cleanup on unmount
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [content, type]);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-4 border border-purple-100">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
            <Bot size={16} className="text-white" />
          </div>
          <div>
            <span className="font-semibold text-purple-900 text-sm">AI Summary</span>
            <Sparkles size={12} className="inline ml-1 text-purple-500" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          {summary && !loading && (
            <button
              onClick={copyToClipboard}
              className="p-1.5 hover:bg-purple-100 rounded-lg transition-colors"
              title="Copy summary"
            >
              {copied ? (
                <Check size={14} className="text-emerald-500" />
              ) : (
                <Copy size={14} className="text-purple-500" />
              )}
            </button>
          )}
          <button
            onClick={() => generateSummary(true)}
            disabled={loading}
            className="p-1.5 hover:bg-purple-100 rounded-lg transition-colors disabled:opacity-50"
            title="Regenerate summary"
          >
            <RefreshCw size={14} className={`text-purple-500 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-purple-600">
          <Loader2 size={16} className="animate-spin" />
          <span className="text-sm">
            {currentModel ? `Trying ${currentModel}...` : 'Generating AI insights...'}
          </span>
        </div>
      ) : error ? (
        <div className="text-sm text-red-600">{error}</div>
      ) : (
        <div>
          <p className="text-sm text-purple-800 leading-relaxed">{summary}</p>
          {usedModel && (
            <div className="mt-2 flex items-center gap-1">
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                usedModel === 'fallback'
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-purple-100 text-purple-600'
              }`}>
                {usedModel === 'fallback' ? 'Quick Analysis' : `AI: ${usedModel}`}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AISummary;
