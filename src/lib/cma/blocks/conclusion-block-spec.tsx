// BlockNote custom block: Conclusion section
// Dark gradient container for closing summary content

import { createReactBlockSpec } from "@blocknote/react";
import { defaultProps } from "@blocknote/core";

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
        color: "white",
        padding: "1.5em 2em",
        borderRadius: "12px",
        textAlign: "center",
        margin: "1.5em 0",
      }}>
        <div style={{ fontWeight: 700, fontSize: "1.2em", marginBottom: "0.5em" }}>
          Conclusion
        </div>
        <div ref={contentRef} />
      </div>
    ),
  }
);
