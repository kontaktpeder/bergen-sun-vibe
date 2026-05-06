import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type ReqBody = {
  name: string;
  city?: "Bergen" | "Oslo" | string;
  area?: string;
  lat?: number;
  lng?: number;
};

type GooglePlaceMatch = {
  name: string;
  formatted_address: string | null;
  google_place_id: string;
  google_maps_uri: string | null;
  rating: number | null;
  user_rating_count: number | null;
  lat: number | null;
  lng: number | null;
};

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
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user?.id) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(SUPABASE_URL, SERVICE);

    const body = (await req.json()) as ReqBody;
    const name = (body.name ?? "").trim();
    if (!name) {
      return new Response(JSON.stringify({ error: "name is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const queryParts = [name, body.area, body.city].filter(Boolean);
    const textQuery = queryParts.join(", ");

    const googleRes = await fetch("https://places.googleapis.com/v1/places:searchText", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": GKEY,
        "X-Goog-FieldMask":
          "places.id,places.displayName,places.formattedAddress,places.location,places.googleMapsUri,places.rating,places.userRatingCount",
      },
      body: JSON.stringify({
        textQuery,
        maxResultCount: 5,
        ...(typeof body.lat === "number" && typeof body.lng === "number"
          ? {
              locationBias: {
                circle: {
                  center: { latitude: body.lat, longitude: body.lng },
                  radius: 2000.0,
                },
              },
            }
          : {}),
      }),
    });

    if (!googleRes.ok) {
      const errTxt = await googleRes.text();
      return new Response(
        JSON.stringify({ error: `Google search failed: ${googleRes.status} ${errTxt}` }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const googleJson = await googleRes.json();
    const matches: GooglePlaceMatch[] = ((googleJson.places ?? []) as any[])
      .slice(0, 5)
      .map((p) => ({
        name: p.displayName?.text ?? "Ukjent",
        formatted_address: p.formattedAddress ?? null,
        google_place_id: p.id,
        google_maps_uri: p.googleMapsUri ?? null,
        rating: typeof p.rating === "number" ? p.rating : null,
        user_rating_count: typeof p.userRatingCount === "number" ? p.userRatingCount : null,
        lat: typeof p.location?.latitude === "number" ? p.location.latitude : null,
        lng: typeof p.location?.longitude === "number" ? p.location.longitude : null,
      }));

    const ids = matches.map((m) => m.google_place_id).filter(Boolean);
    let existingByPlaceId: Array<{
      google_place_id: string;
      venue_id: string;
      slug: string;
      name: string;
    }> = [];
    if (ids.length > 0) {
      const { data: existing } = await admin
        .from("venues")
        .select("id, slug, name, google_place_id")
        .in("google_place_id", ids);

      existingByPlaceId = (existing ?? []).map((r: any) => ({
        google_place_id: r.google_place_id,
        venue_id: r.id,
        slug: r.slug,
        name: r.name,
      }));
    }

    return new Response(JSON.stringify({ matches, existingByPlaceId }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
