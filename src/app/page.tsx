"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useProjects } from "@/hooks/useProjects";
import { getImagesByProject } from "@/lib/db";
import ProjectCard from "@/components/ProjectCard";
import CreateProjectDialog from "@/components/CreateProjectDialog";

export default function Home() {
  const router = useRouter();
  const { projects, loading, createProject, removeProject } = useProjects();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [imageCounts, setImageCounts] = useState<Record<string, number>>({});

  const loadCounts = useCallback(async () => {
    const counts: Record<string, number> = {};
    for (const p of projects) {
      const imgs = await getImagesByProject(p.id);
      counts[p.id] = imgs.length;
    }
    setImageCounts(counts);
  }, [projects]);

  useEffect(() => {
    if (projects.length > 0) {
      loadCounts();
    }
  }, [projects, loadCounts]);

  const handleCreate = async (
    name: string,
    width: number,
    height: number
  ) => {
    const project = await createProject(name, width, height);
    setDialogOpen(false);
    router.push(`/project/${project.id}`);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Delete this project and all its images?")) {
      await removeProject(id);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
            SizeSnapper
          </h1>
          <button
            onClick={() => setDialogOpen(true)}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            New Project
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8">
        {loading ? (
          <p className="text-center text-zinc-500">Loading...</p>
        ) : projects.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-20 text-center">
            <p className="text-lg text-zinc-500 dark:text-zinc-400">
              No projects yet
            </p>
            <button
              onClick={() => setDialogOpen(true)}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Create your first project
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                imageCount={imageCounts[project.id] ?? 0}
                onClick={() => router.push(`/project/${project.id}`)}
                onDelete={(e) => {
                  e.stopPropagation();
                  handleDelete(project.id);
                }}
              />
            ))}
          </div>
        )}
      </main>

      <CreateProjectDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onCreate={handleCreate}
      />
    </div>
  );
}
