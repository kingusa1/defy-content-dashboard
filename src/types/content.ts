export interface NewsArticle {
  id: string;
  date: string;
  title: string;
  articleLink: string;
  linkedinPost: string;
  twitterPost: string;
  publishDate: string;
  status: 'scheduled' | 'published' | 'draft';
}

export interface ScheduleEntry {
  agentName: string;
  sunday: string;
  monday: string;
  tuesday: string;
  wednesday: string;
  thursday: string;
  friday: string;
  saturday: string;
}

export interface SuccessStory {
  id: string;
  date: string;
  twitterCaption: string;
  linkedinCaption: string;
  completedOn: string | null;
  status: 'pending' | 'completed';
}

export interface ContentStats {
  totalArticles: number;
  scheduledPosts: number;
  publishedPosts: number;
  totalSuccessStories: number;
  completedStories: number;
  pendingStories: number;
}

export interface ContentData {
  articles: NewsArticle[];
  schedule: ScheduleEntry[];
  successStories: SuccessStory[];
  stats: ContentStats;
  lastUpdated: Date;
}
