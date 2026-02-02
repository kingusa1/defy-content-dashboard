import { google } from 'googleapis';

// Google Sheets configuration
const SPREADSHEET_ID = '1TFtKMMAhevtYMTZb1dmx1Xmd9UjJnMyx4abZx9YIUwE';

// Sheet names (tabs) - update these to match your actual Google Sheet tab names
const SHEETS = {
  NEWS: 'Insurance News',
  SCHEDULE: 'Schedule',
  SUCCESS: 'Success Stories'
};

// Helper function to determine article status
function determineStatus(publishDate) {
  if (!publishDate) return 'draft';
  try {
    const pubDate = new Date(publishDate);
    const now = new Date();
    return pubDate <= now ? 'published' : 'scheduled';
  } catch {
    return 'draft';
  }
}

// Initialize Google Sheets API
async function getSheets() {
  // Get credentials from environment variables
  const credentials = {
    type: 'service_account',
    project_id: process.env.GOOGLE_PROJECT_ID,
    private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    client_id: process.env.GOOGLE_CLIENT_ID,
    auth_uri: 'https://accounts.google.com/o/oauth2/auth',
    token_uri: 'https://oauth2.googleapis.com/token',
    auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
    client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${encodeURIComponent(process.env.GOOGLE_CLIENT_EMAIL || '')}`
  };

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });

  const authClient = await auth.getClient();
  return google.sheets({ version: 'v4', auth: authClient });
}

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const sheets = await getSheets();

    // Fetch all sheets in parallel for speed
    const [articlesRes, scheduleRes, storiesRes] = await Promise.all([
      sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `'${SHEETS.NEWS}'!A:F`,
      }),
      sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `'${SHEETS.SCHEDULE}'!A:H`,
      }),
      sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `'${SHEETS.SUCCESS}'!A:D`,
      })
    ]);

    // Process articles
    const articleRows = articlesRes.data.values || [];
    const articles = articleRows.length > 1
      ? articleRows.slice(1).map((row, index) => ({
          id: `article-${index}`,
          date: row[0] || '',
          title: row[1] || '',
          articleLink: row[2] || '',
          linkedinPost: row[3] || '',
          twitterPost: row[4] || '',
          publishDate: row[5] || '',
          status: determineStatus(row[5])
        }))
      : [];

    // Process schedule
    const scheduleRows = scheduleRes.data.values || [];
    const schedule = scheduleRows.length > 1
      ? scheduleRows.slice(1).map((row, index) => ({
          id: `schedule-${index}`,
          agentName: row[0] || '',
          sunday: row[1] || '',
          monday: row[2] || '',
          tuesday: row[3] || '',
          wednesday: row[4] || '',
          thursday: row[5] || '',
          friday: row[6] || '',
          saturday: row[7] || ''
        }))
      : [];

    // Process stories
    const storyRows = storiesRes.data.values || [];
    const stories = storyRows.length > 1
      ? storyRows.slice(1).map((row, index) => ({
          id: `story-${index}`,
          date: row[0] || '',
          twitterCaption: row[1] || '',
          linkedinCaption: row[2] || '',
          completedOn: row[3] || null,
          status: row[3] ? 'completed' : 'pending'
        }))
      : [];

    res.status(200).json({
      articles,
      schedule,
      stories,
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).json({ error: error.message });
  }
}
