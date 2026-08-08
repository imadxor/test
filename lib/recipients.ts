import 'server-only';
import { getSheetsClient } from '@/lib/google';
import { validateList } from '@/lib/phone';

export class NoTelephoneColumnError extends Error {}

export interface RecipientCounts {
  total: number;
  ok: number;
  invalid: number;
  duplicate: number;
}

export async function countRecipients(spreadsheetId: string, sheetName: string): Promise<RecipientCounts> {
  const sheets = getSheetsClient();
  const range = `'${sheetName.replace(/'/g, "''")}'!A:Z`;
  const res = await sheets.spreadsheets.values.get({ spreadsheetId, range });
  const rows = res.data.values ?? [];

  const headerRow = rows[0] ?? [];
  const colIndex = headerRow.findIndex(
    (h) => typeof h === 'string' && h.trim().toLowerCase() === 'telephone',
  );

  if (colIndex === -1) {
    throw new NoTelephoneColumnError(
      `No "Telephone" column found in the header row of "${sheetName}". Found columns: ${
        headerRow.filter(Boolean).join(', ') || '(none)'
      }`,
    );
  }

  const phoneValues = rows
    .slice(1)
    .map((row) => row[colIndex] ?? '')
    .filter((v) => String(v).trim() !== '')
    .map(String);

  const results = validateList(phoneValues);

  return {
    total: results.length,
    ok: results.filter((r) => r.status === 'ok').length,
    invalid: results.filter((r) => r.status === 'invalid').length,
    duplicate: results.filter((r) => r.status === 'duplicate').length,
  };
}
