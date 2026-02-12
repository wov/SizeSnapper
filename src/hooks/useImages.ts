"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  getImagesByProject,
  addImage as dbAddImage,
  patchImageTransform as dbPatchTransform,
  deleteImage as dbDeleteImage,
  type ImageItem,
} from "@/lib/db";
import { generateId } from "@/lib/utils";

export function useImages(projectId: string) {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const saveTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const load = useCallback(async () => {
    const data = await getImagesByProject(projectId);
    setImages(data);
    setLoading(false);
  }, [projectId]);

  useEffect(() => {
    load();
  }, [load]);

  // Cleanup timers on unmount
  useEffect(() => {
    const timers = saveTimers.current;
    return () => {
      for (const t of timers.values()) clearTimeout(t);
      timers.clear();
    };
  }, []);

  const addImages = useCallback(
    async (files: File[]) => {
      const currentImages = await getImagesByProject(projectId);
      let order = currentImages.length;
      for (const file of files) {
        const data = await file.arrayBuffer();
        const image: ImageItem = {
          id: generateId(),
          projectId,
          fileName: file.name,
          data,
          mimeType: file.type,
          x: 0,
          y: 0,
          scale: 1,
          order: order++,
          createdAt: Date.now(),
        };
        await dbAddImage(image);
      }
      await load();
    },
    [projectId, load]
  );

  const updateImageTransform = useCallback(
    (id: string, updates: Partial<Pick<ImageItem, "x" | "y" | "scale">>) => {
      // Update local state immediately for responsive UI
      setImages((prev) =>
        prev.map((i) => (i.id === id ? { ...i, ...updates } : i))
      );

      // Debounce the DB write — reads fresh record from IndexedDB to preserve blob
      const existing = saveTimers.current.get(id);
      if (existing) clearTimeout(existing);
      saveTimers.current.set(
        id,
        setTimeout(() => {
          dbPatchTransform(id, updates);
          saveTimers.current.delete(id);
        }, 200)
      );
    },
    []
  );

  const removeImage = useCallback(
    async (id: string) => {
      await dbDeleteImage(id);
      await load();
    },
    [load]
  );

  return { images, loading, addImages, updateImageTransform, removeImage, reload: load };
}
