import type { City } from "@/context/CityContext";

export function cityFooter(city: City) {
  return `Laget med ☀️ i ${city}`;
}

export function cityShareBrand(city: City) {
  return `Utefolket ${city}`;
}

export function citySlugFor(city: City): "bergen" | "oslo" {
  return city === "Oslo" ? "oslo" : "bergen";
}
