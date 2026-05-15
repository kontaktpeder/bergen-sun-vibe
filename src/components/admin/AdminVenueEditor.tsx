import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ExternalLink, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  venueId: string;
  slug: string;
  initialDescription: string;
  initialTags: string[];
  initialHours: string;
}

const SUGGESTED_TAGS = ["afterwork", "kveldssol", "uteservering", "takterrasse", "date"];

export function AdminVenueEditor({
  venueId,
  slug,
  initialDescription,
  initialTags,
  initialHours,
}: Props) {
  const qc = useQueryClient();
  const [description, setDescription] = useState(initialDescription ?? "");
  const [tagsInput, setTagsInput] = useState((initialTags ?? []).join(", "));
  const [hours, setHours] = useState(initialHours ?? "");

  const parsedTags = tagsInput
    .split(",")
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);

  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc("admin_update_venue", {
        _venue_id: venueId,
        _description: description,
        _tags: parsedTags,
        _hours: hours,
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success("Lagret");
      qc.invalidateQueries({ queryKey: ["admin-venues"] });
      qc.invalidateQueries({ queryKey: ["venue", slug] });
      qc.invalidateQueries({ queryKey: ["venues"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Kunne ikke lagre"),
  });

  const addTag = (t: string) => {
    if (parsedTags.includes(t)) return;
    setTagsInput([...parsedTags, t].join(", "));
  };

  return (
    <div className="space-y-4 border-t border-border/60 px-3 py-4">
      <div>
        <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Beskrivelse
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={2000}
          rows={4}
          className="mt-1 w-full rounded-2xl bg-background p-3 text-sm shadow-soft outline-none focus:ring-2 focus:ring-primary/40"
          placeholder="2–4 setninger om stedet — område, hvorfor ute, stemning."
        />
        <div className="mt-1 flex justify-between text-[11px] text-muted-foreground">
          <span>Minst 20 tegn anbefales for indeksering</span>
          <span>{description.length} / 2000</span>
        </div>
      </div>

      <div>
        <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Tags (kommaseparert)
        </label>
        <input
          value={tagsInput}
          onChange={(e) => setTagsInput(e.target.value)}
          className="mt-1 w-full rounded-full bg-background px-4 py-2.5 text-sm shadow-soft outline-none focus:ring-2 focus:ring-primary/40"
          placeholder="afterwork, kveldssol, uteservering"
        />
        <div className="mt-2 flex flex-wrap gap-1.5">
          {SUGGESTED_TAGS.map((t) => {
            const active = parsedTags.includes(t);
            return (
              <button
                key={t}
                type="button"
                onClick={() => addTag(t)}
                disabled={active}
                className="rounded-full bg-secondary px-2.5 py-1 text-[11px] text-foreground disabled:opacity-40"
              >
                + {t}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Åpningstider
        </label>
        <input
          value={hours}
          onChange={(e) => setHours(e.target.value)}
          maxLength={200}
          className="mt-1 w-full rounded-full bg-background px-4 py-2.5 text-sm shadow-soft outline-none focus:ring-2 focus:ring-primary/40"
          placeholder="Man–fre 11–22, lør 12–23, søn stengt"
        />
      </div>

      <div className="flex items-center gap-2">
        <Button
          size="sm"
          onClick={() => save.mutate()}
          disabled={save.isPending}
        >
          <Save className="h-4 w-4" />
          {save.isPending ? "Lagrer…" : "Lagre"}
        </Button>
        <Link
          to={`/steder/${slug}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          Forhåndsvis
        </Link>
      </div>
    </div>
  );
}
