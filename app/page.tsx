"use client";

import { useEffect, useState } from "react";
import { ACCOUNTS, type AccountId } from "@/lib/accounts";
import { SpreadsheetCombobox, type Spreadsheet } from "@/components/SpreadsheetCombobox";

interface Tab {
  title: string;
  rowCount: number;
}

interface PreviewResult {
  total: number;
  ok: number;
  invalid: number;
  duplicate: number;
}

type SendState = "idle" | "confirming" | "sending" | "success" | "error";

export default function Home() {
  const [account, setAccount] = useState<AccountId | null>(null);

  const [spreadsheets, setSpreadsheets] = useState<Spreadsheet[]>([]);
  const [spreadsheetsLoading, setSpreadsheetsLoading] = useState(true);
  const [spreadsheetsError, setSpreadsheetsError] = useState<string | null>(null);
  const [spreadsheetsMessage, setSpreadsheetsMessage] = useState<string | null>(null);
  const [spreadsheet, setSpreadsheet] = useState<Spreadsheet | null>(null);

  const [tabs, setTabs] = useState<Tab[]>([]);
  const [tabsLoading, setTabsLoading] = useState(false);
  const [tabsError, setTabsError] = useState<string | null>(null);
  const [sheetName, setSheetName] = useState("");

  const [preview, setPreview] = useState<PreviewResult | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  const [templateName, setTemplateName] = useState("bagzl_mark_perc");
  const [sendState, setSendState] = useState<SendState>("idle");
  const [sendError, setSendError] = useState<string | null>(null);
  const [runId, setRunId] = useState<string | null>(null);

  // Fetch spreadsheets once on mount. spreadsheetsLoading already starts true.
  useEffect(() => {
    let cancelled = false;
    fetch("/api/spreadsheets")
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        if (data.error) {
          setSpreadsheetsError(data.error);
          return;
        }
        setSpreadsheets(data.files ?? []);
        setSpreadsheetsMessage(data.message ?? null);
      })
      .catch((err) => {
        if (!cancelled) setSpreadsheetsError(err instanceof Error ? err.message : "Failed to load spreadsheets.");
      })
      .finally(() => {
        if (!cancelled) setSpreadsheetsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Load tabs when the spreadsheet changes; reset downstream state.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- resetting dependent selection/preview state when `spreadsheet` changes
    setSheetName("");
    setTabs([]);
    setTabsError(null);
    setPreview(null);
    setPreviewError(null);

    if (!spreadsheet) return;

    let cancelled = false;
    setTabsLoading(true);
    fetch(`/api/spreadsheets/${spreadsheet.id}/tabs`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        if (data.error) {
          setTabsError(data.error);
          return;
        }
        setTabs(data.tabs ?? []);
      })
      .catch((err) => {
        if (!cancelled) setTabsError(err instanceof Error ? err.message : "Failed to load sheet tabs.");
      })
      .finally(() => {
        if (!cancelled) setTabsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [spreadsheet]);

  // Auto-fetch preview when the tab changes.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- resetting preview state when `sheetName` changes
    setPreview(null);
    setPreviewError(null);

    if (!spreadsheet || !sheetName) return;

    let cancelled = false;
    setPreviewLoading(true);
    fetch("/api/preview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ spreadsheetId: spreadsheet.id, sheetName }),
    })
      .then(async (r) => {
        const data = await r.json();
        if (cancelled) return;
        if (!r.ok || data.error) {
          setPreviewError(data.error ?? "Failed to preview recipients.");
          return;
        }
        setPreview(data);
      })
      .catch((err) => {
        if (!cancelled) setPreviewError(err instanceof Error ? err.message : "Failed to preview recipients.");
      })
      .finally(() => {
        if (!cancelled) setPreviewLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [spreadsheet, sheetName]);

  const accountDef = ACCOUNTS.find((a) => a.id === account) ?? null;
  const canSend = Boolean(account && spreadsheet && sheetName && preview && preview.ok > 0);

  async function handleConfirmSend() {
    setSendState("sending");
    setSendError(null);
    try {
      const res = await fetch("/api/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ account, spreadsheetId: spreadsheet!.id, sheetName, templateName }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setSendError(data.error ?? `Request failed with status ${res.status}.`);
        setSendState("error");
        return;
      }
      setRunId(data.runId ?? null);
      setSendState("success");
    } catch (err) {
      setSendError(err instanceof Error ? err.message : "Failed to reach the server.");
      setSendState("error");
    }
  }

  function handleReset() {
    setSendState("idle");
    setSendError(null);
    setRunId(null);
    setAccount(null);
    setSpreadsheet(null);
    setTemplateName("bagzl_mark_perc");
  }

  return (
    <div className="flex flex-1 items-center justify-center bg-bg px-4 py-8">
      <div className="w-full max-w-[480px] rounded-sm border border-border bg-surface">
        <div className="border-b border-border px-5 py-3">
          <h1 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-text-muted">
            WhatsApp Broadcast Panel
          </h1>
        </div>

        <div className="flex flex-col gap-5 px-5 py-5">
          {/* Step 1: Account */}
          <div className="flex flex-col gap-2">
            <label className="text-[11px] font-medium uppercase tracking-wide text-text-faint">1 — Account</label>
            <div className="grid grid-cols-2 gap-2">
              {ACCOUNTS.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => setAccount(a.id)}
                  disabled={sendState === "success"}
                  className={`rounded-sm border px-3 py-2 text-[13px] transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                    account === a.id
                      ? "border-text-muted bg-surface-2 text-text"
                      : "border-border text-text-muted hover:border-text-faint"
                  }`}
                >
                  {a.label}
                </button>
              ))}
            </div>
          </div>

          {/* Step 2: Spreadsheet */}
          <div className="flex flex-col gap-2">
            <label className="text-[11px] font-medium uppercase tracking-wide text-text-faint">2 — Spreadsheet</label>
            <SpreadsheetCombobox
              spreadsheets={spreadsheets}
              value={spreadsheet}
              onChange={setSpreadsheet}
              disabled={!account || sendState === "success"}
              loading={spreadsheetsLoading}
            />
            {spreadsheetsError && <p className="text-[12px] text-danger">{spreadsheetsError}</p>}
            {spreadsheetsMessage && <p className="text-[12px] text-text-faint">{spreadsheetsMessage}</p>}
          </div>

          {/* Step 3: Sheet tab */}
          {spreadsheet && (
            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-medium uppercase tracking-wide text-text-faint">3 — Sheet tab</label>
              <select
                value={sheetName}
                onChange={(e) => setSheetName(e.target.value)}
                disabled={tabsLoading || sendState === "success"}
                className="w-full rounded-sm border border-border bg-surface-2 px-3 py-2 text-[13px] text-text disabled:opacity-40"
              >
                <option value="">{tabsLoading ? "Loading tabs…" : "Select tab…"}</option>
                {tabs.map((t) => (
                  <option key={t.title} value={t.title}>
                    {t.title} ({t.rowCount} rows)
                  </option>
                ))}
              </select>
              {tabsError && <p className="text-[12px] text-danger">{tabsError}</p>}
            </div>
          )}

          {/* Step 4: Preview */}
          {spreadsheet && sheetName && (
            <div className="flex flex-col gap-1 border-t border-border pt-4">
              {previewLoading && <p className="text-[12px] text-text-faint">Counting recipients…</p>}
              {previewError && <p className="text-[12px] text-danger">{previewError}</p>}
              {preview && (
                <>
                  <p className="font-mono text-4xl font-semibold tabular-nums text-text">
                    {preview.ok} <span className="text-lg font-normal text-text-muted">recipients</span>
                  </p>
                  <p className="font-mono text-[12px] tabular-nums text-text-faint">
                    {preview.invalid} invalid · {preview.duplicate} duplicate · {preview.total} total rows
                  </p>
                </>
              )}
            </div>
          )}

          {/* Step 5: Send */}
          <div className="flex flex-col gap-2 border-t border-border pt-4">
            <label className="text-[11px] font-medium uppercase tracking-wide text-text-faint">Template name</label>
            <input
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              disabled={sendState === "sending" || sendState === "success"}
              className="w-full rounded-sm border border-border bg-surface-2 px-3 py-2 font-mono text-[13px] text-text disabled:opacity-40"
            />

            {sendState === "success" ? (
              <div className="flex flex-col gap-2 rounded-sm border border-border bg-surface-2 px-3 py-3">
                <p className="text-[13px] text-success">Broadcast triggered.</p>
                {runId && <p className="font-mono text-[12px] text-text-muted">runId: {runId}</p>}
                <button
                  type="button"
                  onClick={handleReset}
                  className="mt-1 rounded-sm border border-border px-3 py-1.5 text-[12px] text-text-muted hover:border-text-faint"
                >
                  Reset
                </button>
              </div>
            ) : (
              <>
                <button
                  type="button"
                  disabled={!canSend || sendState === "sending"}
                  onClick={() => setSendState("confirming")}
                  className="flex items-center justify-center gap-2 rounded-sm bg-accent px-3 py-2 text-[13px] font-medium text-black disabled:opacity-30 disabled:cursor-not-allowed enabled:hover:bg-accent-hover"
                >
                  {sendState === "sending" && (
                    <span className="h-3 w-3 animate-spin rounded-full border-2 border-black/30 border-t-black" />
                  )}
                  {sendState === "sending" ? "Sending…" : "Send broadcast"}
                </button>
                {sendState === "error" && sendError && (
                  <p className="text-[12px] text-danger">{sendError}</p>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {sendState === "confirming" && accountDef && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-[380px] rounded-sm border border-border bg-surface p-5">
            <p className="text-[13px] text-text">
              Send to <span className="font-mono font-semibold tabular-nums">{preview?.ok}</span> recipients on{" "}
              <span className="font-medium">{accountDef.label}</span>?
            </p>
            <p className="mt-1 text-[12px] text-text-faint">This triggers the n8n broadcast workflow immediately.</p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setSendState("idle")}
                className="rounded-sm border border-border px-3 py-1.5 text-[12px] text-text-muted hover:border-text-faint"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmSend}
                className="rounded-sm bg-accent px-3 py-1.5 text-[12px] font-medium text-black hover:bg-accent-hover"
              >
                Confirm send
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
