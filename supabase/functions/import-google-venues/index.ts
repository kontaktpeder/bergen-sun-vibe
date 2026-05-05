// Imports venues from Google Places (New) Nearby Search.
// Admin-only. Idempotent: on existing google_place_id, only google_* fields are refreshed,
// user-editable base fields are preserved.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type City = { name: "Bergen" | "Oslo"; lat: number; lng: number; radius: number };

const CITIES: Record<string, City> = {
  Bergen: { name: "Bergen", lat: 60.3913, lng: 5.3221, radius: 4000 },
  Oslo: { name: "Oslo", lat: 59.9139, lng: 10.7522, radius: 5000 },
};

const TYPES = ["bar", "restaurant", "cafe", "night_club"] as const;

const FIELD_MASK = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.location",
  "places.rating",
  "places.userRatingCount",
  "places.types",
  "places.primaryType",
  "places.googleMapsUri",
  "places.websiteUri",
  "places.photos",
].join(",");

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60) || "venue";
}

function categoryFromTypes(types: string[] | undefined): string {
  if (!types || !types.length) return "bar";
  if (types.includes("night_club")) return "bar";
  if (types.includes("bar")) return "bar";
  if (types.includes("cafe") || types.includes("coffee_shop")) return "cafe";
  if (types.includes("restaurant") || types.includes("meal_takeaway")) return "restaurant";
  return "bar";
}

async function nearbySearch(
  apiKey: string,
  city: City,
  type: string,
): Promise<any[]> {
  const all: any[] = [];
  let pageToken: string | undefined;
  for (let page = 0; page < 3; page++) {
    const body: Record<string, unknown> = {
      includedTypes: [type],
      maxResultCount: 20,
      locationRestriction: {
        circle: {
          center: { latitude: city.lat, longitude: city.lng },
          radius: city.radius,
        },
      },
    };
    if (pageToken) (body as any).pageToken = pageToken;

    let attempt = 0;
    let res: Response | null = null;
    while (attempt < 3) {
      res = await fetch("https://places.googleapis.com/v1/places:searchNearby", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": apiKey,
          "X-Goog-FieldMask": FIELD_MASK + ",nextPageToken",
        },
        body: JSON.stringify(body),
      });
      if (res.ok) break;
      if (res.status === 429 || res.status >= 500) {
        await new Promise((r) => setTimeout(r, 600 * (attempt + 1)));
        attempt++;
        continue;
      }
      break;
    }
    if (!res || !res.ok) {
      const text = res ? await res.text() : "no response";
      console.error(`[google] ${city.name}/${type} failed: ${res?.status} ${text}`);
      break;
    }
    const json = await res.json();
    const places = (json.places ?? []) as any[];
    all.push(...places);
    pageToken = json.nextPageToken;
    if (!pageToken) break;
    // Token needs a short delay before it becomes valid
    await new Promise((r) => setTimeout(r, 1500));
  }
  return all;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const GKEY = Deno.env.get("GOOGLE_PLACES_API_KEY");

    if (!GKEY) {
      return new Response(JSON.stringify({ error: "GOOGLE_PLACES_API_KEY missing" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Auth + admin check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userClient = createClient(SUPABASE_URL, ANON, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: claims, error: claimsErr } = await userClient.auth.getClaims(token);
    if (claimsErr || !claims?.claims?.sub) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claims.claims.sub as string;

    const admin = createClient(SUPABASE_URL, SERVICE);
    const { data: roleRow } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleRow) {
      return new Response(JSON.stringify({ error: "Admin only" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse body
    let body: { cities?: string[]; dryRun?: boolean } = {};
    try {
      body = await req.json();
    } catch {
      // empty body ok
    }
    const requested = (body.cities ?? ["Bergen", "Oslo"]).filter(
      (c): c is "Bergen" | "Oslo" => c === "Bergen" || c === "Oslo",
    );
    const dryRun = !!body.dryRun;

    const summary = {
      fetched: 0,
      inserted: 0,
      updated: 0,
      skipped: 0,
      errors: [] as string[],
      perCity: {} as Record<string, { fetched: number; inserted: number; updated: number }>,
    };

    for (const cityName of requested) {
      const city = CITIES[cityName];
      const dedup = new Map<string, any>();
      for (const t of TYPES) {
        try {
          const places = await nearbySearch(GKEY, city, t);
          for (const p of places) {
            if (p?.id) dedup.set(p.id, p);
          }
        } catch (e) {
          summary.errors.push(`${cityName}/${t}: ${(e as Error).message}`);
        }
      }
      const all = [...dedup.values()];
      summary.fetched += all.length;
      summary.perCity[cityName] = { fetched: all.length, inserted: 0, updated: 0 };

      if (dryRun) continue;

      // Get existing rows
      const ids = all.map((p) => p.id);
      const { data: existing } = await admin
        .from("venues")
        .select("id, google_place_id, slug")
        .in("google_place_id", ids);
      const existingByPlaceId = new Map(
        (existing ?? []).map((r: any) => [r.google_place_id, r]),
      );

      // Existing slugs to avoid collision
      const { data: allSlugRows } = await admin.from("venues").select("slug");
      const slugSet = new Set((allSlugRows ?? []).map((r: any) => r.slug));

      for (const p of all) {
        try {
          const placeId = p.id as string;
          const name = p.displayName?.text ?? "Ukjent sted";
          const lat = p.location?.latitude;
          const lng = p.location?.longitude;
          if (typeof lat !== "number" || typeof lng !== "number") {
            summary.skipped++;
            continue;
          }
          const photoName = p.photos?.[0]?.name ?? null;
          const types = (p.types ?? []) as string[];
          const category = categoryFromTypes(types);

          const updatePayload = {
            google_maps_url: p.googleMapsUri ?? null,
            website_url: p.websiteUri ?? null,
            google_rating: typeof p.rating === "number" ? p.rating : null,
            google_user_rating_count:
              typeof p.userRatingCount === "number" ? p.userRatingCount : null,
            google_types: types,
            google_photo_name: photoName,
            address: p.formattedAddress ?? null,
            source: "google",
            status: "published",
          };

          const existingRow = existingByPlaceId.get(placeId);
          if (existingRow) {
            const { error } = await admin
              .from("venues")
              .update(updatePayload)
              .eq("id", existingRow.id);
            if (error) {
              summary.errors.push(`update ${placeId}: ${error.message}`);
            } else {
              summary.updated++;
              summary.perCity[cityName].updated++;
            }
            continue;
          }

          // New row — generate unique slug
          let base = slugify(name);
          let slug = base;
          let n = 2;
          while (slugSet.has(slug)) {
            slug = `${base}-${n++}`;
          }
          slugSet.add(slug);

          const insertPayload = {
            ...updatePayload,
            google_place_id: placeId,
            name,
            slug,
            category,
            description: "",
            lat,
            lng,
            city: cityName,
            tags: [],
            sun_status: "shade" as const,
            sun_score: 0,
            price_level: 2,
            rating: 0,
            reviews: 0,
          };
          const { error } = await admin.from("venues").insert(insertPayload);
          if (error) {
            summary.errors.push(`insert ${placeId}: ${error.message}`);
          } else {
            summary.inserted++;
            summary.perCity[cityName].inserted++;
          }
        } catch (e) {
          summary.errors.push(`row ${p?.id}: ${(e as Error).message}`);
        }
      }
    }

    return new Response(JSON.stringify(summary, null, 2), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("import-google-venues error", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
