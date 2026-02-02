import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import type { NewsArticle, SuccessStory, ContentData, ContentStats } from '../types/content';

// API URL - uses relative path for Vercel, or localhost for development
const API_URL = import.meta.env.DEV ? 'http://localhost:3001/api' : '/api';

// Refresh interval - 5 seconds for fast real-time updates
const REFRESH_INTERVAL = 5000;

// Calculate stats from data
const calculateStats = (articles: NewsArticle[], stories: SuccessStory[]): ContentStats => {
  const now = new Date();
  const scheduledPosts = articles.filter(a => new Date(a.publishDate) > now).length;
  const publishedPosts = articles.filter(a => new Date(a.publishDate) <= now).length;
  const completedStories = stories.filter(s => s.status === 'completed').length;
  const pendingStories = stories.filter(s => s.status === 'pending').length;

  return {
    totalArticles: articles.length,
    scheduledPosts,
    publishedPosts,
    totalSuccessStories: stories.length,
    completedStories,
    pendingStories
  };
};

// Default data when API can't be reached
const DEFAULT_DATA: ContentData = {
  articles: [],
  schedule: [],
  successStories: [],
  stats: {
    totalArticles: 0,
    scheduledPosts: 0,
    publishedPosts: 0,
    totalSuccessStories: 0,
    completedStories: 0,
    pendingStories: 0
  },
  lastUpdated: new Date()
};

export const useContentData = () => {
  const [data, setData] = useState<ContentData>(DEFAULT_DATA);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const fetchAllData = useCallback(async () => {
    try {
      if (mountedRef.current) setError(null);

      // Fetch all data from API
      const response = await axios.get(`${API_URL}/sheets`, { timeout: 15000 });
      const { articles, schedule, stories } = response.data;

      // Calculate stats
      const stats = calculateStats(articles || [], stories || []);

      if (mountedRef.current) {
        setData({
          articles: articles || [],
          schedule: schedule || [],
          successStories: stories || [],
          stats,
          lastUpdated: new Date()
        });
        setLoading(false);
      }
    } catch (err: unknown) {
      console.error('Error fetching content data:', err);
      if (mountedRef.current) {
        // More specific error messages
        if (axios.isAxiosError(err)) {
          if (err.code === 'ECONNREFUSED' || err.code === 'ERR_NETWORK') {
            setError('Cannot connect to server. Please check your connection.');
          } else if (err.response?.status === 503) {
            setError('Google Sheets API not initialized. Check server credentials.');
          } else if (err.response?.status === 500) {
            setError(err.response?.data?.error || 'Server error. Please try again.');
          } else {
            setError(err.response?.data?.error || err.message || 'Failed to fetch data');
          }
        } else {
          setError('Failed to fetch data');
        }
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;

    // Initial fetch
    const timeoutId = setTimeout(() => {
      fetchAllData();
    }, 0);

    // Auto-refresh every 5 seconds for real-time updates
    const interval = setInterval(fetchAllData, REFRESH_INTERVAL);

    return () => {
      mountedRef.current = false;
      clearTimeout(timeoutId);
      clearInterval(interval);
    };
  }, [fetchAllData]);

  const refresh = useCallback(() => {
    setLoading(true);
    fetchAllData();
  }, [fetchAllData]);

  return { data, loading, error, refresh };
};
