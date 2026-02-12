"use client";

import type { Project } from "@/lib/db";

interface ProjectCardProps {
  project: Project;
  imageCount: number;
  onClick: () => void;
  onDelete: (e: React.MouseEvent) => void;
}

export default function ProjectCard({
  project,
  imageCount,
  onClick,
  onDelete,
}: ProjectCardProps) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onClick(); }}
      className="group relative flex cursor-pointer flex-col gap-2 rounded-xl border border-zinc-200 bg-white p-5 text-left transition-shadow hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
    >
      <div className="flex items-start justify-between">
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          {project.name}
        </h3>
        <button
          onClick={onDelete}
          className="rounded p-1 text-zinc-400 opacity-0 transition-opacity hover:bg-red-50 hover:text-red-500 group-hover:opacity-100 dark:hover:bg-red-950"
          title="Delete project"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 6h18" />
            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
          </svg>
        </button>
      </div>
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        {project.canvasWidth} &times; {project.canvasHeight}px
      </p>
      <div className="flex items-center justify-between text-xs text-zinc-400 dark:text-zinc-500">
        <span>
          {imageCount} image{imageCount !== 1 ? "s" : ""}
        </span>
        <span>{new Date(project.updatedAt).toLocaleDateString()}</span>
      </div>
    </div>
  );
}
