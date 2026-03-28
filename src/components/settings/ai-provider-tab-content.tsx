"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Check, Zap, ChevronDown } from "lucide-react";

interface ModelOption { id: string; label: string }

interface ProviderTabContentProps {
  providerLabel: string;
  isActive: boolean;
  model: string;
  onModelChange: (v: string) => void;
  modelOptions: ModelOption[];
  apiKey: string;
  onApiKeyChange: (v: string) => void;
  maskedKey: string;
  hasKey: boolean;
  onSetActive: () => void;
  // Local LLM only
  baseUrl?: string;
  onBaseUrlChange?: (v: string) => void;
}

export function AiProviderTabContent({
  providerLabel, isActive, model, onModelChange, modelOptions,
  apiKey, onApiKeyChange, maskedKey, hasKey, onSetActive,
  baseUrl, onBaseUrlChange,
}: ProviderTabContentProps) {
  const [presetsOpen, setPresetsOpen] = useState(false);
  const presetsRef = useRef<HTMLDivElement>(null);

  // Close presets dropdown on outside click
  useEffect(() => {
    if (!presetsOpen) return;
    function handleClick(e: MouseEvent) {
      if (presetsRef.current && !presetsRef.current.contains(e.target as Node)) {
        setPresetsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [presetsOpen]);

  return (
    <div className="space-y-5">
      {isActive ? (
        <div className="flex items-center gap-2 text-sm text-green-600 font-medium">
          <Check className="h-4 w-4" /> Currently active provider
        </div>
      ) : (
        <Button variant="outline" size="sm" onClick={onSetActive}>
          <Zap className="h-4 w-4 mr-1" />
          Set {providerLabel} as active provider
        </Button>
      )}

      {/* Model input with presets dropdown */}
      <div>
        <label className="text-sm font-medium">Model</label>
        <div className="flex gap-2 mt-1">
          <input
            type="text"
            value={model}
            onChange={(e) => onModelChange(e.target.value)}
            placeholder={`Enter model ID (e.g. ${modelOptions[0]?.id || "model-name"})`}
            className="flex-1 rounded-md border px-3 py-2 text-sm"
          />
          <div className="relative" ref={presetsRef}>
            <Button
              variant="outline"
              size="sm"
              className="h-[38px] px-3"
              onClick={() => setPresetsOpen(!presetsOpen)}
            >
              Presets
              <ChevronDown className="h-3 w-3 ml-1" />
            </Button>
            {presetsOpen && (
              <div className="absolute right-0 top-full mt-1 z-50 w-64 rounded-md border bg-popover shadow-md">
                {modelOptions.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => { onModelChange(m.id); setPresetsOpen(false); }}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors ${
                      model === m.id ? "bg-accent font-medium" : ""
                    }`}
                  >
                    <span className="block">{m.label}</span>
                    <span className="block text-xs text-muted-foreground">{m.id}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Enter any model ID or pick from presets. Custom models use default token limits.
        </p>
      </div>

      {/* API Key */}
      <div>
        <label className="text-sm font-medium">API Key</label>
        <input type="password" placeholder={`Enter ${providerLabel} API key`}
          value={apiKey} onChange={(e) => onApiKeyChange(e.target.value)}
          className="w-full mt-1 rounded-md border px-3 py-2 text-sm" />
        <p className="text-xs text-muted-foreground mt-1">
          {hasKey ? `Current: ${maskedKey} — leave blank to keep existing key.` : "No key configured."}
        </p>
      </div>

      {/* Local LLM base URL */}
      {onBaseUrlChange && (
        <div>
          <label className="text-sm font-medium">Base URL</label>
          <input type="url" placeholder="http://localhost:11434/v1"
            value={baseUrl || ""} onChange={(e) => onBaseUrlChange(e.target.value)}
            className="w-full mt-1 rounded-md border px-3 py-2 text-sm" />
        </div>
      )}
    </div>
  );
}
