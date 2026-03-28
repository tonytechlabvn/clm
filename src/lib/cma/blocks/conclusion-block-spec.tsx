// BlockNote custom block: Conclusion section with dark gradient background
// Renders centered white-text section for post summaries

import { defaultProps } from "@blocknote/core";
import { createReactBlockSpec } from "@blocknote/react";

export const ConclusionBlock = createReactBlockSpec(
  {
    type: "conclusion" as const,
    propSchema: { ...defaultProps },
    content: "inline",
  },
  {
    render: ({ contentRef }) => (
      <div style={{
        background: "linear-gradient(135deg, #1a365d, #2c5282)",
        color: "white", padding: "1.5em 2em", borderRadius: "12px",
        textAlign: "center", margin: "1.5em 0",
      }}>
        <div style={{ fontWeight: 700, fontSize: "1.2em", marginBottom: "0.5em" }}>
          Conclusion
        </div>
        <div ref={contentRef} />
      </div>
    ),
  }
);
