"use client";

import { Button } from "@/components/ui/button";
import { Check, Zap } from "lucide-react";

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

      {/* Model selector */}
      <div>
        <label className="text-sm font-medium">Model</label>
        <select value={model} onChange={(e) => onModelChange(e.target.value)}
          className="w-full mt-1 rounded-md border px-3 py-2">
          {modelOptions.map((m) => (
            <option key={m.id} value={m.id}>{m.label}</option>
          ))}
        </select>
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
