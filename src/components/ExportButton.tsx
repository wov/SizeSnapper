"use client";

import { useState } from "react";
import type { ImageItem } from "@/lib/db";
import { exportAllImages } from "@/lib/canvas";
import JSZip from "jszip";

interface ExportButtonProps {
  canvasWidth: number;
  canvasHeight: number;
  images: ImageItem[];
  projectName: string;
}

export default function ExportButton({
  canvasWidth,
  canvasHeight,
  images,
  projectName,
}: ExportButtonProps) {
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    if (images.length === 0) return;
    setExporting(true);

    try {
      const results = await exportAllImages(canvasWidth, canvasHeight, images);

      if (results.length === 1) {
        const url = URL.createObjectURL(results[0].blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = results[0].fileName;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        const zip = new JSZip();
        for (const { fileName, blob } of results) {
          zip.file(fileName, blob);
        }
        const zipBlob = await zip.generateAsync({ type: "blob" });
        const url = URL.createObjectURL(zipBlob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${projectName}.zip`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error("Export failed:", err);
      alert("Export failed. See console for details.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={exporting || images.length === 0}
      className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {exporting ? "Exporting..." : "Export All"}
    </button>
  );
}
