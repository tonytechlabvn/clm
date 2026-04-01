"use client";

// Modal dialog for saving a post's format/structure as a reusable template
// Collects name, category, description then calls POST /api/cma/templates/from-post

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, X, LayoutTemplate } from "lucide-react";

interface SaveAsTemplateModalProps {
  open: boolean;
  onClose: () => void;
  postId: string;
  postTitle: string;
  orgId: string;
  onSuccess?: (templateId: string) => void;
}

const CATEGORIES = [
  { value: "tutorial", label: "Tutorial" },
  { value: "news", label: "News" },
  { value: "announce", label: "Announcement" },
];

export function CmaSaveAsTemplateModal({ open, onClose, postId, postTitle, orgId, onSuccess }: SaveAsTemplateModalProps) {
  const [name, setName] = useState(`${postTitle} - Template`);
  const [category, setCategory] = useState("tutorial");
  const [description, setDescription] = useState(`Structure extracted from: ${postTitle}`);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  if (!open) return null;

  async function handleSave() {
    if (!name.trim()) { setError("Name is required"); return; }
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/cma/templates/from-post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orgId, postId, name: name.trim(), category, description: description.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to save template"); return; }
      setSuccess(true);
      onSuccess?.(data.data.id);
      setTimeout(onClose, 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save template");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-background rounded-xl shadow-2xl w-full max-w-md p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <LayoutTemplate className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold">Save as Template</h2>
          </div>
          <button onClick={onClose} className="rounded-md p-1 hover:bg-muted" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="text-sm text-muted-foreground">
          Extract the format structure from this post. Next time you choose this template, the structure will be applied without AI.
        </p>

        {/* Name */}
        <div>
          <label className="block text-sm font-medium mb-1">Template Name</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border rounded-md bg-background text-sm" placeholder="My Template" />
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium mb-1">Category</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)}
            className="w-full px-3 py-2 border rounded-md bg-background text-sm">
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2}
            className="w-full px-3 py-2 border rounded-md bg-background text-sm resize-none" placeholder="Optional description" />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}
        {success && <p className="text-sm text-green-600">Template saved! Redirecting to Template Studio...</p>}

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving || success} className="gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <LayoutTemplate className="h-4 w-4" />}
            Save Template
          </Button>
        </div>
      </div>
    </div>
  );
}
