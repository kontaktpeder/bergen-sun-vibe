import * as React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * MobileSheet — bottom sheet that stays anchored above the on-screen keyboard.
 *
 * Why this exists: On iOS Safari, the default Radix Sheet is positioned with
 * `bottom: 0` against the *layout* viewport. When the soft keyboard appears,
 * the layout viewport doesn't shrink — so the sheet (and its inputs) end up
 * hidden behind the keyboard, and Safari then auto-scrolls the page, which
 * looks like the modal is "jumping".
 *
 * This component uses `window.visualViewport` to:
 *  - pin the panel to the visible viewport bottom (above the keyboard)
 *  - cap its height so the title + CTA always stay visible
 *  - keep the focused input above the fold
 */

type MobileSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  title?: React.ReactNode;
  className?: string;
};

export function MobileSheet({ open, onOpenChange, children, title, className }: MobileSheetProps) {
  const [kb, setKb] = React.useState(0); // px the keyboard occupies at the bottom
  const [vh, setVh] = React.useState<number | null>(null); // visible viewport height

  React.useEffect(() => {
    if (!open || typeof window === "undefined") return;
    const vv = window.visualViewport;
    if (!vv) return;

    const update = () => {
      const bottomInset = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
      setKb(bottomInset);
      setVh(vv.height);
    };
    update();
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
    };
  }, [open]);

  // When the sheet closes, blur any focused input so the keyboard collapses
  // before the next sheet opens (otherwise iOS keeps the keyboard up).
  React.useEffect(() => {
    if (!open && typeof document !== "undefined") {
      const el = document.activeElement as HTMLElement | null;
      if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT")) {
        el.blur();
      }
    }
  }, [open]);

  const maxHeight = vh ? Math.min(vh - 24, vh) : undefined;

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay
          className="fixed inset-0 z-[800] bg-black/60 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
        />
        <Dialog.Content
          aria-describedby={undefined}
          onOpenAutoFocus={(e) => e.preventDefault()}
          style={{
            bottom: kb,
            maxHeight: maxHeight ? `${maxHeight}px` : "85vh",
          }}
          className={cn(
            "fixed inset-x-0 z-[71] flex flex-col rounded-t-3xl bg-background shadow-2xl",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
            "data-[state=closed]:duration-200 data-[state=open]:duration-300",
            className,
          )}
        >
          {/* Drag handle */}
          <div className="flex items-center justify-center pt-2.5 pb-1">
            <div className="h-1.5 w-10 rounded-full bg-muted-foreground/30" />
          </div>

          {title && (
            <Dialog.Title className="px-6 pt-1 pb-2 text-center font-display text-lg font-semibold text-foreground">
              {title}
            </Dialog.Title>
          )}
          {!title && <Dialog.Title className="sr-only">Dialog</Dialog.Title>}

          <Dialog.Close
            aria-label="Lukk"
            className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full text-muted-foreground hover:bg-muted"
          >
            <X className="h-5 w-5" />
          </Dialog.Close>

          {/* Scrollable body — gets the remaining space, padded for safe-area */}
          <div
            className="flex-1 overflow-y-auto overscroll-contain px-6 pb-[max(env(safe-area-inset-bottom),16px)] pt-2"
            style={{ WebkitOverflowScrolling: "touch" }}
          >
            {children}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
