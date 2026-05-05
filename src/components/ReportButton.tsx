import { useState } from "react";
import { Flag } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useAuthProfile } from "@/hooks/useAuthProfile";
import { useCreateReport, type ReportReason } from "@/hooks/useReports";
import { toUserErrorMessage } from "@/lib/error-messages";
import { Link } from "react-router-dom";

const REASONS: { value: ReportReason; label: string }[] = [
  { value: "wrong_info", label: "Feil info" },
  { value: "spam", label: "Spam" },
  { value: "inappropriate", label: "Upassende bilde" },
  { value: "other", label: "Annet" },
];

export function ReportButton({ contributionId }: { contributionId: string }) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<ReportReason | null>(null);
  const [otherText, setOtherText] = useState("");
  const { user, isAuthed } = useAuthProfile();
  const create = useCreateReport(user?.id);

  const reset = () => {
    setSelected(null);
    setOtherText("");
  };

  const submit = async (reason: ReportReason) => {
    try {
      const finalReason =
        reason === "other" ? (`other: ${otherText.trim()}` as ReportReason) : reason;
      await create.mutateAsync({ contributionId, reason: finalReason });
      toast.success("Takk! Vi går gjennom bidraget.");
      setOpen(false);
      reset();
    } catch (e) {
      toast.error(toUserErrorMessage(e));
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Rapporter"
        className="grid h-7 w-7 place-items-center rounded-full text-muted-foreground hover:bg-secondary"
      >
        <Flag className="h-3.5 w-3.5" />
      </button>
      <Dialog
        open={open}
        onOpenChange={(o) => {
          setOpen(o);
          if (!o) reset();
        }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Rapporter bidrag</DialogTitle>
          </DialogHeader>
          {!isAuthed ? (
            <div className="py-2 text-sm">
              <p className="text-muted-foreground">Du må være innlogget for å rapportere.</p>
              <Link to="/auth" onClick={() => setOpen(false)}>
                <Button className="mt-4 w-full">Logg inn</Button>
              </Link>
            </div>
          ) : selected !== "other" ? (
            <div className="grid gap-2 pt-2">
              {REASONS.map((r) => (
                <Button
                  key={r.value}
                  variant="outline"
                  className="justify-start"
                  disabled={create.isPending}
                  onClick={() => (r.value === "other" ? setSelected("other") : submit(r.value))}
                >
                  {r.label}
                </Button>
              ))}
            </div>
          ) : (
            <div className="grid gap-3 pt-2">
              <Textarea
                value={otherText}
                onChange={(e) => setOtherText(e.target.value)}
                placeholder="Beskriv kort hva som er galt…"
                rows={3}
              />
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setSelected(null)}>
                  Tilbake
                </Button>
                <Button
                  className="flex-1"
                  disabled={create.isPending || otherText.trim().length < 3}
                  onClick={() => submit("other")}
                >
                  Send rapport
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
