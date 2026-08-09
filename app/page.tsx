import Link from "next/link";
import { ACCOUNTS } from "@/lib/accounts";

export default function Home() {
  return (
    <div className="flex flex-1 items-center justify-center bg-bg px-4 py-16">
      <div className="w-full max-w-3xl animate-fade-in-up">
        <div className="mb-12 text-center">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-text-faint">
            Bagzland Suite
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-text">Select a client</h1>
          <p className="mt-2 text-sm text-text-muted">Choose which client workspace you want to work in.</p>
        </div>

        <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-x-8 gap-y-10">
          {ACCOUNTS.map((account, i) => (
            <Link
              key={account.id}
              href={`/${account.id}`}
              className="client-card group animate-fade-in-up block p-3"
              style={
                {
                  "--card-color": account.cardColor,
                  animationDelay: `${i * 60}ms`,
                } as React.CSSProperties
              }
            >
              <div className="client-card__face">
                <span className="text-4xl font-bold text-white/95 drop-shadow-sm">
                  {account.label.charAt(0).toUpperCase()}
                </span>
              </div>
              <p className="client-card__caption truncate text-center text-sm">{account.label}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
