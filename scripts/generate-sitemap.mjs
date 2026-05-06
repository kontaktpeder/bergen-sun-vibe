// Generates public/sitemap.xml from Supabase venues + static SEO routes.
// Runs at build via the `seo:sitemap` npm script. Failures are non-fatal —
// we always write at least the static URL set so the build keeps going.

import { writeFileSync, readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const SITE = "https://utefolket.no";
const FACETS = ["kveldssol", "afterwork", "date", "takterrasse"];
const CITIES = ["oslo", "bergen"];

function readEnv() {
  const env = {};
  const path = resolve(ROOT, ".env");
  if (!existsSync(path)) return env;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
  return env;
}

function slugifyNorwegian(s) {
  return (s || "")
    .toLowerCase()
    .replace(/æ/g, "ae")
    .replace(/ø/g, "oe")
    .replace(/å/g, "aa")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function fetchVenues(env) {
  const url = env.VITE_SUPABASE_URL;
  const key = env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return [];
  try {
    const res = await fetch(
      `${url}/rest/v1/venues?select=slug,city,area,tags&status=eq.published`,
      { headers: { apikey: key, Authorization: `Bearer ${key}` } }
    );
    if (!res.ok) {
      console.warn("[sitemap] Supabase responded", res.status);
      return [];
    }
    return await res.json();
  } catch (e) {
    console.warn("[sitemap] fetch failed:", e.message);
    return [];
  }
}

function urlEntry(loc, lastmod) {
  return `  <url><loc>${loc}</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ""}</url>`;
}

async function main() {
  const env = readEnv();
  const venues = await fetchVenues(env);
  const now = new Date().toISOString().slice(0, 10);
  const entries = [];

  entries.push(urlEntry(`${SITE}/`, now));
  for (const c of CITIES) {
    entries.push(urlEntry(`${SITE}/${c}`, now));
    for (const f of FACETS) {
      // Only include facets that actually have venues with a matching tag.
      const cityName = c === "oslo" ? "Oslo" : "Bergen";
      const matching = venues.filter(
        (v) =>
          (v.city === cityName) &&
          (v.tags || []).some((t) => new RegExp(f, "i").test(String(t)))
      );
      if (matching.length >= 6) {
        entries.push(urlEntry(`${SITE}/${c}/${f}`, now));
      }
    }
  }

  // Area pages with >= 6 venues
  const areaCounts = new Map();
  for (const v of venues) {
    if (!v.area || !v.city) continue;
    const c = v.city.toLowerCase();
    const key = `${c}/${slugifyNorwegian(v.area)}`;
    areaCounts.set(key, (areaCounts.get(key) ?? 0) + 1);
  }
  for (const [key, n] of areaCounts) {
    if (n >= 6) entries.push(urlEntry(`${SITE}/${key}`, now));
  }

  for (const v of venues) {
    if (v.slug) entries.push(urlEntry(`${SITE}/steder/${v.slug}`, now));
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.join("\n")}
</urlset>
`;

  const out = resolve(ROOT, "public/sitemap.xml");
  writeFileSync(out, xml, "utf8");
  console.log(`[sitemap] wrote ${entries.length} urls -> ${out}`);
}

main().catch((e) => {
  console.warn("[sitemap] failed (non-fatal):", e.message);
  process.exit(0);
});
