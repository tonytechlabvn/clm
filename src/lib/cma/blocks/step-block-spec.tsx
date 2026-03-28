// BlockNote custom block: Step with numbered circle badge
// Badge is an editable number input styled as a gradient circle

import { createReactBlockSpec } from "@blocknote/react";
import { defaultProps } from "@blocknote/core";

export const StepBlock = createReactBlockSpec(
  {
    type: "step" as const,
    propSchema: {
      ...defaultProps,
      stepNumber: { default: 1 },
    },
    content: "inline",
  },
  {
    render: ({ block, editor, contentRef }) => (
      <div style={{ display: "flex", alignItems: "flex-start", gap: "1em", margin: "1em 0" }}>
        <input
          type="number"
          value={block.props.stepNumber}
          onChange={(e) => editor.updateBlock(block, { props: { stepNumber: Number(e.target.value) || 1 } })}
          min={1}
          max={99}
          contentEditable={false}
          style={{
            width: 36, height: 36, borderRadius: "50%",
            background: "linear-gradient(135deg, #3182ce, #2b6cb0)",
            color: "white", textAlign: "center", fontWeight: 700,
            border: "none", fontSize: "0.95em", flexShrink: 0,
            cursor: "pointer",
          }}
        />
        <div ref={contentRef} style={{ flex: 1 }} />
      </div>
    ),
  }
);
