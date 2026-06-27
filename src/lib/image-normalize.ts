const BROWSER_SAFE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () =>
      reject(
        new Error(
          "Kon deze foto niet lezen. Probeer een JPG/PNG of maak een nieuwe foto met Camera.",
        ),
      );
    img.src = url;
  });
}

/** Zet HEIC/HEIF (iPhone bibliotheek) om naar JPEG voor Vision AI APIs. */
export async function normalizeImageForScan(file: File): Promise<File> {
  const mimeType = (file.type || "").toLowerCase();

  if (BROWSER_SAFE_TYPES.has(mimeType)) {
    return file;
  }

  const objectUrl = URL.createObjectURL(file);

  try {
    const img = await loadImage(objectUrl);
    const maxEdge = 4096;
    let { naturalWidth: width, naturalHeight: height } = img;

    if (width > maxEdge || height > maxEdge) {
      const scale = maxEdge / Math.max(width, height);
      width = Math.round(width * scale);
      height = Math.round(height * scale);
    }

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Kon afbeelding niet verwerken in de browser.");
    }

    ctx.drawImage(img, 0, 0, width, height);

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (result) =>
          result
            ? resolve(result)
            : reject(new Error("Kon foto niet omzetten naar JPEG.")),
        "image/jpeg",
        0.92,
      );
    });

    const baseName = file.name.replace(/\.[^.]+$/, "") || "scan";
    return new File([blob], `${baseName}.jpg`, { type: "image/jpeg" });
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
