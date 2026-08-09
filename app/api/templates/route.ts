import { NextResponse } from 'next/server';
import { ACCOUNTS } from '@/lib/accounts';
import { listApprovedTemplates } from '@/lib/meta';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const accountId = searchParams.get('account');
  const account = ACCOUNTS.find((a) => a.id === accountId);

  if (!account) {
    return NextResponse.json({ error: `Unknown account "${accountId}".` }, { status: 400 });
  }
  const wabaId: string = account.wabaId;
  if (!wabaId || wabaId === 'TODO') {
    return NextResponse.json(
      { error: `No WhatsApp Business Account ID configured for "${account.label}".` },
      { status: 400 },
    );
  }

  try {
    const templates = await listApprovedTemplates(wabaId);
    return NextResponse.json({ templates });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to load WhatsApp templates.' },
      { status: 500 },
    );
  }
}
