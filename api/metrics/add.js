// Add new week metrics row endpoint for Vercel
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
    const { data, userRole } = req.body;

    if (!data) {
      return res.status(400).json({ error: 'data is required' });
    }

    // Non-admin users can only add defyLead
    if (userRole !== 'admin') {
      const allowedFields = ['defyLead'];
      const attemptedFields = Object.keys(data);
      const invalidFields = attemptedFields.filter(f => !allowedFields.includes(f));

      if (invalidFields.length > 0) {
        return res.status(403).json({
          error: `You don't have permission to add data for: ${invalidFields.join(', ')}. Only Defy Lead can be set.`
        });
      }
    }

    const sheets = await getSheets();

    // Build row array
    const newRow = METRICS_COLUMNS.map(col => data[col] || '');

    // Find the last row with ANY data in ANY column
    const existingData = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `'${SHEET_NAME}'!A:U`, // Check ALL columns
    });

    const rows = existingData.data.values || [];

    // Find the FIRST empty row after row 1 (header)
    // This ensures new data is added consecutively, not at the very end
    let firstEmptyRowIndex = 1; // Start checking from row 2 (index 1)

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      // Check if this row has ANY data in the first 5 key columns (status, campaign, message, audience, agent)
      const hasKeyData = row && row.slice(0, 5).some(cell => cell && cell.toString().trim() !== '');

      if (hasKeyData) {
        firstEmptyRowIndex = i + 1; // Move past this row
      } else {
        // Found an empty row - this is where we'll insert
        break;
      }
    }

    // Convert to 1-based sheet row number
    // Array index 1 = Sheet row 2, so add 1
    const emptyRowIndex = firstEmptyRowIndex + 1;

    // Write to the specific empty row using update() instead of append()
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `'${SHEET_NAME}'!A${emptyRowIndex}:U${emptyRowIndex}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [newRow]
      }
    });

    res.json({ success: true, message: `Row added successfully at row ${emptyRowIndex}` });
  } catch (error) {
    console.error('Error adding metrics:', error);
    res.status(500).json({ error: error.message });
  }
}
