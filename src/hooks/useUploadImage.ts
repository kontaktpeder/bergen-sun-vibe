import { supabase } from "@/integrations/supabase/client";

export function useUploadImage() {
  async function upload(file: File, userId: string) {
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${userId}/${Date.now()}.${ext}`;

    const { error } = await supabase.storage
      .from("contribution-images")
      .upload(path, file, { cacheControl: "3600", upsert: false });
    if (error) throw error;

    const { data } = supabase.storage.from("contribution-images").getPublicUrl(path);
    return data.publicUrl;
  }

  return { upload };
}
