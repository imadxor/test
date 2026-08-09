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

interface WhatsAppTemplate {
  name: string;
  language: string;
  status: string;
}

type SendState = "idle" | "confirming" | "sending" | "success" | "error";

export function BroadcastPanel({ accountId }: { accountId: AccountId }) {
  const accountDef = ACCOUNTS.find((a) => a.id === accountId) ?? null;

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

  const [templates, setTemplates] = useState<WhatsAppTemplate[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(true);
  const [templatesError, setTemplatesError] = useState<string | null>(null);
  const [templateName, setTemplateName] = useState("");

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

  // Fetch approved templates once on mount (fixed account for this page).
  useEffect(() => {
    let cancelled = false;
    fetch(`/api/templates?account=${accountId}`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        if (data.error) {
          setTemplatesError(data.error);
          return;
        }
        setTemplates(data.templates ?? []);
      })
      .catch((err) => {
        if (!cancelled) setTemplatesError(err instanceof Error ? err.message : "Failed to load templates.");
      })
      .finally(() => {
        if (!cancelled) setTemplatesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [accountId]);

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

  const canSend = Boolean(spreadsheet && sheetName && templateName && preview && preview.ok > 0);

  async function handleConfirmSend() {
    setSendState("sending");
    setSendError(null);
    try {
      const res = await fetch("/api/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ account: accountId, spreadsheetId: spreadsheet!.id, sheetName, templateName }),
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
    setSpreadsheet(null);
    setTemplateName("");
  }

  if (!accountDef) return null;

  return (
    <>
      <div className="w-full max-w-[480px] animate-fade-in-up rounded-2xl border border-border bg-surface shadow-sm">
        <div className="border-b border-border px-5 py-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-text-faint">
            {accountDef.label}
          </p>
          <h1 className="text-base font-semibold text-text">WhatsApp Marketing</h1>
        </div>

        <div className="flex flex-col gap-5 px-5 py-5">
          {/* Step 1: Spreadsheet */}
          <div className="flex flex-col gap-2">
            <label className="text-[11px] font-medium uppercase tracking-wide text-text-faint">1 — Google Sheet</label>
            <SpreadsheetCombobox
              spreadsheets={spreadsheets}
              value={spreadsheet}
              onChange={setSpreadsheet}
              disabled={sendState === "success"}
              loading={spreadsheetsLoading}
            />
            {spreadsheetsError && <p className="text-[12px] text-danger">{spreadsheetsError}</p>}
            {spreadsheetsMessage && <p className="text-[12px] text-text-faint">{spreadsheetsMessage}</p>}
          </div>

          {/* Step 2: Sheet tab */}
          {spreadsheet && (
            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-medium uppercase tracking-wide text-text-faint">2 — Sheet</label>
              <select
                value={sheetName}
                onChange={(e) => setSheetName(e.target.value)}
                disabled={tabsLoading || sendState === "success"}
                className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-[13px] text-text disabled:opacity-40"
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

          {/* Preview */}
          {spreadsheet && sheetName && (
            <div className="flex flex-col gap-1 border-t border-border pt-4">
              {previewLoading && <p className="text-[12px] text-text-faint">Calcule de liste participants…</p>}
              {previewError && <p className="text-[12px] text-danger">{previewError}</p>}
              {preview && (
                <>
                  <p className="font-mono text-4xl font-semibold tabular-nums text-text">
                    {preview.ok} <span className="text-lg font-normal text-text-muted">Client(s)</span>
                  </p>
                  <p className="font-mono text-[12px] tabular-nums text-text-faint">
                    {preview.invalid} invalide · {preview.duplicate} doublé · {preview.total} total lignes
                  </p>
                </>
              )}
            </div>
          )}

          {/* Template + Send */}
          <div className="flex flex-col gap-2 border-t border-border pt-4">
            <label className="text-[11px] font-medium uppercase tracking-wide text-text-faint">Template</label>
            <select
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              disabled={templatesLoading || sendState === "sending" || sendState === "success"}
              className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2 font-mono text-[13px] text-text disabled:opacity-40"
            >
              <option value="">{templatesLoading ? "Loading templates…" : "Select template…"}</option>
              {templates.map((t) => (
                <option key={t.name} value={t.name}>
                  {t.name}
                </option>
              ))}
            </select>
            {templatesError && <p className="text-[12px] text-danger">{templatesError}</p>}

            {sendState === "success" ? (
              <div className="flex flex-col gap-2 rounded-lg border border-border bg-surface-2 px-3 py-3">
                <p className="text-[13px] text-success">Commande envoyée</p>
                {runId && <p className="font-mono text-[12px] text-text-muted">runId: {runId}</p>}
                <button
                  type="button"
                  onClick={handleReset}
                  className="mt-1 rounded-lg border border-border px-3 py-1.5 text-[12px] text-text-muted transition-colors hover:border-text-faint"
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
                  className="flex items-center justify-center gap-2 rounded-lg bg-accent px-3 py-2 text-[13px] font-medium text-white shadow-sm transition-colors disabled:cursor-not-allowed disabled:opacity-30 enabled:hover:bg-accent-hover"
                >
                  {sendState === "sending" && (
                    <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  )}
                  {sendState === "sending" ? "Envoi…" : "Envoyer"}
                </button>
                {sendState === "error" && sendError && <p className="text-[12px] text-danger">{sendError}</p>}
              </>
            )}
          </div>
        </div>
      </div>

      {sendState === "confirming" && accountDef && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm">
          <div className="w-full max-w-[380px] animate-fade-in-up rounded-2xl border border-border bg-surface p-5 shadow-xl">
            <p className="text-[13px] text-text">
              Send to <span className="font-mono font-semibold tabular-nums">{preview?.ok}</span> recipients on{" "}
              <span className="font-medium">{accountDef.label}</span>?
            </p>
            <p className="mt-1 text-[12px] text-text-faint">This triggers the n8n broadcast workflow immediately.</p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setSendState("idle")}
                className="rounded-lg border border-border px-3 py-1.5 text-[12px] text-text-muted transition-colors hover:border-text-faint"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmSend}
                className="rounded-lg bg-accent px-3 py-1.5 text-[12px] font-medium text-white shadow-sm transition-colors hover:bg-accent-hover"
              >
                Confirm send
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
