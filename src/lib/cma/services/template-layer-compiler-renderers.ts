// Per-layer-type HTML renderers for the compiler.
// Each render* function returns a single absolute-positioned <div> that
// represents one layer. Callers are responsible for sorting by zIndex and
// filtering invisible layers before calling these.

import type {
  Layer,
  TextLayer,
  ImageLayer,
  RectLayer,
} from "../types/image-template-layer-types";
import { escapeHtml, textToHtml, escapeKeepTokens } from "./template-layer-compiler-escape";

// CSS fragment every layer shares — position, size, rotation, opacity, z-index.
function baseStyle(l: Layer): string {
  return [
    "position:absolute",
    `left:${l.x}px`,
    `top:${l.y}px`,
    `width:${l.width}px`,
    `height:${l.height}px`,
    `transform:rotate(${l.rotation}deg)`,
    "transform-origin:center center",
    `opacity:${l.opacity}`,
    `z-index:${l.zIndex}`,
  ].join(";");
}

function borderCss(
  border: { width: number; color: string } | undefined
): string {
  if (!border || border.width <= 0) return "";
  return `;border:${border.width}px solid ${escapeHtml(border.color)}`;
}

function shadowCss(
  shadow: { x: number; y: number; blur: number; color: string } | undefined,
  prop: "text-shadow" | "box-shadow"
): string {
  if (!shadow) return "";
  const val = `${shadow.x}px ${shadow.y}px ${shadow.blur}px ${escapeHtml(shadow.color)}`;
  return `;${prop}:${val}`;
}

// ── Text layer ───────────────────────────────────────────────────────

export function renderText(l: TextLayer): string {
  const align = l.textAlign;
  // Flex vertical centering so users see a text box that behaves like APITemplate.io
  const flexAlign =
    align === "center" ? "center" : align === "right" ? "flex-end" : "flex-start";
  const style = [
    baseStyle(l),
    "display:flex",
    "align-items:center",
    `justify-content:${flexAlign}`,
    `font-family:'${escapeHtml(l.fontFamily)}',sans-serif`,
    `font-size:${l.fontSize}px`,
    `font-weight:${l.fontWeight}`,
    `color:${escapeKeepTokens(l.color)}`,
    `text-align:${align}`,
    `line-height:${l.lineHeight}`,
    `letter-spacing:${l.letterSpacing}px`,
    "white-space:pre-wrap",
    "word-break:break-word",
    "overflow:hidden",
  ].join(";") + shadowCss(l.textShadow, "text-shadow");
  return `<div style="${style}"><span style="width:100%">${textToHtml(l.text)}</span></div>`;
}

// ── Image layer ──────────────────────────────────────────────────────

export function renderImage(l: ImageLayer): string {
  const objectFit = l.fitMode === "fill" ? "fill" : l.fitMode;
  const radiusCss = l.borderRadius ? `;border-radius:${l.borderRadius}px` : "";
  const style =
    baseStyle(l) +
    ";overflow:hidden" +
    radiusCss +
    borderCss(l.border);
  const imgStyle = [
    "width:100%",
    "height:100%",
    `object-fit:${objectFit}`,
    "display:block",
  ].join(";");
  // src may contain {{token}} — keep it untouched, Handlebars substitutes later.
  // Non-token chars are still escaped via escapeKeepTokens to block attribute breakout.
  const safeSrc = escapeKeepTokens(l.src);
  return `<div style="${style}"><img src="${safeSrc}" style="${imgStyle}" alt=""></div>`;
}

// ── Rect layer ───────────────────────────────────────────────────────

export function renderRect(l: RectLayer): string {
  const radiusCss = l.borderRadius ? `;border-radius:${l.borderRadius}px` : "";
  const style =
    baseStyle(l) +
    `;background-color:${escapeKeepTokens(l.fillColor)}` +
    radiusCss +
    borderCss(l.border) +
    shadowCss(l.shadow, "box-shadow");
  return `<div style="${style}"></div>`;
}

// Dispatch helper used by the main compiler.
export function renderLayer(l: Layer): string {
  switch (l.type) {
    case "text":
      return renderText(l);
    case "image":
      return renderImage(l);
    case "rect":
      return renderRect(l);
  }
}
