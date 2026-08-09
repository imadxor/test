import Link from "next/link";
import { notFound } from "next/navigation";
import { ACCOUNTS, type AccountId } from "@/lib/accounts";
import { BroadcastPanel } from "@/components/BroadcastPanel";

export default async function WhatsAppMarketingPage({ params }: { params: Promise<{ client: string }> }) {
  const { client } = await params;
  const account = ACCOUNTS.find((a) => a.id === client);

  if (!account) {
    notFound();
  }

  return (
    <div className="flex flex-1 flex-col items-center bg-bg px-4 py-10">
      <div className="mb-6 w-full max-w-[480px]">
        <Link
          href={`/${client}`}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-text-muted transition-colors hover:text-text"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          {account.label} services
        </Link>
      </div>
      <BroadcastPanel accountId={client as AccountId} />
    </div>
  );
}
