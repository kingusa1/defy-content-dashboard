import * as XLSX from 'xlsx';
import type { NewsArticle, SuccessStory, ScheduleEntry } from '../types/content';

// Export articles to Excel
export const exportArticlesToExcel = (articles: NewsArticle[]): void => {
  const data = articles.map(article => ({
    'Date': article.date,
    'Title': article.title,
    'Article Link': article.articleLink,
    'Publish Date': article.publishDate,
    'Status': article.status,
    'LinkedIn Post': article.linkedinPost,
    'Twitter Post': article.twitterPost,
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'News Articles');

  // Auto-size columns
  const maxWidths = Object.keys(data[0] || {}).map(key => ({
    wch: Math.max(key.length, ...data.map(row => String(row[key as keyof typeof row] || '').length))
  }));
  ws['!cols'] = maxWidths;

  XLSX.writeFile(wb, `defy-articles-${new Date().toISOString().split('T')[0]}.xlsx`);
};

// Export success stories to Excel
export const exportStoriesToExcel = (stories: SuccessStory[]): void => {
  const data = stories.map(story => ({
    'Date': story.date,
    'Status': story.status,
    'Completed On': story.completedOn || '',
    'Twitter Caption': story.twitterCaption,
    'LinkedIn Caption': story.linkedinCaption,
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Success Stories');

  XLSX.writeFile(wb, `defy-success-stories-${new Date().toISOString().split('T')[0]}.xlsx`);
};

// Export schedule to Excel
export const exportScheduleToExcel = (schedule: ScheduleEntry[]): void => {
  const data = schedule.map(entry => ({
    'Agent Name': entry.agentName,
    'Sunday': entry.sunday,
    'Monday': entry.monday,
    'Tuesday': entry.tuesday,
    'Wednesday': entry.wednesday,
    'Thursday': entry.thursday,
    'Friday': entry.friday,
    'Saturday': entry.saturday,
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Posting Schedule');

  XLSX.writeFile(wb, `defy-schedule-${new Date().toISOString().split('T')[0]}.xlsx`);
};

// Export all data to a single Excel file with multiple sheets
export const exportAllToExcel = (
  articles: NewsArticle[],
  stories: SuccessStory[],
  schedule: ScheduleEntry[]
): void => {
  const wb = XLSX.utils.book_new();

  // Articles sheet
  const articlesData = articles.map(article => ({
    'Date': article.date,
    'Title': article.title,
    'Article Link': article.articleLink,
    'Publish Date': article.publishDate,
    'Status': article.status,
    'LinkedIn Post': article.linkedinPost,
    'Twitter Post': article.twitterPost,
  }));
  const articlesWs = XLSX.utils.json_to_sheet(articlesData);
  XLSX.utils.book_append_sheet(wb, articlesWs, 'News Articles');

  // Stories sheet
  const storiesData = stories.map(story => ({
    'Date': story.date,
    'Status': story.status,
    'Completed On': story.completedOn || '',
    'Twitter Caption': story.twitterCaption,
    'LinkedIn Caption': story.linkedinCaption,
  }));
  const storiesWs = XLSX.utils.json_to_sheet(storiesData);
  XLSX.utils.book_append_sheet(wb, storiesWs, 'Success Stories');

  // Schedule sheet
  const scheduleData = schedule.map(entry => ({
    'Agent Name': entry.agentName,
    'Sunday': entry.sunday,
    'Monday': entry.monday,
    'Tuesday': entry.tuesday,
    'Wednesday': entry.wednesday,
    'Thursday': entry.thursday,
    'Friday': entry.friday,
    'Saturday': entry.saturday,
  }));
  const scheduleWs = XLSX.utils.json_to_sheet(scheduleData);
  XLSX.utils.book_append_sheet(wb, scheduleWs, 'Posting Schedule');

  XLSX.writeFile(wb, `defy-content-export-${new Date().toISOString().split('T')[0]}.xlsx`);
};

// Export to CSV
export const exportToCSV = (data: Record<string, unknown>[], filename: string): void => {
  const ws = XLSX.utils.json_to_sheet(data);
  const csv = XLSX.utils.sheet_to_csv(ws);

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}-${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
};
