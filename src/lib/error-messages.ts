export function toUserErrorMessage(input: unknown): string {
  const raw =
    input instanceof Error ? input.message :
    typeof input === "string" ? input :
    "Noe gikk galt";

  const msg = raw.toLowerCase();

  if (msg.includes("cooldown")) return "Du bidro nettopp her. Prøv igjen om noen minutter.";
  if (msg.includes("duplicate_price")) return "Denne prisen er allerede sendt inn i dag.";
  if (msg.includes("duplicate_venue")) return "Et lignende sted finnes allerede i nærheten.";
  if (msg.includes("photo_limit")) return "Maks 3 bilder per sted per døgn.";
  if (msg.includes("invalid beer price")) return "Ugyldig pris. Skriv inn mellom 1 og 1000 kr.";
  if (msg.includes("not authenticated")) return "Du må være logget inn for å gjøre dette.";
  if (msg.includes("storage") || msg.includes("upload")) return "Bildet kunne ikke lastes opp. Prøv et mindre bilde.";
  if (msg.includes("invalid") || msg.includes("required")) return "Noe mangler. Sjekk feltet og prøv igjen.";

  return "Noe gikk galt. Prøv igjen.";
}
