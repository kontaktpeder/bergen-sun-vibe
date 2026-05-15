import type { SunStatus, CrowdLevel } from "@/lib/contribution-types";

export type PendingPayload =
  | { type: "sun"; status: SunStatus }
  | { type: "crowd"; level: CrowdLevel }
  | { type: "beer"; price: number; isConfirm: boolean }
  | { type: "photo"; file: File };

export function pendingActionLine(payload: PendingPayload): { emoji: string; label: string } {
  switch (payload.type) {
    case "sun":
      return { emoji: "☀️", label: "Solrapport delt" };
    case "crowd":
      return { emoji: "👥", label: "Stemning delt" };
    case "beer":
      return { emoji: "🍺", label: "Ølpris delt" };
    case "photo":
      return { emoji: "📸", label: "Bilde delt" };
  }
}
