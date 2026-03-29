// Template edit modal — fetches template by ID, shows metadata + slot editor, saves via PUT

"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { TemplateMetadataForm, type TemplateMetadata } from "./template-metadata-form";
import { TemplateSlotEditor } from "./template-slot-editor";
import { TemplateHtmlPreview } from "./template-html-preview";
import type { SlotDefinition } from "@/types/cma-template-types";

interface TemplateEditModalProps {
  templateId: string | null;
  orgId: string;
  onClose: () => void;
  onSaved: () => void;
}

export function TemplateEditModal({ templateId, orgId, onClose, onSaved }: TemplateEditModalProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [metadata, setMetadata] = useState<TemplateMetadata>({
    name: "",
    description: "",
    category: "",
    tags: "",
  });
  const [slots, setSlots] = useState<SlotDefinition[]>([]);
  const [htmlTemplate, setHtmlTemplate] = useState("");
  const [cssScoped, setCssScoped] = useState("");
  const [templateType, setTemplateType] = useState("");

  useEffect(() => {
    if (!templateId) return;
    setLoading(true);
    setError(null);
    fetch(`/api/cma/templates/${templateId}?orgId=${orgId}`)
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load template");
        return r.json();
      })
      .then((t) => {
        setMetadata({
          name: t.name || "",
          description: t.description || "",
          category: t.category || "",
          tags: Array.isArray(t.tags) ? t.tags.join(", ") : "",
        });
        setSlots(Array.isArray(t.slotDefinitions) ? t.slotDefinitions : []);
        setHtmlTemplate(t.htmlTemplate || "");
        setCssScoped(t.cssScoped || "");
        setTemplateType(t.templateType || "blocks");
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [templateId, orgId]);

  async function handleSave() {
    if (!templateId || !metadata.name.trim() || !metadata.category) return;
    setSaving(true);
    setError(null);
    try {
      const body: Record<string, unknown> = {
        orgId,
        name: metadata.name.trim(),
        description: metadata.description.trim() || null,
        category: metadata.category,
        tags: metadata.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
      };
      // Include slot data for html-slots templates
      if (templateType === "html-slots") {
        body.slotDefinitions = slots;
      }
      const res = await fetch(`/api/cma/templates/${templateId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.details || "Failed to save");
      }
      onSaved();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  const isHtmlSlots = templateType === "html-slots";
  const canSave = metadata.name.trim() && metadata.category && !saving;

  return (
    <Dialog open={!!templateId} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Template</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : error && !metadata.name ? (
          <div className="text-center py-8 text-destructive">{error}</div>
        ) : (
          <div className="space-y-6">
            {/* HTML preview for html-slots templates */}
            {isHtmlSlots && htmlTemplate && (
              <div>
                <label className="text-sm font-medium mb-1 block">Preview</label>
                <div className="border rounded-md overflow-hidden h-40">
                  <TemplateHtmlPreview
                    htmlTemplate={htmlTemplate}
                    cssScoped={cssScoped}
                    scopeClass={`tpl-edit-${templateId?.slice(0, 8)}`}
                    scale={0.35}
                    className="h-full"
                  />
                </div>
              </div>
            )}

            <TemplateMetadataForm value={metadata} onChange={setMetadata} />

            {isHtmlSlots && (
              <TemplateSlotEditor slots={slots} onChange={setSlots} />
            )}

            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!canSave || loading}>
            {saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
