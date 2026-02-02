// Shared utilities for metrics calculations and data processing

/**
 * Parse a string value to a number, removing percentage signs and commas
 */
export const parseNum = (val: string | undefined): number => {
  if (!val) return 0;
  const cleaned = val.replace(/[%,]/g, '').trim();
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
};

/**
 * Format a number for display (K, M suffixes)
 */
export const formatNumber = (num: number): string => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toFixed(0);
};

/**
 * Format a percentage value
 */
export const formatPercent = (num: number, decimals: number = 1): string => {
  return num.toFixed(decimals) + '%';
};

/**
 * Calculate percentage safely (handles division by zero)
 */
export const safePercent = (numerator: number, denominator: number): number => {
  if (denominator === 0) return 0;
  return (numerator / denominator) * 100;
};

/**
 * Linear regression for trend analysis
 */
export const linearRegression = (data: number[]): { slope: number; intercept: number; r2: number } => {
  const n = data.length;
  if (n < 2) return { slope: 0, intercept: data[0] || 0, r2: 0 };

  const xMean = (n - 1) / 2;
  const yMean = data.reduce((a, b) => a + b, 0) / n;

  let ssXY = 0, ssXX = 0, ssYY = 0;
  for (let i = 0; i < n; i++) {
    ssXY += (i - xMean) * (data[i] - yMean);
    ssXX += (i - xMean) ** 2;
    ssYY += (data[i] - yMean) ** 2;
  }

  const slope = ssXX !== 0 ? ssXY / ssXX : 0;
  const intercept = yMean - slope * xMean;
  const r2 = ssYY !== 0 ? (ssXY ** 2) / (ssXX * ssYY) : 0;

  return { slope, intercept, r2 };
};

/**
 * Predict future values using linear regression
 */
export const predictFuture = (data: number[], periods: number): number[] => {
  const { slope, intercept } = linearRegression(data);
  const predictions: number[] = [];
  for (let i = 0; i < periods; i++) {
    const predicted = slope * (data.length + i) + intercept;
    predictions.push(Math.max(0, predicted));
  }
  return predictions;
};

/**
 * Calculate confidence interval
 */
export const calculateConfidenceInterval = (data: number[], confidence: number = 0.95): { lower: number; upper: number; mean: number } => {
  const n = data.length;
  if (n === 0) return { lower: 0, upper: 0, mean: 0 };

  const mean = data.reduce((a, b) => a + b, 0) / n;
  const stdDev = Math.sqrt(data.reduce((sq, val) => sq + (val - mean) ** 2, 0) / n);
  const z = confidence === 0.95 ? 1.96 : confidence === 0.99 ? 2.576 : 1.645;
  const margin = z * (stdDev / Math.sqrt(n));

  return { lower: mean - margin, upper: mean + margin, mean };
};

/**
 * Calculate trend direction from data
 */
export const calculateTrend = (data: number[]): 'up' | 'down' | 'stable' => {
  const { slope, r2 } = linearRegression(data);
  const threshold = 0.5;

  if (Math.abs(slope) < threshold || r2 < 0.3) return 'stable';
  return slope > 0 ? 'up' : 'down';
};

/**
 * Industry benchmarks for LinkedIn outreach (2024-2025)
 */
export const INDUSTRY_BENCHMARKS = {
  linkedin: {
    acceptanceRate: {
      poor: 15,
      average: 29.61,
      good: 40,
      excellent: 50,
      elite: 60
    },
    replyRate: {
      poor: 3,
      average: 7.22,
      good: 15,
      excellent: 25,
      elite: 35
    },
    personalization: {
      noMessage: 5.44,
      withMessage: 9.36,
      multiTouch: 11.87
    }
  },
  insurance: {
    quoteToBindRate: { poor: 10, average: 25, good: 35, excellent: 45 },
    contactRate: { poor: 20, average: 40, good: 55, excellent: 70 },
    customerRetention: { poor: 70, average: 80, good: 88, excellent: 95 }
  }
};

/**
 * Performance tier thresholds
 */
export const PERFORMANCE_TIERS = {
  elite: { min: 50, label: 'Elite', color: '#8B5CF6' },
  excellent: { min: 40, label: 'Excellent', color: '#10B981' },
  good: { min: 29.61, label: 'Above Benchmark', color: '#13BCC5' },
  average: { min: 20, label: 'Average', color: '#F59E0B' },
  needsWork: { min: 0, label: 'Needs Improvement', color: '#EF4444' }
};

/**
 * Get performance tier based on acceptance rate
 */
export const getPerformanceTier = (acceptanceRate: number): { min: number; label: string; color: string; key: string } => {
  if (acceptanceRate >= PERFORMANCE_TIERS.elite.min) return { ...PERFORMANCE_TIERS.elite, key: 'elite' };
  if (acceptanceRate >= PERFORMANCE_TIERS.excellent.min) return { ...PERFORMANCE_TIERS.excellent, key: 'excellent' };
  if (acceptanceRate >= PERFORMANCE_TIERS.good.min) return { ...PERFORMANCE_TIERS.good, key: 'good' };
  if (acceptanceRate >= PERFORMANCE_TIERS.average.min) return { ...PERFORMANCE_TIERS.average, key: 'average' };
  return { ...PERFORMANCE_TIERS.needsWork, key: 'needsWork' };
};

/**
 * Chart colors for consistent styling
 */
export const CHART_COLORS = ['#13BCC5', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#3B82F6', '#EC4899', '#6366F1'];

/**
 * Export metrics data to CSV
 */
export const exportToCSV = (data: Record<string, unknown>[], filename: string): void => {
  if (data.length === 0) return;

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row =>
      headers.map(header => {
        const value = row[header];
        const stringValue = String(value ?? '');
        // Escape quotes and wrap in quotes if contains comma
        if (stringValue.includes(',') || stringValue.includes('"')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      }).join(',')
    )
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
};

/**
 * Format date for display
 */
export const formatDate = (dateString: string, format: 'short' | 'long' | 'month' = 'short'): string => {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;

    switch (format) {
      case 'short':
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      case 'long':
        return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
      case 'month':
        return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      default:
        return dateString;
    }
  } catch {
    return dateString;
  }
};

/**
 * Validate metric data structure
 */
export const validateMetric = (metric: Record<string, unknown>): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!metric.id) errors.push('Missing id');
  if (metric.rowIndex === undefined) errors.push('Missing rowIndex');

  // Validate numeric fields
  const numericFields = ['totalInvited', 'totalAccepted', 'totalMessaged', 'replies'];
  numericFields.forEach(field => {
    const value = metric[field];
    if (value !== undefined && value !== '') {
      const num = parseNum(value as string);
      if (num < 0) errors.push(`${field} cannot be negative`);
    }
  });

  return { valid: errors.length === 0, errors };
};

/**
 * Calculate agent performance score (0-100)
 */
export const calculateAgentScore = (
  acceptanceRate: number,
  replyRate: number,
  volume: number,
  consistency: number
): number => {
  // Weights: Acceptance 35%, Reply 30%, Volume 20%, Consistency 15%
  const acceptanceScore = Math.min(100, (acceptanceRate / 50) * 100) * 0.35;
  const replyScore = Math.min(100, (replyRate / 30) * 100) * 0.30;
  const volumeScore = Math.min(100, (volume / 1000) * 100) * 0.20;
  const consistencyScore = Math.min(100, (consistency / 12) * 100) * 0.15;

  return Math.round(acceptanceScore + replyScore + volumeScore + consistencyScore);
};
