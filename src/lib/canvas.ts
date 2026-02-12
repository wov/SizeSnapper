import { imageToBlob, type ImageItem } from "./db";

export function loadImage(blob: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(img.src);
      resolve(img);
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(blob);
  });
}

export function loadImageItem(item: ImageItem): Promise<HTMLImageElement> {
  return loadImage(imageToBlob(item));
}

export async function renderImageToCanvas(
  canvasWidth: number,
  canvasHeight: number,
  imageItem: ImageItem
): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  const ctx = canvas.getContext("2d")!;

  ctx.clearRect(0, 0, canvasWidth, canvasHeight);

  const img = await loadImageItem(imageItem);
  const w = img.naturalWidth * imageItem.scale;
  const h = img.naturalHeight * imageItem.scale;
  ctx.drawImage(img, imageItem.x, imageItem.y, w, h);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Failed to export canvas"));
    }, "image/png");
  });
}

export async function exportAllImages(
  canvasWidth: number,
  canvasHeight: number,
  images: ImageItem[]
): Promise<{ fileName: string; blob: Blob }[]> {
  const results: { fileName: string; blob: Blob }[] = [];
  for (const image of images) {
    const blob = await renderImageToCanvas(canvasWidth, canvasHeight, image);
    const name = image.fileName.replace(/\.[^.]+$/, "") + ".png";
    results.push({ fileName: name, blob });
  }
  return results;
}
