export interface AIMessageMetadata {
  model?: string;
  latency?: number;
  retries?: number;
  endpoint?: 'GET' | 'POST';
}

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: AIMessageMetadata;
}

export interface AIAnalysis {
  insights: string[];
  recommendations: string[];
  predictions: string[];
  riskFactors: string[];
  opportunities: string[];
}

export interface AIConversation {
  messages: AIMessage[];
  isLoading: boolean;
  error: string | null;
}
