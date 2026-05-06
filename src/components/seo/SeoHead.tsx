import { useEffect } from "react";

interface Props {
  title: string;
  description: string;
  canonical: string;
  robots?: string;
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
  image?: string;
}

const JSONLD_ID = "seo-jsonld";

function setMeta(name: string, content: string, property = false) {
  const selector = property ? `meta[property="${name}"]` : `meta[name="${name}"]`;
  let el = document.head.querySelector(selector) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement("meta");
    if (property) el.setAttribute("property", name);
    else el.setAttribute("name", name);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

export function SeoHead({ title, description, canonical, robots = "index,follow", jsonLd, image }: Props) {
  useEffect(() => {
    document.title = title;
    setMeta("description", description);
    setMeta("robots", robots);
    setMeta("og:title", title, true);
    setMeta("og:description", description, true);
    setMeta("og:url", canonical, true);
    setMeta("twitter:title", title);
    setMeta("twitter:description", description);
    if (image) {
      setMeta("og:image", image, true);
      setMeta("twitter:image", image);
    }

    let link = document.head.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement("link");
      link.rel = "canonical";
      document.head.appendChild(link);
    }
    link.href = canonical;

    // JSON-LD
    const existing = document.getElementById(JSONLD_ID);
    if (existing) existing.remove();
    if (jsonLd) {
      const script = document.createElement("script");
      script.type = "application/ld+json";
      script.id = JSONLD_ID;
      script.text = JSON.stringify(jsonLd);
      document.head.appendChild(script);
    }

    return () => {
      const s = document.getElementById(JSONLD_ID);
      if (s) s.remove();
    };
  }, [title, description, canonical, robots, image, jsonLd]);

  return null;
}
