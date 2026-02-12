"use client";

import { use, useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getProject, type ImageItem, type Project } from "@/lib/db";
import { useImages } from "@/hooks/useImages";
import { renderImageToCanvas } from "@/lib/canvas";
import CanvasEditor from "@/components/CanvasEditor";
import ImageLayer from "@/components/ImageLayer";
import ExportButton from "@/components/ExportButton";

export default function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { images, addImages, updateImageTransform, removeImage } =
    useImages(id);

  useEffect(() => {
    getProject(id).then((p) => {
      if (p) setProject(p);
      else setNotFound(true);
    });
  }, [id]);

  const handleUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;
      await addImages(Array.from(files));
      e.target.value = "";
    },
    [addImages]
  );

  const handleExportSingle = useCallback(
    async (image: ImageItem) => {
      if (!project) return;
      const blob = await renderImageToCanvas(
        project.canvasWidth,
        project.canvasHeight,
        image
      );
      const name = image.fileName.replace(/\.[^.]+$/, "") + ".png";
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = name;
      a.click();
      URL.revokeObjectURL(url);
    },
    [project]
  );

  const handleUpdateTransform = useCallback(
    (
      imageId: string,
      updates: Partial<{ x: number; y: number; scale: number }>
    ) => {
      updateImageTransform(imageId, updates);
    },
    [updateImageTransform]
  );

  if (notFound) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-zinc-500">Project not found</p>
          <button
            onClick={() => router.push("/")}
            className="mt-4 text-sm text-blue-600 hover:underline"
          >
            Go home
          </button>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-zinc-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col">
      {/* Top bar */}
      <header className="flex items-center justify-between border-b border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/")}
            className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            title="Back to projects"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m15 18-6-6 6-6" />
            </svg>
          </button>
          <div>
            <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              {project.name}
            </h1>
            <p className="text-xs text-zinc-500">
              {project.canvasWidth} &times; {project.canvasHeight}px
            </p>
          </div>
        </div>
        <ExportButton
          canvasWidth={project.canvasWidth}
          canvasHeight={project.canvasHeight}
          images={images}
          projectName={project.name}
        />
      </header>

      {/* Main area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Canvas area */}
        <CanvasEditor
          canvasWidth={project.canvasWidth}
          canvasHeight={project.canvasHeight}
          images={images}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onUpdateTransform={handleUpdateTransform}
        />

        {/* Sidebar */}
        <aside className="flex w-72 flex-col border-l border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
            <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
              Images ({images.length})
            </h2>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
            >
              Upload
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleUpload}
              className="hidden"
            />
          </div>

          <div className="flex-1 overflow-y-auto p-3">
            {images.length === 0 ? (
              <p className="py-8 text-center text-sm text-zinc-400">
                Upload images to get started
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {images.map((image) => (
                  <ImageLayer
                    key={image.id}
                    image={image}
                    isSelected={selectedId === image.id}
                    onSelect={() => setSelectedId(image.id)}
                    onExport={() => handleExportSingle(image)}
                    onDelete={() => {
                      if (selectedId === image.id) setSelectedId(null);
                      removeImage(image.id);
                    }}
                    onUpdateTransform={(updates) =>
                      handleUpdateTransform(image.id, updates)
                    }
                  />
                ))}
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
