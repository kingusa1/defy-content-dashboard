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
        ? `[${statusLabel}] Analyze this social media post:

Title: ${title || 'Untitled'}
Content: ${content.slice(0, 500)}

Respond in this exact format (keep it concise):
SUMMARY: [1 sentence - what is this post about?]
VERDICT: [Strong/Average/Weak] - [brief reason why]
TIP: [1 specific improvement suggestion]`
        : `[${statusLabel}] This article "${title || 'Untitled'}" has NO CONTENT. The LinkedIn and Twitter posts need to be written before publishing.`
      : type === 'story'
      ? hasContent
        ? `[${statusLabel}] Analyze this customer success story:

Content: ${content.slice(0, 500)}

Respond in this exact format (keep it concise):
SUMMARY: [1 sentence - what is the story about and what result?]
VERDICT: [Strong/Average/Weak] - [is it compelling? why?]
TIP: [1 specific suggestion to make it more engaging]`
        : `[${statusLabel}] This success story has NO CONTENT. The Twitter and LinkedIn captions need to be written.`
      : `Analyze these LinkedIn outreach metrics:

Agent: ${metadata?.agent || 'Unknown'}
Acceptance Rate: ${metadata?.acceptanceRate || 'N/A'}
Replies: ${metadata?.replies || '0'}
Total Invited: ${metadata?.totalInvited || '0'}
Total Accepted: ${metadata?.totalAccepted || '0'}
Week: ${metadata?.weekEnd || 'Unknown'}
Lead: ${metadata?.defyLead || 'None'}

Respond in this exact format (keep it concise):
SUMMARY: [1 sentence with the key numbers]
VERDICT: [Strong/Average/Weak] performance - [why?]
TIP: [1 specific action to improve]`;

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
      const accepted = parseInt(meta.totalAccepted || '0');
      const hasData = acceptRate > 0 || replies > 0 || invited > 0;

      if (!hasData) {
        return `⚠️ NO DATA\nSUMMARY: No metrics recorded for ${meta.agent || 'this agent'}.\nVERDICT: Cannot evaluate - missing data.\nTIP: Check if data was entered correctly in the sheet.`;
      }

      let verdict = '';
      let tip = '';

      if (acceptRate >= 30) {
        verdict = '✅ Strong performance';
        tip = 'Keep this approach and scale up volume.';
      } else if (acceptRate >= 15) {
        verdict = '⚠️ Average performance';
        tip = 'Test different connection request messages.';
      } else {
        verdict = '🔴 Weak performance';
        tip = 'Review targeting criteria and message quality.';
      }

      const replyRate = invited > 0 ? ((replies / invited) * 100).toFixed(1) : '0';

      return `SUMMARY: ${invited} invited, ${accepted} accepted (${acceptRate}%), ${replies} replies (${replyRate}% reply rate).\nVERDICT: ${verdict}\nTIP: ${tip}`;
    }

    // Handle missing content
    if (!hasContent) {
      if (contentType === 'article') {
        return `[${statusLabel}] ⚠️ NO CONTENT\nSUMMARY: This article has no social media posts written yet.\nVERDICT: Cannot evaluate - content missing.\nTIP: Write LinkedIn and Twitter posts before scheduling.`;
      }
      return `[${statusLabel}] ⚠️ NO CONTENT\nSUMMARY: This success story has no captions.\nVERDICT: Cannot evaluate - content missing.\nTIP: Write Twitter and LinkedIn captions.`;
    }

    const wordCount = text.split(/\s+/).length;
    const hasHashtags = text.includes('#');
    const hasEmojis = /[\u{1F300}-\u{1F9FF}]/u.test(text);
    const preview = text.slice(0, 80).split(' ').slice(0, 12).join(' ');

    let verdict = '⚠️ Average';
    let tip = '';

    if (hasHashtags && hasEmojis && wordCount > 50) {
      verdict = '✅ Strong';
      tip = 'Ready to post. Consider A/B testing different hooks.';
    } else if (!hasHashtags) {
      tip = 'Add 3-5 relevant hashtags for better reach.';
    } else if (!hasEmojis) {
      tip = 'Add emojis to increase engagement by 25%.';
    } else if (wordCount < 50) {
      tip = 'Content is short. Add more detail or context.';
    } else {
      tip = 'Review call-to-action clarity.';
    }

    if (contentType === 'article') {
      return `[${statusLabel}]\nSUMMARY: ${wordCount} words about "${preview}..."\nVERDICT: ${verdict}\nTIP: ${tip}`;
    }

    // Success story
    return `[${statusLabel}]\nSUMMARY: ${wordCount} words - customer success story.\nVERDICT: ${verdict}\nTIP: ${tip}`;
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
