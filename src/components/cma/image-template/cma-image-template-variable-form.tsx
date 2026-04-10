"use client";

// Dynamic variable form — renders inputs based on template variableSchema (text, image, color)

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Wand2 } from "lucide-react";
import type { VariableDefinition } from "@/lib/cma/types/image-template-types";

interface Props {
  schema: VariableDefinition[];
  values: Record<string, string>;
  onChange: (values: Record<string, string>) => void;
  onAutoFill?: () => void;
}

export function CmaImageTemplateVariableForm({ schema, values, onChange, onAutoFill }: Props) {
  function handleChange(name: string, value: string) {
    onChange({ ...values, [name]: value });
  }

  return (
    <div className="space-y-3">
      {onAutoFill && (
        <Button variant="outline" size="sm" className="w-full" onClick={onAutoFill}>
          <Wand2 className="h-3.5 w-3.5 mr-1.5" />
          Auto-fill from post
        </Button>
      )}

      {schema.map((v) => (
        <div key={v.name} className="space-y-1">
          <label className="text-xs font-medium">
            {v.label}
            {v.required && <span className="text-destructive ml-0.5">*</span>}
          </label>

          {v.type === "color" ? (
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={values[v.name] || v.defaultValue || "#6366f1"}
                onChange={(e) => handleChange(v.name, e.target.value)}
                className="h-8 w-10 rounded border cursor-pointer"
              />
              <Input
                value={values[v.name] || v.defaultValue || ""}
                onChange={(e) => handleChange(v.name, e.target.value)}
                placeholder="#6366f1"
                className="h-8 text-xs font-mono"
              />
            </div>
          ) : (
            <Input
              value={values[v.name] || ""}
              onChange={(e) => handleChange(v.name, e.target.value)}
              placeholder={v.placeholder || `Enter ${v.label.toLowerCase()}`}
              maxLength={v.maxLength}
              className="h-8 text-sm"
            />
          )}

          {v.maxLength && values[v.name] && (
            <p className="text-[10px] text-muted-foreground text-right">
              {values[v.name].length}/{v.maxLength}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
