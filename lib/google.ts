import 'server-only';
import { google } from 'googleapis';

const SCOPES = [
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/spreadsheets.readonly',
];

function getAuth() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const rawKey = process.env.GOOGLE_PRIVATE_KEY;

  if (!email || !rawKey) {
    throw new Error(
      'Missing GOOGLE_SERVICE_ACCOUNT_EMAIL or GOOGLE_PRIVATE_KEY environment variables.',
    );
  }

  return new google.auth.JWT({
    email,
    key: rawKey.replace(/\\n/g, '\n'),
    scopes: SCOPES,
  });
}

export function getDriveClient() {
  return google.drive({ version: 'v3', auth: getAuth() });
}

export function getSheetsClient() {
  return google.sheets({ version: 'v4', auth: getAuth() });
}
