// BlockNote custom block: Table of Contents placeholder
// Shows a non-editable placeholder in editor; actual TOC is auto-generated at publish time

import { createReactBlockSpec } from "@blocknote/react";

export const TocBlock = createReactBlockSpec(
  {
    type: "toc" as const,
    propSchema: {},
    content: "none",
  },
  {
    render: () => (
      <div style={{
        background: "linear-gradient(135deg, #f7fafc, #edf2f7)",
        padding: "1.2em 1.5em", borderRadius: "12px",
        border: "1px dashed #cbd5e0", margin: "1em 0",
      }}>
        <div style={{ fontWeight: 600, color: "#4a5568", fontSize: "0.95em" }}>
          Table of Contents
        </div>
        <div style={{ color: "#718096", fontSize: "0.85em", marginTop: "0.4em" }}>
          Auto-generated from headings when published
        </div>
      </div>
    ),
  }
);
