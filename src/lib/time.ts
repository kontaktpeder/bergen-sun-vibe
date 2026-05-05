export function timeAgo(iso: string | null | undefined): string {
  if (!iso) return "nylig";
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "nå nettopp";
  if (min < 60) return `${min} min siden`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} t siden`;
  const d = Math.floor(hr / 24);
  return `${d} d siden`;
}
