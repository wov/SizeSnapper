"use client";

import { useEffect, useState } from "react";
import { imageToBlob, type ImageItem } from "@/lib/db";

interface ImageLayerProps {
  image: ImageItem;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onUpdateTransform: (updates: Partial<Pick<ImageItem, "x" | "y" | "scale">>) => void;
}

export default function ImageLayer({
  image,
  isSelected,
  onSelect,
  onDelete,
  onUpdateTransform,
}: ImageLayerProps) {
  const [thumbUrl, setThumbUrl] = useState<string | null>(null);

  useEffect(() => {
    const url = URL.createObjectURL(imageToBlob(image));
    setThumbUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [image.data, image.mimeType]);

  const scalePercent = Math.round(image.scale * 100);

  return (
    <div
      className={`flex flex-col gap-2 rounded-lg border p-2 transition-colors ${
        isSelected
          ? "border-blue-500 bg-blue-50 dark:bg-blue-950"
          : "border-zinc-200 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
      }`}
    >
      {/* Top row: thumbnail + name + delete */}
      <div className="flex min-w-0 items-center gap-3">
        <button
          onClick={onSelect}
          className="flex min-w-0 flex-1 items-center gap-3 text-left"
        >
          {thumbUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={thumbUrl}
              alt={image.fileName}
              className="h-10 w-10 shrink-0 rounded object-cover"
            />
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-zinc-800 dark:text-zinc-200">
              {image.fileName}
            </p>
            <p className="text-xs text-zinc-400">
              x:{image.x} y:{image.y}
            </p>
          </div>
        </button>
        <button
          onClick={onDelete}
          className="shrink-0 rounded p-1 text-zinc-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950"
          title="Remove image"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        </button>
      </div>

      {/* Scale controls: shown when selected */}
      {isSelected && (
        <div className="flex items-center gap-2">
          <button
            onClick={() =>
              onUpdateTransform({ scale: Math.max(0.01, image.scale - 0.01) })
            }
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-zinc-200 text-xs font-bold text-zinc-600 hover:bg-zinc-300 dark:bg-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-600"
          >
            -
          </button>
          <input
            type="range"
            min="1"
            max="500"
            value={scalePercent}
            onChange={(e) =>
              onUpdateTransform({ scale: parseInt(e.target.value, 10) / 100 })
            }
            className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-zinc-300 accent-blue-600 dark:bg-zinc-600"
          />
          <button
            onClick={() =>
              onUpdateTransform({ scale: Math.min(5, image.scale + 0.01) })
            }
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-zinc-200 text-xs font-bold text-zinc-600 hover:bg-zinc-300 dark:bg-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-600"
          >
            +
          </button>
          <span className="w-10 shrink-0 text-right text-xs tabular-nums text-zinc-500">
            {scalePercent}%
          </span>
        </div>
      )}
    </div>
  );
}
