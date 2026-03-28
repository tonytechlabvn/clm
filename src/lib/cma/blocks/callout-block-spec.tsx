// BlockNote custom block: Callout (info/warning/success)
// Renders colored highlight box with icon, variant selector, and editable title

import { createReactBlockSpec } from "@blocknote/react";
import { defaultProps } from "@blocknote/core";

const VARIANT_STYLES: Record<string, { bg: string; border: string; icon: string }> = {
  info: { bg: "#ebf8ff", border: "#3182ce", icon: "\u{1F4A1}" },
  warning: { bg: "#fffbeb", border: "#d97706", icon: "\u26A0\uFE0F" },
  success: { bg: "#f0fff4", border: "#38a169", icon: "\u2705" },
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
          background: v.bg,
          borderLeft: `4px solid ${v.border}`,
          borderRadius: "10px",
          padding: "1em 1.2em",
          margin: "1em 0",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5em", marginBottom: "0.4em" }}>
            <select
              value={block.props.variant}
              onChange={(e) => editor.updateBlock(block, { props: { variant: e.target.value as any } })}
              style={{ fontSize: "0.8em", padding: "2px 4px", borderRadius: 4, border: "1px solid #ccc" }}
              contentEditable={false}
            >
              <option value="info">{"\u{1F4A1}"} Info</option>
              <option value="warning">{"\u26A0\uFE0F"} Warning</option>
              <option value="success">{"\u2705"} Success</option>
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
