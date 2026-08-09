import 'server-only';

export interface WhatsAppTemplate {
  name: string;
  language: string;
  status: string;
}

export async function listApprovedTemplates(wabaId: string): Promise<WhatsAppTemplate[]> {
  const token = process.env.META_ACCESS_TOKEN;
  if (!token) {
    throw new Error('META_ACCESS_TOKEN is not configured.');
  }

  const res = await fetch(
    `https://graph.facebook.com/v21.0/${wabaId}/message_templates?fields=name,status,language&limit=100`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data?.error?.message ?? `Meta API returned HTTP ${res.status}.`);
  }

  const templates: WhatsAppTemplate[] = (data.data ?? [])
    .filter((t: { status?: string }) => t.status === 'APPROVED')
    .map((t: { name: string; language: string; status: string }) => ({
      name: t.name,
      language: t.language,
      status: t.status,
    }));

  // A template name can exist in multiple languages; dedupe by name for the picker.
  const seen = new Set<string>();
  return templates.filter((t) => {
    if (seen.has(t.name)) return false;
    seen.add(t.name);
    return true;
  });
}
