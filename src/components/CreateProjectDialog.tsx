"use client";

import { useState, useRef, useEffect } from "react";

interface CreateProjectDialogProps {
  open: boolean;
  onClose: () => void;
  onCreate: (name: string, width: number, height: number) => void;
}

export default function CreateProjectDialog({
  open,
  onClose,
  onCreate,
}: CreateProjectDialogProps) {
  const [name, setName] = useState("");
  const [width, setWidth] = useState("1080");
  const [height, setHeight] = useState("1080");
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setName("");
      setWidth("1080");
      setHeight("1080");
      setTimeout(() => nameRef.current?.focus(), 50);
    }
  }, [open]);

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const w = parseInt(width, 10);
    const h = parseInt(height, 10);
    if (!name.trim() || !w || !h || w < 1 || h < 1) return;
    onCreate(name.trim(), w, h);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
        className="flex w-full max-w-md flex-col gap-4 rounded-2xl bg-white p-6 shadow-xl dark:bg-zinc-900"
      >
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
          New Project
        </h2>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Project Name
          </span>
          <input
            ref={nameRef}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="My Project"
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            required
          />
        </label>

        <div className="flex gap-3">
          <label className="flex flex-1 flex-col gap-1">
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Width (px)
            </span>
            <input
              type="number"
              value={width}
              onChange={(e) => setWidth(e.target.value)}
              min="1"
              className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              required
            />
          </label>
          <label className="flex flex-1 flex-col gap-1">
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Height (px)
            </span>
            <input
              type="number"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              min="1"
              className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              required
            />
          </label>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Create
          </button>
        </div>
      </form>
    </div>
  );
}
