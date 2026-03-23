// =====================
// Juegos: almacenamiento y CRUD
// =====================
function loadGames() {
  const gamesRef = getUserGamesRef();
  if (!gamesRef) {
    games = [];
    renderGames();
    return;
  }

  gamesRef
    .once("value")
    .then((snapshot) => {
      games = normalizeGamesData(snapshot.val());
      localStorage.setItem(getUserStorageKey(GAMES_KEY), JSON.stringify(games));
      renderGames();
    })
    .catch((err) => {
      console.error("No se pudo cargar juegos de Firebase", err);
      try {
        games = normalizeGamesData(
          JSON.parse(localStorage.getItem(getUserStorageKey(GAMES_KEY)))
        );
      } catch {
        games = [];
      }
      renderGames();
    });
}

function saveGames() {
  const gamesRef = getUserGamesRef();
  if (!gamesRef) return;
  localStorage.setItem(getUserStorageKey(GAMES_KEY), JSON.stringify(games));
  gamesRef.set(games);
}

function renderGames(newGameId = null) {
  const container = $(SELECTORS.gamesList);
  container.innerHTML = "";

  if (!games.length) {
    container.innerHTML =
      '<div style="color:var(--muted)">No hay juegos todavía. Añade el primero.</div>';
    return;
  }

  const sorted = [...games].sort((a, b) => {
    const da = a.date || a.id;
    const db = b.date || b.id;
    return (db || "").localeCompare(da || "");
  });

  for (const g of sorted) {
    const div = document.createElement("div");
    div.className = "game";
    const safeCover = sanitizeImageUrl(g.cover);

    let scoreColor = "#9aa4b2";
    if (typeof g.score === "number") {
      const r1 = 239,
        g1 = 68,
        b1 = 68,
        r2 = 34,
        g2 = 197,
        b2 = 94;
      const t = Math.max(0, Math.min(1, g.score / 100));
      const r = Math.round(r1 + (r2 - r1) * t);
      const gC = Math.round(g1 + (g2 - g1) * t);
      const b = Math.round(b1 + (b2 - b1) * t);
      scoreColor = `rgb(${r},${gC},${b})`;
    }

    div.innerHTML = `
      <div class="cover">
        ${
          safeCover
            ? `<img src="${safeCover}" alt="cover">`
            : `<div class="no-cover">No cover</div>`
        }
      </div>
      <div class="info">
        <h3>${escapeHtml(g.title)}</h3>
        <div class="meta">
          <span>${escapeHtml(g.platform || "Sin plataforma")}</span>
          <span>${fmtDate(g.date)}</span>
          <span class="score" style="color:${scoreColor};background:rgba(255,255,255,0.10)">${
      g.score ?? "-"
    }</span>
        </div>
        <div class="notes">${escapeHtml(g.notes || "").slice(0, 180)}</div>
      </div>
      <div class="actions">
        <button class="small js-edit-game" data-game-id="${escapeHtml(g.id)}">Editar</button>
        <button class="small js-delete-game" data-game-id="${escapeHtml(g.id)}">Borrar</button>
      </div>
    `;

    if (g.id === newGameId) {
      div.classList.add("game-appear");
      setTimeout(() => div.classList.remove("game-appear"), 700);
    }

    container.appendChild(div);
  }
}

function addGame(payload) {
  const entry = Object.assign({
    id: String(Date.now()),
    title: payload.title || "Sin título",
    platform: payload.platform || "",
    date: payload.date || "",
    score: payload.score !== undefined ? Number(payload.score) : null,
    hours: payload.hours || null,
    cover: payload.cover || "",
    notes: payload.notes || "",
  });
  games.push(entry);
  saveGames();
  renderGames(entry.id);
}

function updateGame(id, payload) {
  const idx = games.findIndex((x) => x.id === id);
  if (idx === -1) return;
  games[idx] = Object.assign({}, games[idx], payload);
  saveGames();
  renderGames();
}

function deleteGame(id) {
  const g = games.find((x) => x.id === id);
  if (!g) return;
  pendingDeleteId = id;
  $(SELECTORS.confirmGameTitle).textContent = g.title ? `"${g.title}"` : "";
  $(SELECTORS.confirmModal).classList.add("show");
  $(SELECTORS.confirmModal).setAttribute("aria-hidden", "false");
}

function closeConfirmModal() {
  $(SELECTORS.confirmModal).classList.remove("show");
  $(SELECTORS.confirmModal).setAttribute("aria-hidden", "true");
  pendingDeleteId = null;
}

function updateCoverPreview() {
  const url = sanitizeImageUrl($(SELECTORS.gCover).value.trim());
  const previewWrap = document.getElementById("coverPreviewWrap");
  previewWrap.innerHTML = "";
  if (url) {
    const img = document.createElement("img");
    img.src = url;
    img.alt = "Previsualización de portada";
    previewWrap.appendChild(img);
  }
}

function openEdit(id) {
  const g = games.find((x) => x.id === id);
  if (!g) return;
  editingId = id;
  $(SELECTORS.modalTitle).textContent = "Editar juego";
  $(SELECTORS.gTitle).value = g.title;
  $(SELECTORS.gPlatform).value = g.platform || "";
  $(SELECTORS.gDate).value = g.date || "";
  $(SELECTORS.gScore).value = g.score ?? 0;
  updateScoreUI(g.score ?? 0);
  $(SELECTORS.gHours).value = g.hours ?? "";
  $(SELECTORS.gCover).value = g.cover || "";
  $(SELECTORS.gNotes).value = g.notes || "";
  $(SELECTORS.coverStatus).textContent = g.cover ? "Portada ya presente" : "Sin portada";
  document.getElementById("coverThumbGallery").innerHTML = "";
  updateCoverPreview();
  $(SELECTORS.modal).classList.add("show");
  $(SELECTORS.modal).setAttribute("aria-hidden", "false");
}

function exportJSON() {
  const blob = new Blob([JSON.stringify(games, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "juegos_export.json";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function importJSON(file) {
  const r = new FileReader();
  r.onload = (e) => {
    try {
      const parsed = JSON.parse(e.target.result);
      if (!Array.isArray(parsed)) throw new Error("Formato inválido");
      for (const p of parsed) {
        if (!p.title) p.title = "Sin título";
        if (!p.id) p.id = String(Date.now() + Math.random());
      }
      games = parsed;
      saveGames();
      renderGames();
      alert("Importado correctamente");
    } catch (err) {
      alert("Error al importar: " + err.message);
    }
  };
  r.readAsText(file);
}

// RAWG cover search: devuelve array de imagenes (max 4)
async function fetchCoverRAWG(title) {
  const q = title && title.trim();
  if (!q) return [];
  if (coverCache[q]) return coverCache[q];
  const url = `/.netlify/functions/rawg-cover?title=${encodeURIComponent(q)}`;

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error("Proxy RAWG no responde: " + res.status);
    const data = await res.json();
    const imgs = Array.isArray(data && data.images)
      ? data.images.filter(Boolean).slice(0, 4)
      : [];
    coverCache[q] = imgs;
    return imgs;
  } catch (err) {
    console.warn("Error buscando portada RAWG:", err);
  }

  coverCache[q] = [];
  return [];
}

function updateScoreUI(val) {
  const scoreSlider = document.getElementById("gScore");
  const scoreValue = document.getElementById("gScoreValue");
  const scoreBubble = document.getElementById("gScoreBubble");
  const scoreWrap = scoreSlider ? scoreSlider.closest(".score-slider-wrap") : null;
  if (!scoreSlider || !scoreValue || !scoreBubble || !scoreWrap) return;

  scoreValue.textContent = val;
  scoreBubble.textContent = val;
  const min = Number(scoreSlider.min);
  const max = Number(scoreSlider.max);
  const percent = (val - min) / (max - min);
  const sliderRect = scoreSlider.getBoundingClientRect();
  const thumbWidth = 16;
  const usableWidth = sliderRect.width - thumbWidth;
  let px = percent * usableWidth + thumbWidth / 2;
  px = Math.max(thumbWidth / 2, Math.min(sliderRect.width - thumbWidth / 2, px));
  scoreBubble.style.left = px + "px";
}
