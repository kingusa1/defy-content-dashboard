import React, { useState, useEffect } from 'react';
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

const AISummary: React.FC<AISummaryProps> = ({ content, type, title, metadata }) => {
  const [summary, setSummary] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [usedModel, setUsedModel] = useState<string | null>(null);

  const generateSummary = async () => {
    if (!content || content.trim().length < 10) {
      setSummary('Not enough content to generate a summary.');
      return;
    }

    setLoading(true);
    setError(null);
    setUsedModel(null);

    const prompt = type === 'article'
      ? `Analyze this social media post about insurance/business news and provide a brief 2-3 sentence summary highlighting the key points, target audience appeal, and potential engagement value:\n\nTitle: ${title || 'N/A'}\nContent: ${content}`
      : type === 'story'
      ? `Analyze this customer success story social media post and provide a brief 2-3 sentence summary highlighting the customer benefit, emotional appeal, and call-to-action effectiveness:\n\nContent: ${content}`
      : `Analyze this weekly metrics data and provide a brief 2-3 sentence summary highlighting performance insights, trends, and recommendations:\n\nData: ${JSON.stringify(metadata || {})}`;

    // Try each model in sequence until one succeeds
    for (const model of AI_MODELS) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout per model

        const response = await fetch(
          `https://text.pollinations.ai/${encodeURIComponent(prompt)}?model=${model}`,
          {
            method: 'GET',
            headers: { 'Accept': 'text/plain' },
            signal: controller.signal
          }
        );

        clearTimeout(timeoutId);

        if (response.ok) {
          const text = await response.text();
          if (text && text.trim().length > 10) {
            setSummary(text.trim());
            setUsedModel(model);
            setLoading(false);
            return; // Success! Exit the loop
          }
        }
      } catch (err) {
        console.log(`Model ${model} failed, trying next...`, err);
        // Continue to next model
      }
    }

    // All models failed, use fallback
    console.log('All AI models failed, using fallback summary');
    const fallback = generateFallbackSummary(content, type, metadata);
    setSummary(fallback);
    setUsedModel('fallback');
    setError(null);
    setLoading(false);
  };

  const generateFallbackSummary = (
    text: string,
    contentType: string,
    meta?: Record<string, string>
  ): string => {
    if (contentType === 'metric' && meta) {
      const insights = [];
      if (meta.acceptanceRate) insights.push(`Acceptance rate: ${meta.acceptanceRate}`);
      if (meta.replies) insights.push(`${meta.replies} replies received`);
      if (meta.totalInvited) insights.push(`${meta.totalInvited} total invitations`);
      if (meta.campaign) insights.push(`Campaign: ${meta.campaign}`);
      return insights.length > 0
        ? `Key metrics: ${insights.join(', ')}. Review the data for detailed performance analysis.`
        : 'Review the complete data set for performance insights.';
    }

    const wordCount = text.split(/\s+/).length;
    const hasHashtags = text.includes('#');
    const hasEmojis = /[\u{1F300}-\u{1F9FF}]/u.test(text);

    if (contentType === 'article') {
      return `This ${wordCount}-word post ${hasHashtags ? 'includes hashtags for discoverability' : 'could benefit from hashtags'}. ${hasEmojis ? 'Uses emojis for engagement.' : 'Consider adding emojis to increase engagement.'} The content focuses on industry news and updates.`;
    }

    return `This success story post contains ${wordCount} words. ${hasHashtags ? 'Includes relevant hashtags.' : 'Consider adding hashtags.'} ${hasEmojis ? 'Uses emojis effectively.' : 'Emojis could enhance emotional connection.'} Strong customer-focused messaging.`;
  };

  useEffect(() => {
    generateSummary();
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
            onClick={generateSummary}
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
          <span className="text-sm">Generating AI insights...</span>
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
