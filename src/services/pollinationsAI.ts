/**
 * Bulletproof Pollinations AI Service
 *
 * Features:
 * - Multiple AI models with automatic fallback
 * - Multiple endpoints (GET & POST)
 * - Retry logic with exponential backoff
 * - Circuit breaker pattern
 * - Request timeout handling
 * - Response validation
 * - Health monitoring
 * - Rate limiting protection
 */

// ============================================================================
// CONFIGURATION
// ============================================================================

// All available Pollinations models in priority order
const AI_MODELS = [
  'openai',           // GPT-based, most reliable
  'openai-large',     // Larger GPT model
  'mistral',          // Mistral Small 3.2 24B
  'gemini',           // Gemini 2.5 Flash Lite
  'deepseek',         // DeepSeek model
  'qwen-coder',       // Qwen Coder model
  'llama',            // Llama model
  'claude-hybridspace', // Claude hybrid
  'openai-fast',      // Fast GPT variant
  'gemini-fast',      // Fast Gemini variant
] as const;

// Endpoint configurations
const ENDPOINTS = {
  GET: 'https://text.pollinations.ai/',
  POST: 'https://text.pollinations.ai/openai',
  MODELS: 'https://text.pollinations.ai/models',
} as const;

// Service configuration
const CONFIG = {
  maxRetries: 3,
  initialRetryDelay: 1000,
  maxRetryDelay: 10000,
  requestTimeout: 30000,
  circuitBreakerThreshold: 5,
  circuitBreakerResetTime: 60000,
  maxPromptLength: 4000,
};

// ============================================================================
// TYPES
// ============================================================================

export interface AIResponse {
  content: string;
  model: string;
  endpoint: 'GET' | 'POST';
  latency: number;
  retries: number;
  success: boolean;
  error?: string;
}

export interface AIRequestOptions {
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
  seed?: number;
  preferredModel?: string;
}

interface CircuitState {
  failures: number;
  lastFailure: number;
  isOpen: boolean;
}

interface ModelHealth {
  available: boolean;
  lastChecked: number;
  avgLatency: number;
  successRate: number;
  totalRequests: number;
  totalSuccesses: number;
}

// ============================================================================
// STATE MANAGEMENT
// ============================================================================

// Circuit breaker state for each model
const circuitBreakers: Map<string, CircuitState> = new Map();

// Model health tracking
const modelHealth: Map<string, ModelHealth> = new Map();

// Initialize health for all models
AI_MODELS.forEach(model => {
  modelHealth.set(model, {
    available: true,
    lastChecked: 0,
    avgLatency: 0,
    successRate: 100,
    totalRequests: 0,
    totalSuccesses: 0,
  });
  circuitBreakers.set(model, {
    failures: 0,
    lastFailure: 0,
    isOpen: false,
  });
});

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Sleep for specified milliseconds
 */
const sleep = (ms: number): Promise<void> =>
  new Promise(resolve => setTimeout(resolve, ms));

/**
 * Calculate exponential backoff delay
 */
const getBackoffDelay = (attempt: number): number => {
  const delay = CONFIG.initialRetryDelay * Math.pow(2, attempt);
  return Math.min(delay, CONFIG.maxRetryDelay);
};

/**
 * Check if circuit breaker should allow request
 */
const isCircuitOpen = (model: string): boolean => {
  const state = circuitBreakers.get(model);
  if (!state) return false;

  if (state.isOpen) {
    // Check if reset time has passed
    if (Date.now() - state.lastFailure > CONFIG.circuitBreakerResetTime) {
      state.isOpen = false;
      state.failures = 0;
      return false;
    }
    return true;
  }
  return false;
};

/**
 * Record failure for circuit breaker
 */
const recordFailure = (model: string): void => {
  const state = circuitBreakers.get(model);
  if (!state) return;

  state.failures++;
  state.lastFailure = Date.now();

  if (state.failures >= CONFIG.circuitBreakerThreshold) {
    state.isOpen = true;
    console.warn(`[AI Service] Circuit breaker OPEN for model: ${model}`);
  }
};

/**
 * Record success for circuit breaker
 */
const recordSuccess = (model: string): void => {
  const state = circuitBreakers.get(model);
  if (!state) return;

  state.failures = 0;
  state.isOpen = false;
};

/**
 * Update model health statistics
 */
const updateModelHealth = (model: string, success: boolean, latency: number): void => {
  const health = modelHealth.get(model);
  if (!health) return;

  health.totalRequests++;
  if (success) health.totalSuccesses++;
  health.successRate = (health.totalSuccesses / health.totalRequests) * 100;
  health.avgLatency = (health.avgLatency * (health.totalRequests - 1) + latency) / health.totalRequests;
  health.lastChecked = Date.now();
  health.available = success;
};

/**
 * Get sorted models by health (best first)
 */
const getSortedModelsByHealth = (): string[] => {
  return [...AI_MODELS].sort((a, b) => {
    const healthA = modelHealth.get(a);
    const healthB = modelHealth.get(b);
    if (!healthA || !healthB) return 0;

    // Prioritize by success rate, then by latency
    if (healthA.successRate !== healthB.successRate) {
      return healthB.successRate - healthA.successRate;
    }
    return healthA.avgLatency - healthB.avgLatency;
  });
};

/**
 * Truncate prompt if too long
 */
const truncatePrompt = (prompt: string): string => {
  if (prompt.length <= CONFIG.maxPromptLength) return prompt;
  return prompt.slice(0, CONFIG.maxPromptLength) + '...';
};

/**
 * Validate AI response
 */
const isValidResponse = (content: string): boolean => {
  if (!content || typeof content !== 'string') return false;
  if (content.trim().length === 0) return false;
  if (content.includes('Error:') && content.length < 100) return false;
  return true;
};

// ============================================================================
// API REQUEST FUNCTIONS
// ============================================================================

/**
 * Make GET request to Pollinations
 */
const makeGetRequest = async (
  prompt: string,
  model: string,
  options: AIRequestOptions
): Promise<string> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), CONFIG.requestTimeout);

  try {
    const params = new URLSearchParams({
      model,
      seed: String(options.seed || Date.now()),
    });

    if (options.temperature !== undefined) {
      params.append('temperature', String(options.temperature));
    }
    if (options.systemPrompt) {
      params.append('system', options.systemPrompt);
    }

    const encodedPrompt = encodeURIComponent(truncatePrompt(prompt));
    const url = `${ENDPOINTS.GET}${encodedPrompt}?${params.toString()}`;

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'Accept': 'text/plain',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.text();
  } finally {
    clearTimeout(timeoutId);
  }
};

/**
 * Make POST request to Pollinations (OpenAI-compatible)
 */
const makePostRequest = async (
  prompt: string,
  model: string,
  options: AIRequestOptions
): Promise<string> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), CONFIG.requestTimeout);

  try {
    const messages = [];

    if (options.systemPrompt) {
      messages.push({ role: 'system', content: options.systemPrompt });
    }

    messages.push({ role: 'user', content: truncatePrompt(prompt) });

    const response = await fetch(ENDPOINTS.POST, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens ?? 2000,
        seed: options.seed || Date.now(),
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    // Handle OpenAI-compatible response format
    if (data.choices && data.choices[0]?.message?.content) {
      return data.choices[0].message.content;
    }

    // Handle direct text response
    if (typeof data === 'string') {
      return data;
    }

    throw new Error('Invalid response format');
  } finally {
    clearTimeout(timeoutId);
  }
};

// ============================================================================
// MAIN AI SERVICE
// ============================================================================

/**
 * Send message to AI with bulletproof fallback system
 */
export const sendMessage = async (
  prompt: string,
  options: AIRequestOptions = {}
): Promise<AIResponse> => {
  const startTime = Date.now();
  let totalRetries = 0;
  let lastError = '';

  // Get models sorted by health, with preferred model first if specified
  let models = getSortedModelsByHealth();
  if (options.preferredModel && AI_MODELS.includes(options.preferredModel as typeof AI_MODELS[number])) {
    models = [options.preferredModel, ...models.filter(m => m !== options.preferredModel)];
  }

  // Try each model
  for (const model of models) {
    // Skip if circuit breaker is open
    if (isCircuitOpen(model)) {
      console.log(`[AI Service] Skipping ${model} - circuit breaker open`);
      continue;
    }

    // Try both endpoints for each model
    const endpoints: Array<{ type: 'GET' | 'POST'; fn: () => Promise<string> }> = [
      { type: 'POST', fn: () => makePostRequest(prompt, model, options) },
      { type: 'GET', fn: () => makeGetRequest(prompt, model, options) },
    ];

    for (const endpoint of endpoints) {
      // Retry logic for each endpoint
      for (let attempt = 0; attempt < CONFIG.maxRetries; attempt++) {
        try {
          const requestStart = Date.now();
          const content = await endpoint.fn();
          const latency = Date.now() - requestStart;

          // Validate response
          if (!isValidResponse(content)) {
            throw new Error('Invalid or empty response');
          }

          // Success! Update health and return
          recordSuccess(model);
          updateModelHealth(model, true, latency);

          console.log(`[AI Service] Success with ${model} via ${endpoint.type} (${latency}ms)`);

          return {
            content,
            model,
            endpoint: endpoint.type,
            latency: Date.now() - startTime,
            retries: totalRetries,
            success: true,
          };
        } catch (error) {
          totalRetries++;
          lastError = error instanceof Error ? error.message : 'Unknown error';

          console.warn(`[AI Service] ${model} ${endpoint.type} attempt ${attempt + 1} failed: ${lastError}`);

          // Wait before retry (exponential backoff)
          if (attempt < CONFIG.maxRetries - 1) {
            await sleep(getBackoffDelay(attempt));
          }
        }
      }
    }

    // All attempts failed for this model
    recordFailure(model);
    updateModelHealth(model, false, CONFIG.requestTimeout);
  }

  // All models failed - return error response
  console.error('[AI Service] All models failed');

  return {
    content: generateFallbackResponse(prompt),
    model: 'fallback',
    endpoint: 'GET',
    latency: Date.now() - startTime,
    retries: totalRetries,
    success: false,
    error: lastError,
  };
};

/**
 * Generate intelligent fallback response when all models fail
 */
const generateFallbackResponse = (prompt: string): string => {
  const lowerPrompt = prompt.toLowerCase();

  // Analyze prompt intent and provide contextual fallback
  if (lowerPrompt.includes('analysis') || lowerPrompt.includes('analyze')) {
    return `I'm currently experiencing connectivity issues with the AI service, but I can help you with analysis once the connection is restored.

**What you can do in the meantime:**
1. Review your data manually in the dashboard tabs
2. Export your data to Excel for offline analysis
3. Check the Analytics tab for pre-computed metrics

The service typically recovers within a few minutes. Please try again shortly.`;
  }

  if (lowerPrompt.includes('content') || lowerPrompt.includes('post') || lowerPrompt.includes('idea')) {
    return `I'm temporarily unable to generate content suggestions due to a connection issue.

**Alternative approaches:**
1. Browse your existing articles for inspiration
2. Check trending topics in your industry
3. Review your posting schedule for gaps

Please retry in a moment - the AI service usually recovers quickly.`;
  }

  if (lowerPrompt.includes('schedule') || lowerPrompt.includes('time') || lowerPrompt.includes('when')) {
    return `I'm having trouble connecting to the AI service right now.

**For scheduling insights:**
1. Check the Schedule tab for current posting times
2. Review the Analytics tab for engagement patterns
3. Most insurance content performs well on weekday mornings (9-11 AM)

Please try your question again in a few moments.`;
  }

  // Generic fallback
  return `I apologize, but I'm experiencing temporary connectivity issues with the AI service.

**This is what's happening:**
- All primary AI models are currently unavailable
- The system has tried multiple fallback options
- This is usually a temporary issue

**What you can do:**
1. Wait a moment and try again
2. Refresh the page if the issue persists
3. Check the dashboard tabs for immediate data access

The AI service typically recovers within 1-2 minutes. Thank you for your patience.`;
};

// ============================================================================
// UTILITY EXPORTS
// ============================================================================

/**
 * Get current health status of all models
 */
export const getModelHealthStatus = (): Record<string, ModelHealth> => {
  const status: Record<string, ModelHealth> = {};
  modelHealth.forEach((health, model) => {
    status[model] = { ...health };
  });
  return status;
};

/**
 * Get list of available models
 */
export const getAvailableModels = (): string[] => {
  return [...AI_MODELS];
};

/**
 * Reset health statistics (useful for testing)
 */
export const resetHealthStats = (): void => {
  AI_MODELS.forEach(model => {
    modelHealth.set(model, {
      available: true,
      lastChecked: 0,
      avgLatency: 0,
      successRate: 100,
      totalRequests: 0,
      totalSuccesses: 0,
    });
    circuitBreakers.set(model, {
      failures: 0,
      lastFailure: 0,
      isOpen: false,
    });
  });
};

/**
 * Check if service is healthy (at least one model available)
 */
export const isServiceHealthy = (): boolean => {
  for (const model of AI_MODELS) {
    if (!isCircuitOpen(model)) {
      return true;
    }
  }
  return false;
};

// ============================================================================
// STREAMING SUPPORT (Future enhancement)
// ============================================================================

/**
 * Stream message from AI (for real-time responses)
 * Note: Pollinations supports streaming via SSE
 */
export const streamMessage = async (
  prompt: string,
  onChunk: (chunk: string) => void,
  options: AIRequestOptions = {}
): Promise<AIResponse> => {
  // For now, use regular send and simulate streaming
  const response = await sendMessage(prompt, options);

  // Simulate streaming by revealing content gradually
  const words = response.content.split(' ');
  let accumulated = '';

  for (const word of words) {
    accumulated += (accumulated ? ' ' : '') + word;
    onChunk(accumulated);
    await sleep(20); // Small delay for visual effect
  }

  return response;
};

export default {
  sendMessage,
  streamMessage,
  getModelHealthStatus,
  getAvailableModels,
  resetHealthStats,
  isServiceHealthy,
};
