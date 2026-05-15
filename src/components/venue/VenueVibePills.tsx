interface Props {
  labels: string[];
}

export function VenueVibePills({ labels }: Props) {
  if (!labels.length) return null;
  return (
    <ul className="mt-3 flex flex-wrap gap-2" aria-label="Stemning og kategorier">
      {labels.map((label) => (
        <li
          key={label}
          className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-foreground"
        >
          {label}
        </li>
      ))}
    </ul>
  );
}
