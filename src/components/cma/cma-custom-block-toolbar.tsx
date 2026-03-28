// Slash menu items for TonyTechLab custom blocks
// Users type /callout, /step, /conclusion, /toc to insert custom blocks

import { insertOrUpdateBlockForSlashMenu } from "@blocknote/core";
import type { CmaBlockNoteEditor } from "@/lib/cma/blocks/custom-block-schema";

export function getCustomSlashMenuItems(editor: CmaBlockNoteEditor) {
  return [
    {
      title: "Callout (Info)",
      subtext: "Blue highlight box",
      group: "TonyTechLab",
      onItemClick: () => insertOrUpdateBlockForSlashMenu(editor, { type: "callout" as const, props: { variant: "info" } }),
      aliases: ["callout", "note", "info"],
    },
    {
      title: "Callout (Warning)",
      subtext: "Amber warning box",
      group: "TonyTechLab",
      onItemClick: () => insertOrUpdateBlockForSlashMenu(editor, { type: "callout" as const, props: { variant: "warning" } }),
      aliases: ["warning", "caution"],
    },
    {
      title: "Callout (Success)",
      subtext: "Green success box",
      group: "TonyTechLab",
      onItemClick: () => insertOrUpdateBlockForSlashMenu(editor, { type: "callout" as const, props: { variant: "success" } }),
      aliases: ["success", "tip"],
    },
    {
      title: "Step",
      subtext: "Numbered step with circle badge",
      group: "TonyTechLab",
      onItemClick: () => insertOrUpdateBlockForSlashMenu(editor, { type: "step" as const, props: { stepNumber: 1 } }),
      aliases: ["step", "number"],
    },
    {
      title: "Conclusion",
      subtext: "Dark gradient conclusion section",
      group: "TonyTechLab",
      onItemClick: () => insertOrUpdateBlockForSlashMenu(editor, { type: "conclusion" as const }),
      aliases: ["conclusion", "summary"],
    },
    {
      title: "Table of Contents",
      subtext: "Auto-generated from headings",
      group: "TonyTechLab",
      onItemClick: () => insertOrUpdateBlockForSlashMenu(editor, { type: "toc" as const }),
      aliases: ["toc", "contents"],
    },
  ];
}
