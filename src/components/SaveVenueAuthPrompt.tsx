import { useNavigate } from "react-router-dom";
import { Heart } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SaveVenueAuthPrompt({ open, onOpenChange }: Props) {
  const navigate = useNavigate();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm rounded-3xl">
        <DialogHeader className="items-center text-center">
          <div className="grid h-14 w-14 place-items-center rounded-full bg-primary/10">
            <Heart className="h-6 w-6 text-primary" />
          </div>
          <DialogTitle className="font-display text-xl">
            Bli medlem av Utefolket for å lagre steder
          </DialogTitle>
          <DialogDescription>
            Lagre favorittstedene dine og følg sol, stemning og ølpriser live.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <button
            onClick={() => {
              onOpenChange(false);
              navigate("/auth");
            }}
            className="tap-scale w-full rounded-full bg-night py-3.5 text-sm font-semibold text-white shadow-card"
          >
            Opprett konto eller logg inn
          </button>
          <button
            onClick={() => onOpenChange(false)}
            className="tap-scale w-full rounded-full bg-card py-3 text-sm font-medium text-muted-foreground"
          >
            Ikke nå
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
