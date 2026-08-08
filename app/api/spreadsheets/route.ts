import { NextResponse } from 'next/server';
import { getDriveClient } from '@/lib/google';

export async function GET() {
  try {
    const drive = getDriveClient();
    const res = await drive.files.list({
      q: "mimeType='application/vnd.google-apps.spreadsheet' and trashed=false",
      orderBy: 'modifiedTime desc',
      pageSize: 100,
      fields: 'files(id,name,modifiedTime)',
    });

    const files = res.data.files ?? [];

    if (files.length === 0) {
      const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL ?? '(service account email not configured)';
      return NextResponse.json({
        files: [],
        message: `No spreadsheets found. Share the target Google Sheet with the service account: ${email}`,
      });
    }

    return NextResponse.json({
      files: files.map((f) => ({ id: f.id, name: f.name, modifiedTime: f.modifiedTime })),
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to list spreadsheets.' },
      { status: 500 },
    );
  }
}
