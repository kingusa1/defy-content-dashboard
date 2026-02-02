// Get week metrics endpoint for Vercel
import { google } from 'googleapis';

const SPREADSHEET_ID = '1TFtKMMAhevtYMTZb1dmx1Xmd9UjJnMyx4abZx9YIUwE';
const SHEET_NAME = 'Defy insurnace week metrics';

async function getSheets() {
  const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS || '{}');

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  const authClient = await auth.getClient();
  return google.sheets({ version: 'v4', auth: authClient });
}

export default async function handler(req, res) {
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

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `'${SHEET_NAME}'!A:U`,
    });

    const rows = response.data.values || [];
    if (rows.length <= 1) {
      return res.json([]);
    }

    const data = rows.slice(1).map((row, index) => ({
      id: `metric-${index}`,
      rowIndex: index + 2,
      status: row[0] || '',
      campaign: row[1] || '',
      message: row[2] || '',
      audience: row[3] || '',
      agent: row[4] || '',
      acceptanceRate: row[5] || '',
      replies: row[6] || '',
      replyPercent: row[7] || '',
      defyLead: row[8] || '',
      target: row[9] || '',
      algoType: row[10] || '',
      weekEnd: row[11] || '',
      location: row[12] || '',
      queue: row[13] || '',
      totalInvited: row[14] || '',
      totalAccepted: row[15] || '',
      netNewConnects: row[16] || '',
      startingConnects: row[17] || '',
      endingConnections: row[18] || '',
      totalMessaged: row[19] || '',
      totalActions: row[20] || '',
    }));

    res.json(data);
  } catch (error) {
    console.error('Error fetching metrics:', error);
    res.status(500).json({ error: error.message });
  }
}
