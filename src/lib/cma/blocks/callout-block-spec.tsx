// BlockNote custom block: Callout box (info/warning/success variants)
// Renders colored callout with variant selector, title input, and rich-text body

import { defaultProps } from "@blocknote/core";
import { createReactBlockSpec } from "@blocknote/react";

const VARIANT_STYLES: Record<string, { bg: string; border: string }> = {
  info: { bg: "#ebf8ff", border: "#3182ce" },
  warning: { bg: "#fffbeb", border: "#d97706" },
  success: { bg: "#f0fff4", border: "#38a169" },
};

export const CalloutBlock = createReactBlockSpec(
  {
    type: "callout" as const,
    propSchema: {
      ...defaultProps,
      variant: { default: "info", values: ["info", "warning", "success"] as const },
      title: { default: "" },
    },
    content: "inline",
  },
  {
    render: ({ block, editor, contentRef }) => {
      const v = VARIANT_STYLES[block.props.variant] || VARIANT_STYLES.info;
      return (
        <div style={{
          background: v.bg, borderLeft: `4px solid ${v.border}`,
          borderRadius: "10px", padding: "1em 1.2em", margin: "1em 0",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5em", marginBottom: "0.4em" }}>
            <select
              value={block.props.variant}
              onChange={(e) => editor.updateBlock(block, { props: { variant: e.target.value as "info" | "warning" | "success" } })}
              style={{ fontSize: "0.8em", padding: "2px 4px", borderRadius: 4, border: "1px solid #ccc" }}
              contentEditable={false}
            >
              <option value="info">Info</option>
              <option value="warning">Warning</option>
              <option value="success">Success</option>
            </select>
            <input
              type="text"
              value={block.props.title}
              onChange={(e) => editor.updateBlock(block, { props: { title: e.target.value } })}
              placeholder="Title (optional)"
              style={{ fontSize: "0.9em", flex: 1, border: "none", background: "transparent", fontWeight: 600 }}
              contentEditable={false}
            />
          </div>
          <div ref={contentRef} />
        </div>
      );
    },
  }
);
