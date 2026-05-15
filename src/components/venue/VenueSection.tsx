import { cn } from "@/lib/utils";

interface Props {
  id: string;
  title: string;
  children: React.ReactNode;
  className?: string;
}

export function VenueSection({ id, title, children, className }: Props) {
  return (
    <section id={id} aria-labelledby={`${id}-h2`} className={cn("mt-8", className)}>
      <h2 id={`${id}-h2`} className="mb-3 font-display text-lg font-semibold">
        {title}
      </h2>
      {children}
    </section>
  );
}
