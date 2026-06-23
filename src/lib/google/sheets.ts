import { google } from 'googleapis'

export type CellValue = string | number | boolean | null

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly']

function getAuth() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
  const key = process.env.GOOGLE_PRIVATE_KEY
  if (!email || !key) {
    throw new Error(
      'Missing GOOGLE_SERVICE_ACCOUNT_EMAIL or GOOGLE_PRIVATE_KEY env vars.',
    )
  }
  return new google.auth.JWT({
    email,
    // Env-stored keys keep literal "\n"; convert back to real newlines.
    key: key.replace(/\\n/g, '\n'),
    scopes: SCOPES,
  })
}

// Read an A1 range and return the raw 2-D array of cell values.
// Row 0 is expected to be the header row.
export async function readRange(
  spreadsheetId: string,
  range: string,
): Promise<CellValue[][]> {
  const sheets = google.sheets({ version: 'v4', auth: getAuth() })
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range,
    // Numbers come back as numbers; dates as readable strings.
    valueRenderOption: 'UNFORMATTED_VALUE',
    dateTimeRenderOption: 'FORMATTED_STRING',
  })
  return (res.data.values as CellValue[][]) ?? []
}
