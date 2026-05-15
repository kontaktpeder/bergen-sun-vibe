import { cn } from "@/lib/utils";

interface Props {
  id: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}

export function VenueSection({ id, title, subtitle, children, className }: Props) {
  return (
    <section id={id} aria-labelledby={`${id}-h2`} className={cn("mt-8", className)}>
      <h2 id={`${id}-h2`} className={cn("font-display text-lg font-semibold", subtitle ? "" : "mb-3")}>
        {title}
      </h2>
      {subtitle && (
        <p className="mb-3 mt-0.5 text-xs text-muted-foreground">{subtitle}</p>
      )}
      {children}
    </section>
  );
}
