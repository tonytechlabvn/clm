// Default-layer factories used by the left palette's "Add Text/Image/Rect"
// buttons. Each factory takes the canvas dimensions + current zIndex ceiling
// and returns a fully-valid Layer that can be fed straight into addLayer.
//
// Layers are centered on the canvas for predictability and assigned
// `zIndex: max + 1` so they land on top of existing content.

import { nanoid } from "nanoid";
import type {
  TextLayer,
  ImageLayer,
  RectLayer,
  Layer,
} from "@/lib/cma/types/image-template-layer-types";
import { DEFAULT_FONT } from "@/lib/cma/types/image-template-fonts";

export function nextZIndex(layers: Layer[]): number {
  if (layers.length === 0) return 0;
  return Math.max(...layers.map((l) => l.zIndex)) + 1;
}

function centered(width: number, height: number, w: number, h: number) {
  return {
    x: Math.round((width - w) / 2),
    y: Math.round((height - h) / 2),
    width: w,
    height: h,
  };
}

export function makeTextLayer(
  canvasWidth: number,
  canvasHeight: number,
  zIndex: number
): TextLayer {
  return {
    id: nanoid(),
    type: "text",
    ...centered(canvasWidth, canvasHeight, 400, 80),
    rotation: 0,
    zIndex,
    visible: true,
    locked: false,
    opacity: 1,
    text: "New text",
    fontFamily: DEFAULT_FONT,
    fontSize: 42,
    fontWeight: 700,
    color: "#111111",
    textAlign: "center",
    lineHeight: 1.2,
    letterSpacing: 0,
  };
}

export function makeImageLayer(
  canvasWidth: number,
  canvasHeight: number,
  zIndex: number
): ImageLayer {
  return {
    id: nanoid(),
    type: "image",
    ...centered(canvasWidth, canvasHeight, 480, 270),
    rotation: 0,
    zIndex,
    visible: true,
    locked: false,
    opacity: 1,
    src: "",
    fitMode: "cover",
  };
}

export function makeRectLayer(
  canvasWidth: number,
  canvasHeight: number,
  zIndex: number
): RectLayer {
  return {
    id: nanoid(),
    type: "rect",
    ...centered(canvasWidth, canvasHeight, 240, 160),
    rotation: 0,
    zIndex,
    visible: true,
    locked: false,
    opacity: 1,
    fillColor: "#e5e7eb",
  };
}
