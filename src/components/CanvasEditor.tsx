"use client";

import { useRef, useEffect, useState, useCallback, useMemo } from "react";
import type { ImageItem } from "@/lib/db";
import { loadImageItem } from "@/lib/canvas";

// Extra space around the project canvas to show image overflow
const PADDING = 200;

interface CanvasEditorProps {
  canvasWidth: number;
  canvasHeight: number;
  images: ImageItem[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onUpdateTransform: (
    id: string,
    updates: Partial<Pick<ImageItem, "x" | "y" | "scale">>
  ) => void;
}

export default function CanvasEditor({
  canvasWidth,
  canvasHeight,
  images,
  selectedId,
  onSelect,
  onUpdateTransform,
}: CanvasEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [displayScale, setDisplayScale] = useState(1);
  const [imgElements, setImgElements] = useState<Map<string, HTMLImageElement>>(
    new Map()
  );
  const dragRef = useRef<{
    id: string;
    startX: number;
    startY: number;
    origX: number;
    origY: number;
  } | null>(null);

  const fullW = canvasWidth + PADDING * 2;
  const fullH = canvasHeight + PADDING * 2;

  useEffect(() => {
    const updateScale = () => {
      const container = containerRef.current;
      if (!container) return;
      const maxW = container.clientWidth - 32;
      const maxH = container.clientHeight - 32;
      const scale = Math.min(maxW / fullW, maxH / fullH, 1);
      setDisplayScale(scale);
    };
    updateScale();
    window.addEventListener("resize", updateScale);
    return () => window.removeEventListener("resize", updateScale);
  }, [fullW, fullH]);

  const imageIds = useMemo(
    () => images.map((i) => i.id).join(","),
    [images]
  );

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const entries = new Map<string, HTMLImageElement>();
      for (const item of images) {
        try {
          const img = await loadImageItem(item);
          if (cancelled) return;
          entries.set(item.id, img);
        } catch {
          // skip
        }
      }
      if (!cancelled) setImgElements(entries);
    }
    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageIds]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const px = PADDING;
    const py = PADDING;

    ctx.clearRect(0, 0, fullW, fullH);

    // Outer area: dark background
    ctx.fillStyle = "#d4d4d8";
    ctx.fillRect(0, 0, fullW, fullH);

    // Project canvas area: checkerboard (clipped to exact canvas size)
    ctx.save();
    ctx.beginPath();
    ctx.rect(px, py, canvasWidth, canvasHeight);
    ctx.clip();
    const gridSize = 20;
    for (let y = 0; y < canvasHeight; y += gridSize) {
      for (let x = 0; x < canvasWidth; x += gridSize) {
        const isLight =
          (Math.floor(x / gridSize) + Math.floor(y / gridSize)) % 2 === 0;
        ctx.fillStyle = isLight ? "#f0f0f0" : "#e0e0e0";
        ctx.fillRect(px + x, py + y, gridSize, gridSize);
      }
    }
    ctx.restore();

    // Helper: draw a single image at its position (offset by padding)
    const drawImg = (item: ImageItem, img: HTMLImageElement) => {
      const w = img.naturalWidth * item.scale;
      const h = img.naturalHeight * item.scale;
      ctx.drawImage(img, px + item.x, py + item.y, w, h);
    };

    // Non-selected images: clipped to project canvas area
    ctx.save();
    ctx.beginPath();
    ctx.rect(px, py, canvasWidth, canvasHeight);
    ctx.clip();
    for (const item of images) {
      if (item.id === selectedId) continue;
      const img = imgElements.get(item.id);
      if (!img) continue;
      drawImg(item, img);
    }
    ctx.restore();

    // Selected image
    if (selectedId) {
      const selItem = images.find((i) => i.id === selectedId);
      const selImg = imgElements.get(selectedId);
      if (selItem && selImg) {
        const w = selImg.naturalWidth * selItem.scale;
        const h = selImg.naturalHeight * selItem.scale;
        const ix = px + selItem.x;
        const iy = py + selItem.y;

        // 1) Overflow at 35% — clipped to outside canvas rect
        ctx.save();
        ctx.globalAlpha = 0.35;
        ctx.beginPath();
        ctx.rect(0, 0, px, fullH);
        ctx.rect(px + canvasWidth, 0, PADDING, fullH);
        ctx.rect(px, 0, canvasWidth, py);
        ctx.rect(px, py + canvasHeight, canvasWidth, PADDING);
        ctx.clip();
        ctx.drawImage(selImg, ix, iy, w, h);
        ctx.restore();

        // 2) In-bounds at full opacity
        ctx.save();
        ctx.beginPath();
        ctx.rect(px, py, canvasWidth, canvasHeight);
        ctx.clip();
        ctx.drawImage(selImg, ix, iy, w, h);
        ctx.restore();

        // Selection border around full image
        ctx.strokeStyle = "#3b82f6";
        ctx.lineWidth = 2 / displayScale;
        ctx.setLineDash([6 / displayScale, 4 / displayScale]);
        ctx.strokeRect(ix, iy, w, h);
        ctx.setLineDash([]);
      }
    }

    // Project canvas border — drawn last so it covers any seam
    ctx.strokeStyle = "#a1a1aa";
    ctx.lineWidth = 1;
    ctx.setLineDash([]);
    ctx.strokeRect(px - 0.5, py - 0.5, canvasWidth + 1, canvasHeight + 1);
  }, [fullW, fullH, canvasWidth, canvasHeight, images, imgElements, selectedId, displayScale]);

  useEffect(() => {
    draw();
  }, [draw]);

  // Convert mouse coords to project canvas coords (subtract padding)
  const toCanvasCoords = useCallback(
    (e: React.MouseEvent) => {
      const canvas = canvasRef.current!;
      const rect = canvas.getBoundingClientRect();
      return {
        x: (e.clientX - rect.left) / displayScale - PADDING,
        y: (e.clientY - rect.top) / displayScale - PADDING,
      };
    },
    [displayScale]
  );

  // Hit-test in project coords
  const hitTest = useCallback(
    (canvasX: number, canvasY: number): string | null => {
      const test = (item: ImageItem) => {
        const img = imgElements.get(item.id);
        if (!img) return false;
        const w = img.naturalWidth * item.scale;
        const h = img.naturalHeight * item.scale;
        return (
          canvasX >= item.x &&
          canvasX <= item.x + w &&
          canvasY >= item.y &&
          canvasY <= item.y + h
        );
      };

      if (selectedId) {
        const sel = images.find((i) => i.id === selectedId);
        if (sel && test(sel)) return sel.id;
      }

      for (let i = images.length - 1; i >= 0; i--) {
        if (images[i].id === selectedId) continue;
        if (test(images[i])) return images[i].id;
      }
      return null;
    },
    [images, imgElements, selectedId]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      const { x, y } = toCanvasCoords(e);
      const hitId = hitTest(x, y);
      onSelect(hitId);

      if (hitId) {
        const item = images.find((i) => i.id === hitId);
        if (item) {
          dragRef.current = {
            id: hitId,
            startX: x,
            startY: y,
            origX: item.x,
            origY: item.y,
          };
        }
      }
    },
    [toCanvasCoords, hitTest, onSelect, images]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!dragRef.current) return;
      const { x, y } = toCanvasCoords(e);
      const dx = x - dragRef.current.startX;
      const dy = y - dragRef.current.startY;
      onUpdateTransform(dragRef.current.id, {
        x: Math.round(dragRef.current.origX + dx),
        y: Math.round(dragRef.current.origY + dy),
      });
    },
    [toCanvasCoords, onUpdateTransform]
  );

  const handleMouseUp = useCallback(() => {
    dragRef.current = null;
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!selectedId) return;
      const item = images.find((i) => i.id === selectedId);
      if (!item) return;
      let dx = 0;
      let dy = 0;
      switch (e.key) {
        case "ArrowUp":    dy = -1; break;
        case "ArrowDown":  dy = 1;  break;
        case "ArrowLeft":  dx = -1; break;
        case "ArrowRight": dx = 1;  break;
        default: return;
      }
      e.preventDefault();
      onUpdateTransform(selectedId, { x: item.x + dx, y: item.y + dy });
    },
    [selectedId, images, onUpdateTransform]
  );

  return (
    <div
      ref={containerRef}
      className="flex flex-1 items-center justify-center overflow-hidden bg-zinc-200 dark:bg-zinc-800"
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      <canvas
        ref={canvasRef}
        width={fullW}
        height={fullH}
        style={{
          width: fullW * displayScale,
          height: fullH * displayScale,
          cursor: dragRef.current ? "grabbing" : "default",
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      />
    </div>
  );
}
