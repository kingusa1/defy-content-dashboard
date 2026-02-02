import express from 'express';
import cors from 'cors';
import { google } from 'googleapis';
import path from 'path';
import { fileURLToPath } from 'url';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Enable CORS for frontend
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://localhost:5176', 'http://127.0.0.1:5173'],
  methods: ['GET', 'POST'],
}));

// Parse JSON request bodies
app.use(express.json());

// Google Sheets configuration
const SPREADSHEET_ID = '1TFtKMMAhevtYMTZb1dmx1Xmd9UjJnMyx4abZx9YIUwE';

// Sheet names (tabs) - actual Google Sheet tab names
const SHEETS = {
  NEWS: 'insurance_news_log',
  SCHEDULE: 'Post Scheduling',
  SUCCESS: 'customer success post defy insurance'
};

// Initialize Google Sheets API with service account
let sheets;

async function initializeGoogleSheets() {
  try {
    const credentialsPath = path.join(__dirname, 'credentials.json');
    const credentials = JSON.parse(readFileSync(credentialsPath, 'utf-8'));

    const auth = new google.auth.GoogleAuth({
      credentials: credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    const authClient = await auth.getClient();
    sheets = google.sheets({ version: 'v4', auth: authClient });
    console.log('Google Sheets API initialized successfully');
  } catch (error) {
    console.error('Failed to initialize Google Sheets API:', error.message);
    console.log('\nMake sure:');
    console.log('1. server/credentials.json contains your Google service account credentials');
    console.log('2. The Google Sheet is shared with: defy-dashboard@defy-insurance-486209.iam.gserviceaccount.com');
  }
}

// Helper function to convert row data to object
function rowsToObjects(headers, rows) {
  return rows.map((row, index) => {
    const obj = { id: `row-${index}` };
    headers.forEach((header, i) => {
      obj[header.toLowerCase().replace(/\s+/g, '_')] = row[i] || '';
    });
    return obj;
  });
}

// Get all news articles
app.get('/api/articles', async (req, res) => {
  try {
    if (!sheets) {
      return res.status(503).json({ error: 'Google Sheets not initialized' });
    }

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `'${SHEETS.NEWS}'!A:F`,
    });

    const rows = response.data.values || [];
    if (rows.length === 0) {
      return res.json([]);
    }

    const headers = rows[0];
    const data = rowsToObjects(headers, rows.slice(1));

    // Transform to match frontend expected format
    const articles = data.map((row, index) => ({
      id: `article-${index}`,
      date: row.date || '',
      title: row.title || '',
      articleLink: row.artical_link || row.article_link || '',
      linkedinPost: row.linkedin_post || '',
      twitterPost: row.twitter_post || '',
      publishDate: row.publish_date || '',
      status: determineStatus(row.publish_date)
    }));

    res.json(articles);
  } catch (error) {
    console.error('Error fetching articles:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get posting schedule
app.get('/api/schedule', async (req, res) => {
  try {
    if (!sheets) {
      return res.status(503).json({ error: 'Google Sheets not initialized' });
    }

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `'${SHEETS.SCHEDULE}'!A:H`,
    });

    const rows = response.data.values || [];
    if (rows.length === 0) {
      return res.json([]);
    }

    const data = rows.slice(1).map((row, index) => ({
      id: `schedule-${index}`,
      agentName: row[0] || '',
      sunday: row[1] || '',
      monday: row[2] || '',
      tuesday: row[3] || '',
      wednesday: row[4] || '',
      thursday: row[5] || '',
      friday: row[6] || '',
      saturday: row[7] || ''
    }));

    res.json(data);
  } catch (error) {
    console.error('Error fetching schedule:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get success stories
app.get('/api/stories', async (req, res) => {
  try {
    if (!sheets) {
      return res.status(503).json({ error: 'Google Sheets not initialized' });
    }

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `'${SHEETS.SUCCESS}'!A:D`,
    });

    const rows = response.data.values || [];
    if (rows.length === 0) {
      return res.json([]);
    }

    const data = rows.slice(1).map((row, index) => ({
      id: `story-${index}`,
      date: row[0] || '',
      twitterCaption: row[1] || '',
      linkedinCaption: row[2] || '',
      completedOn: row[3] || null,
      status: row[3] ? 'completed' : 'pending'
    }));

    res.json(data);
  } catch (error) {
    console.error('Error fetching stories:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all data at once (for faster loading)
app.get('/api/all', async (req, res) => {
  try {
    if (!sheets) {
      return res.status(503).json({ error: 'Google Sheets not initialized. Check server credentials.' });
    }

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

    res.json({
      articles,
      schedule,
      stories,
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching all data:', error);
    res.status(500).json({ error: error.message });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    sheetsInitialized: !!sheets,
    timestamp: new Date().toISOString()
  });
});

// Alias for Vercel API route compatibility
app.get('/api/sheets', async (req, res) => {
  try {
    if (!sheets) {
      return res.status(503).json({ error: 'Google Sheets not initialized. Check server credentials.' });
    }

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

    res.json({
      articles,
      schedule,
      stories,
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching all data:', error);
    res.status(500).json({ error: error.message });
  }
});

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

// AI Chat endpoint - connects to chickytutor model
app.post('/api/ai/chat', async (req, res) => {
  try {
    const { messages, temperature = 0.7, max_tokens = 2000 } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

    if (!OPENAI_API_KEY) {
      // Fallback to Pollinations if no OpenAI key
      const pollinationsResponse = await fetch('https://text.pollinations.ai/openai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'openai',
          messages: messages,
          temperature: temperature,
          max_tokens: max_tokens,
        }),
      });

      if (pollinationsResponse.ok) {
        const data = await pollinationsResponse.json();
        return res.status(200).json(data);
      }
      return res.status(500).json({ error: 'AI service unavailable' });
    }

    // Call OpenAI API with chickytutor model
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'chickytutor',
        messages: messages,
        temperature: temperature,
        max_tokens: max_tokens,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      // Fallback to gpt-4o-mini if chickytutor fails
      if (errorData.error?.code === 'model_not_found') {
        const fallbackResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: messages,
            temperature: temperature,
            max_tokens: max_tokens,
          }),
        });

        if (fallbackResponse.ok) {
          const data = await fallbackResponse.json();
          return res.status(200).json(data);
        }
      }
      return res.status(response.status).json({ error: errorData.error?.message || 'AI request failed' });
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    console.error('AI Chat error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Authentication endpoint
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Try to get users from Google Sheet (optional - create a "Users" sheet)
    if (sheets) {
      try {
        const response = await sheets.spreadsheets.values.get({
          spreadsheetId: SPREADSHEET_ID,
          range: "'Users'!A:E",
        });

        const rows = response.data.values || [];
        if (rows.length > 1) {
          const users = rows.slice(1).map((row, index) => ({
            id: `user-${index}`,
            email: row[0] || '',
            password: row[1] || '',
            name: row[2] || '',
            role: row[3] || 'viewer',
            active: row[4]?.toLowerCase() === 'true' || row[4] === '1'
          }));

          const user = users.find(u =>
            u.email.toLowerCase() === email.toLowerCase() &&
            u.password === password &&
            u.active
          );

          if (user) {
            const { password: _pass, ...safeUser } = user;
            return res.status(200).json({ user: safeUser });
          }
        }
      } catch (sheetError) {
        console.log('Users sheet not found, using demo accounts');
      }
    }

    // Demo account fallback
    if (email.toLowerCase() === 'demo@defyinsurance.com' && password === 'demo123') {
      return res.status(200).json({
        user: {
          id: 'demo-user',
          email: 'demo@defyinsurance.com',
          name: 'Demo User',
          role: 'admin',
          active: true
        }
      });
    }

    // Admin account
    if (email.toLowerCase() === 'admin@defyinsurance.com' && password === 'admin123') {
      return res.status(200).json({
        user: {
          id: 'admin-user',
          email: 'admin@defyinsurance.com',
          name: 'Administrator',
          role: 'admin',
          active: true
        }
      });
    }

    return res.status(401).json({ error: 'Invalid email or password' });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Login failed. Please try again.' });
  }
});

// Initialize and start server
initializeGoogleSheets().then(() => {
  app.listen(PORT, () => {
    console.log(`\nServer running on http://localhost:${PORT}`);
    console.log(`\nAPI endpoints:`);
    console.log(`  GET /api/all      - Get all data`);
    console.log(`  GET /api/articles - Get news articles`);
    console.log(`  GET /api/schedule - Get posting schedule`);
    console.log(`  GET /api/stories  - Get success stories`);
    console.log(`  GET /api/health   - Health check`);
  });
});
