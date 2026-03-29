// Template metadata form — name, category, tags, description (shared by create + edit flows)

"use client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const CATEGORIES = [
  { value: "tutorial", label: "Tutorial" },
  { value: "news", label: "News" },
  { value: "announce", label: "Announcement" },
  { value: "article", label: "Article" },
  { value: "other", label: "Other" },
];

export interface TemplateMetadata {
  name: string;
  description: string;
  category: string;
  tags: string;
}

interface TemplateMetadataFormProps {
  value: TemplateMetadata;
  onChange: (value: TemplateMetadata) => void;
}

export function TemplateMetadataForm({ value, onChange }: TemplateMetadataFormProps) {
  function update(field: keyof TemplateMetadata, val: string) {
    onChange({ ...value, [field]: val });
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium mb-1 block">Template Name *</label>
        <Input
          placeholder="My Template"
          value={value.name}
          onChange={(e) => update("name", e.target.value)}
        />
      </div>

      <div>
        <label className="text-sm font-medium mb-1 block">Description</label>
        <Textarea
          placeholder="Brief description of this template..."
          value={value.description}
          onChange={(e) => update("description", e.target.value)}
          rows={2}
        />
      </div>

      <div>
        <label className="text-sm font-medium mb-1 block">Category *</label>
        <Select value={value.category} onValueChange={(v) => update("category", v || "")}>
          <SelectTrigger>
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((c) => (
              <SelectItem key={c.value} value={c.value}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className="text-sm font-medium mb-1 block">Tags</label>
        <Input
          placeholder="tag1, tag2, tag3 (comma-separated)"
          value={value.tags}
          onChange={(e) => update("tags", e.target.value)}
        />
        <p className="text-xs text-muted-foreground mt-1">Comma-separated tags for filtering</p>
      </div>
    </div>
  );
}
