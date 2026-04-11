"use client";
// Moveable overlay that attaches drag/resize/rotate handles to the selected
// layer. Extracted from editor-canvas-area.tsx to keep it under the 200-LOC
// file-size rule. Does NOT render anything when no layer is selected or the
// selected layer is locked.
//
// Moveable is dynamic-imported with ssr:false because it touches document on
// module load. The `zoom={1/zoom}` prop keeps resize handles visually crisp at
// any canvas zoom level.
//
// Undo history: continuous gestures (drag/resize/rotate) fire dozens of
// updateLayer calls per second. Without pausing zundo, each tick pushes a
// history entry and the undo stack saturates within ~1 second — worse, the
// pre-gesture state gets evicted past UNDO_LIMIT, so Ctrl+Z after a long drag
// rewinds to a random intermediate frame instead of the starting position.
// We pause on Start, let intermediate updates slip through untracked, then
// resume + commit one final updateLayer on End so the whole gesture becomes
// a single undoable step.

import dynamic from "next/dynamic";
import type { Layer } from "@/lib/cma/types/image-template-layer-types";
import { useEditorStore } from "@/lib/cma/editor/image-template-editor-store";

const Moveable = dynamic(() => import("react-moveable"), { ssr: false });

interface Props {
  target: HTMLElement | null;
  selectedLayer: Layer | null;
  zoom: number;
  guidelineElements: HTMLElement[];
}

// Snapshot the pre-gesture state so the End handler can re-apply it once
// BEFORE resuming zundo tracking. That way zundo sees the diff between
// pre-gesture and post-gesture as a single history step.
interface GestureSnapshot {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
}

function snapshotLayer(layer: Layer): GestureSnapshot {
  return {
    x: layer.x,
    y: layer.y,
    width: layer.width,
    height: layer.height,
    rotation: layer.rotation,
  };
}

export function CanvasMoveableOverlay({
  target,
  selectedLayer,
  zoom,
  guidelineElements,
}: Props) {
  const updateLayer = useEditorStore((s) => s.updateLayer);

  if (!target || !selectedLayer || selectedLayer.locked) return null;

  // Shared begin/end helpers for every continuous gesture.
  // Using temporal.pause/resume bypasses history pushes during the gesture;
  // on end we resume and commit one final updateLayer to push a single entry.
  let preGesture: GestureSnapshot | null = null;

  const beginGesture = () => {
    const current = useEditorStore.getState().layers.find(
      (l) => l.id === selectedLayer.id
    );
    if (!current) return;
    preGesture = snapshotLayer(current);
    useEditorStore.temporal.getState().pause();
  };

  const endGesture = () => {
    const temporal = useEditorStore.temporal.getState();
    temporal.resume();
    if (!preGesture) return;
    // Re-apply the pre-gesture snapshot momentarily then the current state
    // so zundo diffs pre→post as one history step. We take the current layer
    // values and re-issue them through updateLayer so a single history push
    // lands after resume().
    const final = useEditorStore.getState().layers.find(
      (l) => l.id === selectedLayer.id
    );
    if (!final) {
      preGesture = null;
      return;
    }
    // Replace the current state with the pre-gesture snapshot silently
    // (still paused conceptually) then resume + apply final values to emit
    // exactly one history entry.
    temporal.pause();
    updateLayer(selectedLayer.id, preGesture);
    temporal.resume();
    updateLayer(selectedLayer.id, {
      x: final.x,
      y: final.y,
      width: final.width,
      height: final.height,
      rotation: final.rotation,
    });
    preGesture = null;
  };

  return (
    <Moveable
      target={target}
      draggable
      resizable
      rotatable
      snappable
      origin={false}
      zoom={1 / zoom}
      throttleDrag={0}
      throttleResize={0}
      throttleRotate={0}
      elementGuidelines={guidelineElements}
      snapDirections={{
        top: true,
        right: true,
        bottom: true,
        left: true,
        center: true,
        middle: true,
      }}
      onDragStart={beginGesture}
      onDrag={({ left, top }: { left: number; top: number }) => {
        updateLayer(selectedLayer.id, {
          x: Math.round(left),
          y: Math.round(top),
        });
      }}
      onDragEnd={endGesture}
      onResizeStart={beginGesture}
      onResize={({
        width,
        height,
        drag,
      }: {
        width: number;
        height: number;
        drag: { left: number; top: number };
      }) => {
        updateLayer(selectedLayer.id, {
          width: Math.max(1, Math.round(width)),
          height: Math.max(1, Math.round(height)),
          x: Math.round(drag.left),
          y: Math.round(drag.top),
        });
      }}
      onResizeEnd={endGesture}
      onRotateStart={beginGesture}
      onRotate={({ rotate }: { rotate: number }) => {
        updateLayer(selectedLayer.id, {
          rotation: Math.round(rotate) % 360,
        });
      }}
      onRotateEnd={endGesture}
    />
  );
}
