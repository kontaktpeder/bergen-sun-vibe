import imageCompression from "browser-image-compression";
import { supabase } from "@/integrations/supabase/client";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_ORIGINAL_BYTES = 5 * 1024 * 1024; // 5 MB

export function useUploadImage() {
  async function upload(file: File, userId: string) {
    if (!ALLOWED_TYPES.includes(file.type)) {
      throw new Error("Ugyldig filtype. Bruk JPEG, PNG eller WebP.");
    }
    if (file.size > MAX_ORIGINAL_BYTES) {
      throw new Error("Bildet er for stort (maks 5 MB).");
    }

    let toUpload: File | Blob = file;
    try {
      toUpload = await imageCompression(file, {
        maxWidthOrHeight: 1280,
        maxSizeMB: 0.7,
        useWebWorker: true,
        initialQuality: 0.8,
      });
    } catch {
      // fall back to original if compression fails
      toUpload = file;
    }

    const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
    const path = `${userId}/${Date.now()}.${ext}`;

    const { error } = await supabase.storage
      .from("contribution-images")
      .upload(path, toUpload, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type,
      });
    if (error) throw error;

    const { data } = supabase.storage.from("contribution-images").getPublicUrl(path);
    return data.publicUrl;
  }

  return { upload };
}
