"use client";

import { useCallback, useEffect, useState } from "react";
import {
  getProjects,
  createProject as dbCreateProject,
  deleteProject as dbDeleteProject,
  type Project,
} from "@/lib/db";
import { generateId } from "@/lib/utils";

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const data = await getProjects();
    setProjects(data.sort((a, b) => b.updatedAt - a.updatedAt));
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const createProject = useCallback(
    async (name: string, canvasWidth: number, canvasHeight: number) => {
      const now = Date.now();
      const project: Project = {
        id: generateId(),
        name,
        canvasWidth,
        canvasHeight,
        createdAt: now,
        updatedAt: now,
      };
      await dbCreateProject(project);
      await load();
      return project;
    },
    [load]
  );

  const removeProject = useCallback(
    async (id: string) => {
      await dbDeleteProject(id);
      await load();
    },
    [load]
  );

  return { projects, loading, createProject, removeProject, reload: load };
}
