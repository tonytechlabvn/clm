// Slot definition editor — review and edit AI-detected slots

"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import type { SlotDefinition, SlotType } from "@/types/cma-template-types";

const SLOT_TYPES: { value: SlotType; label: string }[] = [
  { value: "text", label: "Text" },
  { value: "richtext", label: "Rich Text" },
  { value: "image", label: "Image" },
  { value: "list", label: "List" },
];

interface TemplateSlotEditorProps {
  slots: SlotDefinition[];
  onChange: (slots: SlotDefinition[]) => void;
}

export function TemplateSlotEditor({ slots, onChange }: TemplateSlotEditorProps) {
  function updateSlot(index: number, field: keyof SlotDefinition, value: unknown) {
    const updated = [...slots];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  }

  function removeSlot(index: number) {
    onChange(slots.filter((_, i) => i !== index));
  }

  function addSlot() {
    onChange([
      ...slots,
      {
        name: `slot_${slots.length + 1}`,
        type: "text",
        label: `Slot ${slots.length + 1}`,
        placeholder: "",
        required: false,
      },
    ]);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Content Slots ({slots.length})</h3>
        <Button variant="outline" size="sm" onClick={addSlot} disabled={slots.length >= 15}>
          <Plus className="h-3 w-3 mr-1" /> Add Slot
        </Button>
      </div>

      {slots.length === 0 && (
        <p className="text-sm text-muted-foreground py-4 text-center">
          No slots detected. Add slots manually or try a different URL.
        </p>
      )}

      <div className="space-y-2">
        {slots.map((slot, i) => (
          <div key={i} className="flex items-center gap-2 p-2 border rounded-md bg-muted/30">
            <Input
              className="w-32 text-xs"
              value={slot.name}
              onChange={(e) => updateSlot(i, "name", e.target.value)}
              placeholder="slot_name"
            />
            <Select
              value={slot.type}
              onValueChange={(v) => updateSlot(i, "type", v)}
            >
              <SelectTrigger className="w-28 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SLOT_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              className="flex-1 text-xs"
              value={slot.label}
              onChange={(e) => updateSlot(i, "label", e.target.value)}
              placeholder="Label"
            />
            <label className="flex items-center gap-1 text-xs whitespace-nowrap">
              <input
                type="checkbox"
                checked={slot.required}
                onChange={(e) => updateSlot(i, "required", e.target.checked)}
              />
              Req
            </label>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => removeSlot(i)}
              className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
