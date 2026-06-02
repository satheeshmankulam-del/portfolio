// pages/api/fetchmeta.js
// Next.js API Route — replaces Microlink API
// Free, no limits beyond Vercel/Netlify's generous free tier

export default async function handler(req, res) {
  // CORS headers — allows linked Android app to call this
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  const { url: rawUrl } = req.query;

  if (!rawUrl) {
    return res.status(400).json({ error: "url param required" });
  }

  try {
    const parsed = new URL(rawUrl);
    const domain = parsed.hostname.replace(/^www\./, "");

    const response = await fetch(rawUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; LinkedBot/1.0; +https://satheeshmankulam.com)",
        "Accept": "text/html,application/xhtml+xml",
        "Accept-Language": "en-US,en;q=0.9",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const html = await response.text();

    const getMeta = (patterns) => {
      for (const pattern of patterns) {
        const m = html.match(pattern);
        if (m?.[1]?.trim()) return m[1].trim();
      }
      return null;
    };

    const title = getMeta([
      /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i,
      /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:title["']/i,
      /<meta[^>]+name=["']twitter:title["'][^>]+content=["']([^"']+)["']/i,
      /<title[^>]*>([^<]{1,200})<\/title>/i,
    ]) || domain;

    const description = getMeta([
      /<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i,
      /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:description["']/i,
      /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i,
    ]);

    const imageUrl = getMeta([
      /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i,
      /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i,
      /<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i,
    ]);

    const faviconRaw = getMeta([
      /<link[^>]+rel=["'][^"']*icon[^"']*["'][^>]+href=["']([^"']+)["']/i,
      /<link[^>]+href=["']([^"']+)["'][^>]+rel=["'][^"']*icon[^"']*["']/i,
    ]);

    const favicon = faviconRaw
      ? (faviconRaw.startsWith("http")
          ? faviconRaw
          : `${parsed.origin}${faviconRaw.startsWith("/") ? "" : "/"}${faviconRaw}`)
      : `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;

    const resolvedImage = imageUrl
      ? (imageUrl.startsWith("http")
          ? imageUrl
          : `${parsed.origin}${imageUrl.startsWith("/") ? "" : "/"}${imageUrl}`)
      : null;

    return res.status(200)
      .setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate")
      .json({ title, description, imageUrl: resolvedImage, favicon, domain });

  } catch (err) {
    // Fallback — still return something so the app can save the link
    try {
      const domain = new URL(rawUrl).hostname.replace(/^www\./, "");
      return res.status(200).json({
        title: domain,
        description: null,
        imageUrl: null,
        favicon: `https://www.google.com/s2/favicons?domain=${domain}&sz=32`,
        domain,
      });
    } catch (_) {
      return res.status(400).json({ error: "Invalid URL" });
    }
  }
}
