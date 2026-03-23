function normalizeTitle(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function rankCandidate(queryTitle, candidateTitle) {
  const q = normalizeTitle(queryTitle);
  const c = normalizeTitle(candidateTitle);

  if (!q || !c) return 0;
  if (c === q) return 1000;
  if (c.startsWith(q)) return 850;
  if (q.startsWith(c)) return 700;
  if (c.includes(q)) return 600;

  const qTokens = q.split(" ").filter(Boolean);
  const cTokens = c.split(" ").filter(Boolean);
  if (!qTokens.length || !cTokens.length) return 0;

  let common = 0;
  for (const t of qTokens) {
    if (cTokens.includes(t)) common += 1;
  }

  if (!common) return 0;
  return Math.round((common / qTokens.length) * 500);
}

function addUnique(list, seen, url) {
  if (!url || seen.has(url)) return;
  seen.add(url);
  list.push(url);
}

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
      search_precise: "true",
      page_size: "8",
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
    const seen = new Set();

    if (data && data.results && data.results.length) {
      const ranked = data.results
        .map((game) => {
          const score = rankCandidate(q, game && game.name);
          return { game, score };
        })
        .filter((x) => x.score > 0)
        .sort((a, b) => b.score - a.score);

      const candidates = ranked.length
        ? ranked.slice(0, 6).map((x) => x.game)
        : data.results.slice(0, 3);

      for (const r of candidates) {
        addUnique(imgs, seen, r && r.background_image);
      }

      if (imgs.length < 4) {
        for (const r of candidates) {
          if (r && r.short_screenshots && Array.isArray(r.short_screenshots)) {
            for (const s of r.short_screenshots) {
              addUnique(imgs, seen, s && s.image);
              if (imgs.length >= 4) break;
            }
          }
          if (imgs.length >= 4) break;
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
