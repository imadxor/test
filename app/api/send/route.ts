import { NextResponse } from 'next/server';
import { ACCOUNTS } from '@/lib/accounts';
import { countRecipients, NoTelephoneColumnError } from '@/lib/recipients';

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const account = body?.account;
  const spreadsheetId = body?.spreadsheetId;
  const sheetName = body?.sheetName;
  const templateName = body?.templateName;

  if (
    typeof account !== 'string' ||
    typeof spreadsheetId !== 'string' ||
    typeof sheetName !== 'string' ||
    typeof templateName !== 'string' ||
    !account ||
    !spreadsheetId ||
    !sheetName ||
    !templateName
  ) {
    return NextResponse.json(
      { ok: false, error: 'account, spreadsheetId, sheetName and templateName are required.' },
      { status: 400 },
    );
  }

  if (!ACCOUNTS.some((a) => a.id === account)) {
    return NextResponse.json({ ok: false, error: `Unknown account "${account}".` }, { status: 400 });
  }

  // Re-validate server-side. The client-reported recipient count is never trusted.
  let okCount: number;
  try {
    const counts = await countRecipients(spreadsheetId, sheetName);
    okCount = counts.ok;
  } catch (err) {
    if (err instanceof NoTelephoneColumnError) {
      return NextResponse.json({ ok: false, error: err.message }, { status: 400 });
    }
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : 'Failed to re-validate recipients.' },
      { status: 500 },
    );
  }

  if (okCount === 0) {
    return NextResponse.json({ ok: false, error: 'No valid recipients found — nothing to send.' }, { status: 400 });
  }

  const webhookUrl = process.env.N8N_WEBHOOK_URL;
  const webhookSecret = process.env.N8N_WEBHOOK_SECRET;

  if (!webhookUrl || !webhookSecret) {
    return NextResponse.json(
      { ok: false, error: 'N8N_WEBHOOK_URL or N8N_WEBHOOK_SECRET is not configured on the server.' },
      { status: 500 },
    );
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10_000);

  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: webhookSecret,
      },
      body: JSON.stringify({
        account,
        spreadsheetId,
        sheetName,
        templateName,
        requestedAt: new Date().toISOString(),
      }),
      signal: controller.signal,
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      return NextResponse.json(
        { ok: false, error: data?.error ?? `n8n webhook returned HTTP ${res.status}.` },
        { status: 502 },
      );
    }

    return NextResponse.json({ ok: true, runId: data?.runId ?? data?.id ?? null });
  } catch (err) {
    const message =
      err instanceof Error && err.name === 'AbortError'
        ? 'Request to the n8n webhook timed out after 10 seconds.'
        : err instanceof Error
          ? err.message
          : 'Failed to reach the n8n webhook.';
    return NextResponse.json({ ok: false, error: message }, { status: 502 });
  } finally {
    clearTimeout(timeoutId);
  }
}
