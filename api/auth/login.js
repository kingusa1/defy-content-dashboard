import { google } from 'googleapis';

// Google Sheets configuration
const SPREADSHEET_ID = '1TFtKMMAhevtYMTZb1dmx1Xmd9UjJnMyx4abZx9YIUwE';
const USERS_SHEET = 'Users';

// Initialize Google Sheets API
async function getSheets() {
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
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Try to get users from Google Sheet
    try {
      const sheets = await getSheets();
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `'${USERS_SHEET}'!A:E`,
      });

      const rows = response.data.values || [];

      if (rows.length > 1) {
        // Skip header row, find matching user
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
          // Remove password from response
          const { password: _pass, ...safeUser } = user;
          return res.status(200).json({ user: safeUser });
        }
      }
    } catch (sheetError) {
      console.log('Users sheet not found, using demo account:', sheetError.message);
    }

    // Fallback: Demo account
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
}
