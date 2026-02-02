import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
  Send,
  Loader2,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  Target,
  RefreshCw,
  Maximize2,
  Minimize2,
  Copy,
  Check,
  Brain,
  Zap,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import type { ContentData } from '../types/content';
import type { AIMessage } from '../types/ai';

interface AIAgentProps {
  data: ContentData;
}

const POLLINATIONS_URL = 'https://text.pollinations.ai';

// System prompt for the AI
const getSystemPrompt = (data: ContentData) => `You are an advanced AI business analyst and decision-making assistant for Defy Insurance, a cutting-edge insurance company. You have access to real-time content management data and must provide strategic insights, predictions, and recommendations.

CURRENT DATA SNAPSHOT:
- Total Articles: ${data.stats.totalArticles}
- Published Articles: ${data.stats.publishedPosts}
- Scheduled Articles: ${data.stats.scheduledPosts}
- Total Success Stories: ${data.stats.totalSuccessStories}
- Completed Stories: ${data.stats.completedStories}
- Pending Stories: ${data.stats.pendingStories}
- Last Updated: ${data.lastUpdated.toISOString()}

RECENT ARTICLES:
${data.articles.slice(0, 10).map(a => `- "${a.title}" (${a.status}) - Published: ${a.publishDate || 'Not set'}`).join('\n')}

POSTING SCHEDULE:
${data.schedule.map(s => `- ${s.agentName}: Sun=${s.sunday}, Mon=${s.monday}, Tue=${s.tuesday}, Wed=${s.wednesday}, Thu=${s.thursday}, Fri=${s.friday}, Sat=${s.saturday}`).join('\n')}

SUCCESS STORIES STATUS:
${data.successStories.slice(0, 5).map(s => `- Date: ${s.date}, Status: ${s.status}, Completed: ${s.completedOn || 'Pending'}`).join('\n')}

YOUR CAPABILITIES:
1. Analyze content performance and trends
2. Predict future outcomes based on current data patterns
3. Identify risks and opportunities
4. Recommend optimal posting strategies
5. Suggest content improvements
6. Provide competitive insights for the insurance industry
7. Help with decision-making for content scheduling
8. Calculate ROI and engagement predictions

RESPONSE STYLE:
- Be direct and actionable
- Use data to support your recommendations
- Provide specific numbers and percentages when possible
- Structure responses with clear sections
- Include emojis sparingly for emphasis
- Always end with a clear "Next Steps" or "Action Items" section

You are the most advanced AI assistant, capable of deep analysis and strategic thinking. Help the user make the best decisions for their content strategy.`;

const AIAgent: React.FC<AIAgentProps> = ({ data }) => {
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Quick action prompts
  const quickActions = [
    { icon: <TrendingUp size={16} />, label: 'Performance Analysis', prompt: 'Analyze my current content performance and give me a detailed report with metrics, trends, and comparisons.' },
    { icon: <Target size={16} />, label: 'Optimal Strategy', prompt: 'What is the optimal content posting strategy based on my current data? Include best times, frequency, and content mix.' },
    { icon: <AlertTriangle size={16} />, label: 'Risk Assessment', prompt: 'Identify potential risks and challenges in my current content strategy. What should I watch out for?' },
    { icon: <Lightbulb size={16} />, label: 'Content Ideas', prompt: 'Generate 10 creative content ideas for insurance industry posts that would perform well on LinkedIn and Twitter.' },
    { icon: <Sparkles size={16} />, label: 'AI Predictions', prompt: 'Based on current trends, predict my content performance for the next 30 days. Include engagement estimates.' },
    { icon: <Brain size={16} />, label: 'Decision Helper', prompt: 'I need to decide on my content focus for next week. Help me make the best decision based on the data.' },
  ];

  const sendMessage = async (messageText: string) => {
    if (!messageText.trim() || isLoading) return;

    const userMessage: AIMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: messageText,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setShowQuickActions(false);

    try {
      // Build conversation history for context
      const conversationHistory = messages.map(m => ({
        role: m.role,
        content: m.content
      }));

      // Add system prompt and user message
      const fullPrompt = `${getSystemPrompt(data)}\n\nConversation History:\n${conversationHistory.map(m => `${m.role}: ${m.content}`).join('\n')}\n\nUser: ${messageText}\n\nAssistant:`;

      // Call Pollinations API
      const response = await fetch(`${POLLINATIONS_URL}/${encodeURIComponent(fullPrompt)}?model=openai-large&json=false`, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      const aiResponse = await response.text();

      const assistantMessage: AIMessage = {
        id: `msg-${Date.now()}-ai`,
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('AI Error:', error);
      const errorMessage: AIMessage = {
        id: `msg-${Date.now()}-error`,
        role: 'assistant',
        content: 'I apologize, but I encountered an error processing your request. Please try again.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const clearChat = () => {
    setMessages([]);
    setShowQuickActions(true);
  };

  return (
    <div className={`bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden transition-all duration-300 ${isExpanded ? 'fixed inset-4 z-50' : ''}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-[#1b1e4c] to-[#2a2e5c] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#13BCC5] to-[#0FA8B0] flex items-center justify-center">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-white font-bold flex items-center gap-2">
              Defy AI Assistant
              <span className="px-2 py-0.5 bg-[#13BCC5]/20 text-[#13BCC5] text-xs rounded-full font-medium">
                Powered by GPT-4
              </span>
            </h3>
            <p className="text-white/60 text-sm">Strategic insights & decision support</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={clearChat}
            className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            title="Clear chat"
          >
            <RefreshCw size={18} />
          </button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            title={isExpanded ? 'Minimize' : 'Expand'}
          >
            {isExpanded ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      {showQuickActions && messages.length === 0 && (
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-5 h-5 text-[#13BCC5]" />
            <span className="font-semibold text-[#1b1e4c]">Quick Actions</span>
            <button
              onClick={() => setShowQuickActions(false)}
              className="ml-auto text-slate-400 hover:text-slate-600"
            >
              <ChevronUp size={18} />
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {quickActions.map((action, index) => (
              <button
                key={index}
                onClick={() => sendMessage(action.prompt)}
                className="flex items-center gap-2 p-3 bg-slate-50 hover:bg-[#13BCC5]/10 border border-slate-200 hover:border-[#13BCC5]/30 rounded-xl text-sm font-medium text-slate-700 hover:text-[#1b1e4c] transition-all text-left"
              >
                <span className="text-[#13BCC5]">{action.icon}</span>
                {action.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Collapsed Quick Actions Toggle */}
      {!showQuickActions && messages.length > 0 && (
        <button
          onClick={() => setShowQuickActions(true)}
          className="w-full p-2 bg-slate-50 border-b border-slate-100 flex items-center justify-center gap-2 text-sm text-slate-500 hover:text-slate-700 transition-colors"
        >
          <Zap size={14} />
          Show Quick Actions
          <ChevronDown size={14} />
        </button>
      )}

      {/* Messages */}
      <div className={`overflow-y-auto p-6 space-y-4 ${isExpanded ? 'h-[calc(100vh-280px)]' : 'h-[400px]'}`}>
        {messages.length === 0 && !showQuickActions && (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-[#13BCC5]/20 to-[#0FA8B0]/20 flex items-center justify-center">
                <Bot className="w-8 h-8 text-[#13BCC5]" />
              </div>
              <h4 className="font-semibold text-[#1b1e4c] mb-2">How can I help you today?</h4>
              <p className="text-sm text-slate-500">Ask me anything about your content strategy</p>
            </div>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                message.role === 'user'
                  ? 'bg-gradient-to-r from-[#13BCC5] to-[#0FA8B0] text-white'
                  : 'bg-slate-100 text-slate-700'
              }`}
            >
              {message.role === 'assistant' && (
                <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-200">
                  <Bot className="w-4 h-4 text-[#13BCC5]" />
                  <span className="text-xs font-medium text-[#13BCC5]">Defy AI</span>
                  <button
                    onClick={() => copyToClipboard(message.content, message.id)}
                    className="ml-auto text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {copied === message.id ? <Check size={14} /> : <Copy size={14} />}
                  </button>
                </div>
              )}
              <div className={`text-sm whitespace-pre-wrap ${message.role === 'assistant' ? 'prose prose-sm max-w-none' : ''}`}>
                {message.content}
              </div>
              <div className={`text-xs mt-2 ${message.role === 'user' ? 'text-white/60' : 'text-slate-400'}`}>
                {message.timestamp.toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-slate-100 rounded-2xl px-4 py-3">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 text-[#13BCC5] animate-spin" />
                <span className="text-sm text-slate-500">Analyzing data...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-slate-100 bg-slate-50">
        <div className="flex items-end gap-3">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask me anything about your content strategy..."
              className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 pr-12 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#13BCC5]/30 focus:border-[#13BCC5] transition-all min-h-[48px] max-h-[120px]"
              rows={1}
              disabled={isLoading}
            />
          </div>
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-r from-[#13BCC5] to-[#0FA8B0] text-white flex items-center justify-center hover:shadow-lg hover:shadow-[#13BCC5]/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </button>
        </div>
        <p className="text-xs text-slate-400 mt-2 text-center">
          Press Enter to send, Shift+Enter for new line
        </p>
      </form>
    </div>
  );
};

export default AIAgent;
