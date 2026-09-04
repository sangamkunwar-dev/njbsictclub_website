import { supabase } from "@/integrations/supabase/client";

const MAX_IMAGE_SIZE = 8 * 1024 * 1024;

export async function uploadImage(file: File, folder: "profiles" | "events" | "projects" | "members" | "partners", userId = "shared") {
  if (!file.type.startsWith("image/")) throw new Error("Please choose an image file.");
  if (file.size > MAX_IMAGE_SIZE) throw new Error("Images must be smaller than 8 MB.");

  const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${folder}/${userId}/${crypto.randomUUID()}.${extension}`;
  const { error } = await supabase.storage.from("club-images").upload(path, file, { upsert: false, contentType: file.type, cacheControl: "3600" });
  if (error) throw error;
  const { data } = supabase.storage.from("club-images").getPublicUrl(path);
  return data.publicUrl;
}

export function imageFallback(name: string) {
  return `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(name)}&backgroundColor=0ea5e9&fontFamily=Arial`;
}

export function isStorageImage(value: string | null | undefined) {
  return Boolean(value && (value.startsWith("http") || value.startsWith("data:image/")));
}

export const imageUploadHelp = "JPG, PNG, WEBP or GIF · max 8 MB";
