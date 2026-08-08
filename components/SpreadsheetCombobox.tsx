"use client";

import { useEffect, useMemo, useRef, useState } from "react";

export interface Spreadsheet {
  id: string;
  name: string;
  modifiedTime: string;
}

interface SpreadsheetComboboxProps {
  spreadsheets: Spreadsheet[];
  value: Spreadsheet | null;
  onChange: (spreadsheet: Spreadsheet) => void;
  disabled: boolean;
  loading: boolean;
}

export function SpreadsheetCombobox({
  spreadsheets,
  value,
  onChange,
  disabled,
  loading,
}: SpreadsheetComboboxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return spreadsheets;
    return spreadsheets.filter((s) => s.name.toLowerCase().includes(q));
  }, [spreadsheets, query]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          setQuery("");
          setOpen((o) => !o);
        }}
        className="w-full flex items-center justify-between gap-2 rounded-sm border border-border bg-surface-2 px-3 py-2 text-left text-[13px] text-text disabled:opacity-40 disabled:cursor-not-allowed enabled:hover:border-text-faint"
      >
        <span className={value ? "text-text truncate" : "text-text-faint"}>
          {loading ? "Loading spreadsheets…" : value ? value.name : "Select spreadsheet…"}
        </span>
        <span className="text-text-faint shrink-0">▾</span>
      </button>

      {open && !disabled && (
        <div className="absolute z-20 mt-1 w-full rounded-sm border border-border bg-surface-2 shadow-lg">
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search…"
            className="w-full border-b border-border bg-transparent px-3 py-2 text-[13px] text-text placeholder:text-text-faint outline-none"
          />
          <ul className="max-h-56 overflow-y-auto">
            {filtered.length === 0 && (
              <li className="px-3 py-2 text-[12px] text-text-faint">No matches.</li>
            )}
            {filtered.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(s);
                    setOpen(false);
                  }}
                  className={`w-full truncate px-3 py-2 text-left text-[13px] hover:bg-surface ${
                    value?.id === s.id ? "text-text bg-surface" : "text-text"
                  }`}
                >
                  {s.name}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
