import { openDB, type DBSchema, type IDBPDatabase } from "idb";

export interface Project {
  id: string;
  name: string;
  canvasWidth: number;
  canvasHeight: number;
  createdAt: number;
  updatedAt: number;
}

export interface ImageItem {
  id: string;
  projectId: string;
  fileName: string;
  data: ArrayBuffer;
  mimeType: string;
  x: number;
  y: number;
  scale: number;
  order: number;
  createdAt: number;
}

interface SizeSnapperDB extends DBSchema {
  projects: {
    key: string;
    value: Project;
  };
  images: {
    key: string;
    value: ImageItem;
    indexes: { "by-project": string };
  };
}

const DB_NAME = "sizesnapper";
const DB_VERSION = 2;

let dbPromise: Promise<IDBPDatabase<SizeSnapperDB>> | null = null;

function getDB(): Promise<IDBPDatabase<SizeSnapperDB>> {
  if (!dbPromise) {
    dbPromise = openDB<SizeSnapperDB>(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion) {
        if (oldVersion < 1) {
          db.createObjectStore("projects", { keyPath: "id" });
          const imageStore = db.createObjectStore("images", { keyPath: "id" });
          imageStore.createIndex("by-project", "projectId");
        }
        if (oldVersion === 1) {
          // v1 stored Blob — wipe images store and recreate for v2 ArrayBuffer format
          db.deleteObjectStore("images");
          const imageStore = db.createObjectStore("images", { keyPath: "id" });
          imageStore.createIndex("by-project", "projectId");
        }
      },
    });
  }
  return dbPromise;
}

// Project CRUD
export async function getProjects(): Promise<Project[]> {
  const db = await getDB();
  return db.getAll("projects");
}

export async function getProject(id: string): Promise<Project | undefined> {
  const db = await getDB();
  return db.get("projects", id);
}

export async function createProject(project: Project): Promise<void> {
  const db = await getDB();
  await db.put("projects", project);
}

export async function updateProject(project: Project): Promise<void> {
  const db = await getDB();
  await db.put("projects", project);
}

export async function deleteProject(id: string): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(["projects", "images"], "readwrite");
  await tx.objectStore("projects").delete(id);
  const imageStore = tx.objectStore("images");
  const images = await imageStore.index("by-project").getAllKeys(id);
  for (const key of images) {
    await imageStore.delete(key);
  }
  await tx.done;
}

// Image CRUD
export async function getImagesByProject(
  projectId: string
): Promise<ImageItem[]> {
  const db = await getDB();
  const images = await db.getAllFromIndex("images", "by-project", projectId);
  return images.sort((a, b) => a.order - b.order);
}

export async function addImage(image: ImageItem): Promise<void> {
  const db = await getDB();
  await db.put("images", image);
}

export async function patchImageTransform(
  id: string,
  updates: Partial<Pick<ImageItem, "x" | "y" | "scale">>
): Promise<void> {
  const db = await getDB();
  const image = await db.get("images", id);
  if (!image) return;
  if (updates.x !== undefined) image.x = updates.x;
  if (updates.y !== undefined) image.y = updates.y;
  if (updates.scale !== undefined) image.scale = updates.scale;
  await db.put("images", image);
}

export async function deleteImage(id: string): Promise<void> {
  const db = await getDB();
  await db.delete("images", id);
}

// Helper: convert ImageItem's ArrayBuffer to Blob for rendering
export function imageToBlob(image: ImageItem): Blob {
  return new Blob([image.data], { type: image.mimeType });
}
