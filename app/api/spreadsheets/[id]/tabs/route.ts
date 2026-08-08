import { NextResponse } from 'next/server';
import { getSheetsClient } from '@/lib/google';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    const sheets = getSheetsClient();
    const res = await sheets.spreadsheets.get({
      spreadsheetId: id,
      fields: 'sheets.properties(title,gridProperties.rowCount)',
    });

    const tabs = (res.data.sheets ?? []).map((s) => ({
      title: s.properties?.title ?? '',
      rowCount: s.properties?.gridProperties?.rowCount ?? 0,
    }));

    return NextResponse.json({ tabs });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to load sheet tabs.' },
      { status: 500 },
    );
  }
}
