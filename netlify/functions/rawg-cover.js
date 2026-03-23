exports.handler = async (event) => {
  try {
    const key = process.env.RAWG_API_KEY;
    if (!key) {
      return {
        statusCode: 500,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "RAWG_API_KEY no configurada" }),
      };
    }

    const title = (event.queryStringParameters && event.queryStringParameters.title) || "";
    const q = String(title).trim();
    if (!q) {
      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ images: [] }),
      };
    }

    const params = new URLSearchParams({
      search: q,
      page_size: "3",
      key,
    });
    const url = `https://api.rawg.io/api/games?${params.toString()}`;

    const res = await fetch(url);
    if (!res.ok) {
      return {
        statusCode: res.status,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: `RAWG no responde: ${res.status}` }),
      };
    }

    const data = await res.json();
    let imgs = [];

    if (data && data.results && data.results.length) {
      for (const r of data.results) {
        if (r.background_image) imgs.push(r.background_image);
        if (r.short_screenshots && Array.isArray(r.short_screenshots)) {
          for (const s of r.short_screenshots) {
            if (s.image && !imgs.includes(s.image)) imgs.push(s.image);
          }
        }
      }
    }

    imgs = imgs.filter(Boolean).slice(0, 4);

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ images: imgs }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Error interno", detail: String(err && err.message ? err.message : err) }),
    };
  }
};
