// Update week metrics endpoint for Vercel
import { google } from 'googleapis';

const SPREADSHEET_ID = '1TFtKMMAhevtYMTZb1dmx1Xmd9UjJnMyx4abZx9YIUwE';
const SHEET_NAME = 'Defy insurnace week metrics';

const METRICS_COLUMNS = [
  'status', 'campaign', 'message', 'audience', 'agent',
  'acceptanceRate', 'replies', 'replyPercent', 'defyLead', 'target',
  'algoType', 'weekEnd', 'location', 'queue', 'totalInvited',
  'totalAccepted', 'netNewConnects', 'startingConnects', 'endingConnections',
  'totalMessaged', 'totalActions'
];

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
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { rowIndex, changes, userRole } = req.body;

    if (!rowIndex || !changes) {
      return res.status(400).json({ error: 'rowIndex and changes are required' });
    }

    // Non-admin users can only update defyLead
    if (userRole !== 'admin') {
      const allowedFields = ['defyLead'];
      const attemptedFields = Object.keys(changes);
      const invalidFields = attemptedFields.filter(f => !allowedFields.includes(f));

      if (invalidFields.length > 0) {
        return res.status(403).json({
          error: `You don't have permission to edit: ${invalidFields.join(', ')}. Only Defy Lead can be edited.`
        });
      }
    }

    const sheets = await getSheets();

    // Get current row data
    const currentData = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `'${SHEET_NAME}'!A${rowIndex}:U${rowIndex}`,
    });

    const currentRow = currentData.data.values?.[0] || new Array(21).fill('');

    // Update changed columns
    for (const [key, value] of Object.entries(changes)) {
      const colIndex = METRICS_COLUMNS.indexOf(key);
      if (colIndex !== -1) {
        currentRow[colIndex] = value;
      }
    }

    // Write back
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `'${SHEET_NAME}'!A${rowIndex}:U${rowIndex}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [currentRow]
      }
    });

    res.json({ success: true, message: 'Metrics updated successfully' });
  } catch (error) {
    console.error('Error updating metrics:', error);
    res.status(500).json({ error: error.message });
  }
}
