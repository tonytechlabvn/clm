// Slot-based content form — renders dynamic form fields from slot definitions

"use client";

import { useRef, useCallback, useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2 } from "lucide-react";
import type { SlotDefinition } from "@/types/cma-template-types";
import type { SlotValues } from "@/types/cma-template-types";

interface CmaSlotFormProps {
  slotDefinitions: SlotDefinition[];
  slotValues: SlotValues;
  onChange: (values: SlotValues) => void;
  orgId?: string;
}

export function CmaSlotForm({ slotDefinitions, slotValues, onChange, orgId }: CmaSlotFormProps) {
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const [aiTopic, setAiTopic] = useState("");
  const [aiFilling, setAiFilling] = useState(false);
  const [showAiInput, setShowAiInput] = useState(false);

  async function handleAiFillAll() {
    if (!orgId || !aiTopic.trim()) return;
    setAiFilling(true);
    try {
      const res = await fetch("/api/cma/templates/ai-fill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orgId, slotDefinitions, topic: aiTopic.trim() }),
      });
      const json = await res.json();
      if (res.ok && json.data?.slotValues) {
        onChange({ ...slotValues, ...json.data.slotValues });
        setShowAiInput(false);
      }
    } catch { /* silent — user can fill manually */ }
    finally { setAiFilling(false); }
  }

  const handleChange = useCallback(
    (name: string, value: string) => {
      const updated = { ...slotValues, [name]: value };
      // Debounce to avoid rapid re-renders on live preview
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => onChange(updated), 300);
      // Also update immediately for form responsiveness
      onChange(updated);
    },
    [slotValues, onChange]
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">Content Slots</h3>
        {orgId && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAiInput(!showAiInput)}
            className="text-xs"
          >
            <Sparkles className="h-3 w-3 mr-1" /> AI Fill All
          </Button>
        )}
      </div>

      {showAiInput && (
        <div className="flex gap-2 p-3 bg-muted/50 rounded-md">
          <Input
            placeholder="Topic: e.g., How to learn React in 2026"
            value={aiTopic}
            onChange={(e) => setAiTopic(e.target.value)}
            className="text-sm"
            onKeyDown={(e) => e.key === "Enter" && handleAiFillAll()}
          />
          <Button size="sm" onClick={handleAiFillAll} disabled={aiFilling || !aiTopic.trim()}>
            {aiFilling ? <Loader2 className="h-3 w-3 animate-spin" /> : "Fill"}
          </Button>
        </div>
      )}
      {slotDefinitions.map((slot) => (
        <div key={slot.name}>
          <label className="flex items-center gap-2 text-sm font-medium mb-1">
            {slot.label}
            {slot.required && <Badge variant="secondary" className="text-[9px]">Required</Badge>}
            <span className="text-xs text-muted-foreground font-normal ml-auto">{slot.type}</span>
          </label>

          {slot.type === "text" && (
            <Input
              value={slotValues[slot.name] || ""}
              onChange={(e) => handleChange(slot.name, e.target.value)}
              placeholder={slot.placeholder}
              maxLength={slot.maxLength}
            />
          )}

          {slot.type === "richtext" && (
            <Textarea
              value={slotValues[slot.name] || ""}
              onChange={(e) => handleChange(slot.name, e.target.value)}
              placeholder={slot.placeholder}
              rows={4}
              maxLength={slot.maxLength}
            />
          )}

          {slot.type === "image" && (
            <Input
              value={slotValues[slot.name] || ""}
              onChange={(e) => handleChange(slot.name, e.target.value)}
              placeholder={slot.placeholder || "https://example.com/image.jpg"}
              type="url"
            />
          )}

          {slot.type === "list" && (
            <Textarea
              value={slotValues[slot.name] || ""}
              onChange={(e) => handleChange(slot.name, e.target.value)}
              placeholder="One item per line"
              rows={3}
            />
          )}

          {slot.maxLength && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {(slotValues[slot.name] || "").length} / {slot.maxLength}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
