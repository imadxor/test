import { NextResponse } from 'next/server';
import { countRecipients, NoTelephoneColumnError } from '@/lib/recipients';

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const spreadsheetId = body?.spreadsheetId;
  const sheetName = body?.sheetName;

  if (typeof spreadsheetId !== 'string' || typeof sheetName !== 'string' || !spreadsheetId || !sheetName) {
    return NextResponse.json({ error: 'spreadsheetId and sheetName are required.' }, { status: 400 });
  }

  try {
    const counts = await countRecipients(spreadsheetId, sheetName);
    return NextResponse.json(counts);
  } catch (err) {
    if (err instanceof NoTelephoneColumnError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to preview recipients.' },
      { status: 500 },
    );
  }
}
