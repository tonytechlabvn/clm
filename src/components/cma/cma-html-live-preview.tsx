// Real-time HTML preview — renders template with current slot values

"use client";

import { useMemo } from "react";
import { injectSlotValues } from "@/lib/cma/utils/template-slot-renderer";
import type { SlotValues, SlotDefinition } from "@/types/cma-template-types";

interface CmaHtmlLivePreviewProps {
  htmlTemplate: string;
  cssScoped: string;
  slotValues: SlotValues;
  templateId: string;
  slotDefinitions?: SlotDefinition[];
}

export function CmaHtmlLivePreview({
  htmlTemplate,
  cssScoped,
  slotValues,
  templateId,
  slotDefinitions,
}: CmaHtmlLivePreviewProps) {
  const scopeClass = `tpl-${templateId.slice(0, 8)}`;

  const renderedHtml = useMemo(
    () => injectSlotValues(htmlTemplate, slotValues, slotDefinitions),
    [htmlTemplate, slotValues, slotDefinitions]
  );

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="px-3 py-1.5 bg-muted border-b text-xs text-muted-foreground font-medium">
        Live Preview
      </div>
      <div className="p-4 overflow-auto max-h-[600px]">
        <style dangerouslySetInnerHTML={{ __html: cssScoped }} />
        <div
          className={scopeClass}
          dangerouslySetInnerHTML={{ __html: renderedHtml }}
        />
      </div>
    </div>
  );
}
