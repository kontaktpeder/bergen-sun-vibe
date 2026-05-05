// Public edge function — redirects to Google Place Photo URL.
// Keeps the API key server-side. Browsers can use this URL directly in <img src>.

const GOOGLE_KEY = Deno.env.get("GOOGLE_PLACES_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const photoName = url.searchParams.get("name");
    const maxWidth = Math.min(
      1600,
      Math.max(64, Number(url.searchParams.get("w")) || 800),
    );
    const maxHeight = Math.min(
      1600,
      Math.max(64, Number(url.searchParams.get("h")) || 800),
    );

    if (!photoName || !/^places\/[^/]+\/photos\/[^/]+$/.test(photoName)) {
      return new Response(JSON.stringify({ error: "invalid photo name" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!GOOGLE_KEY) {
      return new Response(JSON.stringify({ error: "missing api key" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // skipHttpRedirect=true returns JSON with photoUri (so we can re-redirect with cache headers)
    const apiUrl =
      `https://places.googleapis.com/v1/${photoName}/media` +
      `?maxWidthPx=${maxWidth}&maxHeightPx=${maxHeight}` +
      `&skipHttpRedirect=true&key=${GOOGLE_KEY}`;

    const res = await fetch(apiUrl);
    if (!res.ok) {
      const text = await res.text();
      return new Response(
        JSON.stringify({ error: "google photo failed", detail: text.slice(0, 200) }),
        {
          status: res.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }
    const data = (await res.json()) as { photoUri?: string };
    if (!data.photoUri) {
      return new Response(JSON.stringify({ error: "no photo uri" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(null, {
      status: 302,
      headers: {
        ...corsHeaders,
        Location: data.photoUri,
        // Google attribution requirement satisfied via response header
        "X-Image-Attribution": "Powered by Google",
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch (e) {
    return new Response(
      JSON.stringify({ error: (e as Error).message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
