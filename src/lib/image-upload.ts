const MAX_IMAGE_SIZE = 8 * 1024 * 1024;

function readAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("Could not read this image."));
    reader.onerror = () => reject(new Error("Could not read this image."));
    reader.readAsDataURL(file);
  });
}

export async function uploadImage(file: File, folder: "profiles" | "events" | "projects" | "members" | "partners", userId = "shared") {
  if (!file.type.startsWith("image/")) throw new Error("Please choose an image file.");
  if (file.size > MAX_IMAGE_SIZE) throw new Error("Images must be smaller than 8 MB.");

  // Keep uploads self-contained when Supabase Storage is not connected.
  // The profile editor stores this data URL with the rest of the profile and never displays it as text.
  return readAsDataUrl(file);
}

export function imageFallback(name: string) {
  return `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(name)}&backgroundColor=0ea5e9&fontFamily=Arial`;
}

export function isStorageImage(value: string | null | undefined) {
  return Boolean(value && (value.startsWith("http") || value.startsWith("data:image/")));
}

export const imageUploadHelp = "JPG, PNG, WEBP or GIF · max 8 MB";
