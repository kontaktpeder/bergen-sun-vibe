import { useState } from "react";
import { Flag } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useAuthProfile } from "@/hooks/useAuthProfile";
import { useCreateReport, type ReportReason } from "@/hooks/useReports";
import { Link } from "react-router-dom";

const REASONS: { value: ReportReason; label: string }[] = [
  { value: "wrong_info", label: "Feil info" },
  { value: "spam", label: "Spam" },
  { value: "inappropriate", label: "Upassende bilde" },
  { value: "other", label: "Annet" },
];

export function ReportButton({ contributionId }: { contributionId: string }) {
  const [open, setOpen] = useState(false);
  const { user, isAuthed } = useAuthProfile();
  const create = useCreateReport(user?.id);

  const submit = async (reason: ReportReason) => {
    try {
      await create.mutateAsync({ contributionId, reason });
      toast.success("Takk for rapporten");
      setOpen(false);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Noe gikk galt";
      toast.error(msg);
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
      <Dialog open={open} onOpenChange={setOpen}>
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
          ) : (
            <div className="grid gap-2 pt-2">
              {REASONS.map((r) => (
                <Button
                  key={r.value}
                  variant="outline"
                  className="justify-start"
                  disabled={create.isPending}
                  onClick={() => submit(r.value)}
                >
                  {r.label}
                </Button>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
