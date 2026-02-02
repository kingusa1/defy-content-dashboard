import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Loader2, RefreshCw, Copy, Check, Bot } from 'lucide-react';

interface AISummaryProps {
  content: string;
  type: 'article' | 'story' | 'metric';
  title?: string;
  metadata?: Record<string, string>;
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
const getCacheKey = (content: string, type: string, title?: string, metadata?: Record<string, string>): string => {
  const metaStr = metadata ? JSON.stringify(metadata) : '';
  return `${type}:${title || ''}:${content.slice(0, 200)}:${metaStr.slice(0, 100)}`;
};

const AISummary: React.FC<AISummaryProps> = ({ content, type, title, metadata }) => {
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
    const cacheKey = getCacheKey(content, type, title, metadata);
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

    const prompt = type === 'article'
      ? `You are a social media marketing expert. Analyze this insurance/business news post and provide a CONCISE actionable summary (max 4 sentences):

1. KEY INSIGHT: What's the main news/value?
2. BEST TIME TO POST: Suggest optimal posting time
3. ENGAGEMENT TIP: One specific way to boost engagement
4. NEXT ACTION: What should the user do with this post?

Title: ${title || 'N/A'}
Content: ${content}

Be direct, specific, and actionable. No fluff.`
      : type === 'story'
      ? `You are a social media marketing expert. Analyze this customer success story and provide a CONCISE actionable summary (max 4 sentences):

1. STORY STRENGTH: What makes this story compelling?
2. EMOTIONAL HOOK: The key emotional trigger for engagement
3. CTA EFFECTIVENESS: Is the call-to-action strong? How to improve?
4. NEXT ACTION: Should this post now, be edited, or saved for later?

Content: ${content}

Be direct, specific, and actionable. No fluff.`
      : `You are a LinkedIn outreach performance analyst. Analyze these metrics and provide a CONCISE actionable summary (max 4 sentences):

METRICS:
- Agent: ${metadata?.agent || 'N/A'}
- Campaign: ${metadata?.campaign || 'N/A'}
- Acceptance Rate: ${metadata?.acceptanceRate || 'N/A'}
- Replies: ${metadata?.replies || 'N/A'}
- Total Invited: ${metadata?.totalInvited || 'N/A'}
- Total Accepted: ${metadata?.totalAccepted || 'N/A'}
- Messages Sent: ${metadata?.totalMessaged || 'N/A'}
- Net New Connects: ${metadata?.netNewConnects || 'N/A'}
- Defy Lead: ${metadata?.defyLead || 'None'}

PROVIDE:
1. PERFORMANCE VERDICT: Good/Average/Needs Improvement + why
2. KEY INSIGHT: Most important finding from the data
3. BOTTLENECK: What's limiting better results?
4. NEXT ACTION: Specific step to improve performance

Be direct, data-driven, and actionable. No fluff.`;

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
    const fallback = generateFallbackSummary(content, type, metadata);
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
    meta?: Record<string, string>
  ): string => {
    if (contentType === 'metric' && meta) {
      const acceptRate = parseFloat(meta.acceptanceRate?.replace('%', '') || '0');
      const replies = parseInt(meta.replies || '0');
      const invited = parseInt(meta.totalInvited || '0');

      let verdict = 'NEEDS REVIEW';
      let insight = '';
      let action = '';

      if (acceptRate >= 30) {
        verdict = '✅ STRONG PERFORMANCE';
        insight = `${acceptRate}% acceptance rate is above average.`;
      } else if (acceptRate >= 15) {
        verdict = '⚠️ AVERAGE PERFORMANCE';
        insight = `${acceptRate}% acceptance rate - room for improvement.`;
      } else if (acceptRate > 0) {
        verdict = '🔴 NEEDS ATTENTION';
        insight = `${acceptRate}% acceptance rate is below target.`;
      }

      if (replies > 0 && invited > 0) {
        const replyRate = ((replies / invited) * 100).toFixed(1);
        action = `Reply rate: ${replyRate}%. ${parseFloat(replyRate) < 5 ? 'Consider revising message template.' : 'Message resonating well.'}`;
      } else {
        action = 'Review outreach volume and message quality.';
      }

      return `${verdict} | ${insight} ${action} Next: ${meta.defyLead ? 'Follow up on lead: ' + meta.defyLead : 'Focus on generating qualified leads.'}`;
    }

    const wordCount = text.split(/\s+/).length;
    const hasHashtags = text.includes('#');
    const hasEmojis = /[\u{1F300}-\u{1F9FF}]/u.test(text);
    const hasCTA = /click|learn|discover|join|sign up|contact|dm|link/i.test(text);

    if (contentType === 'article') {
      const issues = [];
      if (!hasHashtags) issues.push('Add 3-5 relevant hashtags');
      if (!hasEmojis) issues.push('Add emojis for 25% more engagement');
      if (wordCount > 300) issues.push('Consider shortening for better readability');
      if (!hasCTA) issues.push('Add a clear call-to-action');

      const status = issues.length === 0 ? '✅ READY TO POST' : `⚠️ ${issues.length} IMPROVEMENTS NEEDED`;
      return `${status} | ${wordCount} words. ${issues.length > 0 ? 'To-do: ' + issues.join(', ') + '.' : 'Post is optimized for engagement.'} Best time: Tue-Thu 9-11am.`;
    }

    // Success story
    const issues = [];
    if (!hasHashtags) issues.push('Add hashtags (#CustomerSuccess, #InsurTech)');
    if (!hasEmojis) issues.push('Add emojis for emotional connection');
    if (!hasCTA) issues.push('Add CTA (Contact us, Learn more)');

    const status = issues.length === 0 ? '✅ COMPELLING STORY' : `⚠️ ENHANCE BEFORE POSTING`;
    return `${status} | ${wordCount} words. ${issues.length > 0 ? 'Improvements: ' + issues.join(', ') + '.' : 'Strong emotional appeal.'} Next: ${issues.length > 0 ? 'Make edits then schedule.' : 'Schedule for peak hours.'}`;
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
