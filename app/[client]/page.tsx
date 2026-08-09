import Link from "next/link";
import { notFound } from "next/navigation";
import { ACCOUNTS } from "@/lib/accounts";
import { SERVICES } from "@/lib/services";
import { ClientLogo } from "@/components/ClientLogo";

export default async function ClientPage({ params }: { params: Promise<{ client: string }> }) {
  const { client } = await params;
  const account = ACCOUNTS.find((a) => a.id === client);

  if (!account) {
    notFound();
  }

  return (
    <div className="flex flex-1 items-center justify-center bg-bg px-4 py-16">
      <div className="w-full max-w-2xl animate-fade-in-up">
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-1.5 text-xs font-medium text-text-muted transition-colors hover:text-text"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          All clients
        </Link>

        <div className="mb-10 flex items-center gap-4">
          <ClientLogo name={account.label} size={56} />
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-text-faint">Workspace</p>
            <h1 className="text-2xl font-semibold tracking-tight text-text">{account.label}</h1>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {SERVICES.map((service, i) =>
            service.enabled ? (
              <Link
                key={service.id}
                href={`/${account.id}/${service.id}`}
                className="group flex animate-fade-in-up flex-col gap-2 rounded-2xl border border-border bg-surface p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-lg"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <p className="text-base font-medium text-text">{service.label}</p>
                <p className="text-xs text-text-muted">{service.description}</p>
              </Link>
            ) : (
              <div
                key={service.id}
                className="flex animate-fade-in-up flex-col gap-2 rounded-2xl border border-dashed border-border bg-surface-2 p-5 opacity-60"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div className="flex items-center gap-2">
                  <p className="text-base font-medium text-text">{service.label}</p>
                  <span className="rounded-full border border-border bg-surface px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-text-faint">
                    Coming soon
                  </span>
                </div>
                <p className="text-xs text-text-muted">{service.description}</p>
              </div>
            ),
          )}
        </div>
      </div>
    </div>
  );
}
