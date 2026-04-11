"use client";
// Shared inspector input primitives. Kept as small uncontrolled/controlled
// hybrids so the properties sections stay terse. Every primitive is designed
// to commit on change — undo-stack spam is accepted for MVP per plan risk
// assessment (YAGNI: add debouncing if users complain).

import { useId } from "react";

// ── Numeric input with label, step, optional min/max clamp ─────────────

interface NumericInputProps {
  label: string;
  value: number;
  onChange: (next: number) => void;
  step?: number;
  min?: number;
  max?: number;
  suffix?: string;
}

export function NumericInput({
  label,
  value,
  onChange,
  step = 1,
  min,
  max,
  suffix,
}: NumericInputProps) {
  const id = useId();
  const handleChange = (raw: string) => {
    const parsed = Number(raw);
    if (Number.isNaN(parsed)) return;
    let next = parsed;
    if (min !== undefined) next = Math.max(min, next);
    if (max !== undefined) next = Math.min(max, next);
    onChange(next);
  };
  return (
    <div className="flex flex-col gap-0.5">
      <label htmlFor={id} className="text-[10px] uppercase tracking-wide text-muted-foreground">
        {label}
      </label>
      <div className="flex items-center gap-1">
        <input
          id={id}
          type="number"
          value={Number.isFinite(value) ? value : 0}
          step={step}
          min={min}
          max={max}
          onChange={(e) => handleChange(e.target.value)}
          className="w-full text-xs border rounded px-1.5 py-1 bg-background"
        />
        {suffix && <span className="text-[10px] text-muted-foreground">{suffix}</span>}
      </div>
    </div>
  );
}

// ── Color input (native color picker + hex fallback) ───────────────────

interface ColorInputProps {
  label: string;
  value: string;
  onChange: (next: string) => void;
}

export function ColorInput({ label, value, onChange }: ColorInputProps) {
  const id = useId();
  // Native input[type=color] rejects non-hex values — keep a text fallback for
  // {{token}} placeholders and invalid values. Author can still type the hex.
  const isHex = /^#[0-9a-f]{6}$/i.test(value);
  return (
    <div className="flex flex-col gap-0.5">
      <label htmlFor={id} className="text-[10px] uppercase tracking-wide text-muted-foreground">
        {label}
      </label>
      <div className="flex items-center gap-1">
        <input
          id={id}
          type="color"
          value={isHex ? value : "#000000"}
          onChange={(e) => onChange(e.target.value)}
          className="h-7 w-7 rounded border cursor-pointer"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#000000"
          className="flex-1 text-xs border rounded px-1.5 py-1 bg-background font-mono"
        />
      </div>
    </div>
  );
}

// ── Select wrapper using native select for simplicity ──────────────────

interface SelectInputProps<T extends string> {
  label: string;
  value: T;
  options: ReadonlyArray<{ value: T; label: string }> | ReadonlyArray<T>;
  onChange: (next: T) => void;
}

export function SelectInput<T extends string>({
  label,
  value,
  options,
  onChange,
}: SelectInputProps<T>) {
  const id = useId();
  const normalized = options.map((o) =>
    typeof o === "string" ? { value: o, label: o } : o
  );
  return (
    <div className="flex flex-col gap-0.5">
      <label htmlFor={id} className="text-[10px] uppercase tracking-wide text-muted-foreground">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="w-full text-xs border rounded px-1.5 py-1 bg-background"
      >
        {normalized.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

// ── Section header ─────────────────────────────────────────────────────

export function InspectorSectionHeader({ children }: { children: string }) {
  return (
    <h4 className="text-xs font-semibold text-foreground mb-2 mt-3 first:mt-0">
      {children}
    </h4>
  );
}
