export interface AIMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
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
