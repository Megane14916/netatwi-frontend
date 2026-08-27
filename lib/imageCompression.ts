const MEBIBYTE = 1024 * 1024;

export const IMAGE_COMPRESSION_THRESHOLD_BYTES = 4 * MEBIBYTE;

const MAX_IMAGE_DIMENSION = 2048;
const OUTPUT_TYPE = "image/webp";
const QUALITY_STEPS = [0.86, 0.78, 0.7, 0.62, 0.54, 0.46];
const COMPRESSIBLE_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const loadImage = (file: File): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error(`画像を読み込めませんでした: ${file.name}`));
    };
    image.src = objectUrl;
  });

const canvasToBlob = (canvas: HTMLCanvasElement, quality: number) =>
  new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error("画像の圧縮に失敗しました"));
        }
      },
      OUTPUT_TYPE,
      quality,
    );
  });

const getWebpFilename = (filename: string) => {
  const basename = filename.replace(/\.[^.]+$/, "");
  return `${basename || "image"}.webp`;
};

/**
 * 容量の大きい静止画を、最大辺2048pxのWebPへ圧縮する。
 * GIFなどの非対象形式と4 MiB以下の画像は、画質を変えずそのまま返す。
 */
export const compressImage = async (file: File): Promise<File> => {
  if (
    file.size <= IMAGE_COMPRESSION_THRESHOLD_BYTES ||
    !COMPRESSIBLE_IMAGE_TYPES.has(file.type)
  ) {
    return file;
  }

  const image = await loadImage(file);
  const scale = Math.min(
    1,
    MAX_IMAGE_DIMENSION / Math.max(image.naturalWidth, image.naturalHeight),
  );
  const width = Math.max(1, Math.round(image.naturalWidth * scale));
  const height = Math.max(1, Math.round(image.naturalHeight * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("このブラウザでは画像を圧縮できません");
  }
  context.drawImage(image, 0, 0, width, height);

  let compressed = await canvasToBlob(canvas, QUALITY_STEPS[0]);
  for (const quality of QUALITY_STEPS.slice(1)) {
    if (compressed.size <= IMAGE_COMPRESSION_THRESHOLD_BYTES) break;
    compressed = await canvasToBlob(canvas, quality);
  }

  if (compressed.size >= file.size) {
    return file;
  }

  return new File([compressed], getWebpFilename(file.name), {
    type: OUTPUT_TYPE,
    lastModified: file.lastModified,
  });
};
