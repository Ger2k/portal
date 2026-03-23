// =====================
// UI y eventos
// =====================
function doSearch() {
  const q = $(SELECTORS.googleQuery).value.trim();
  if (!q) return;
  const url = "https://www.google.com/search?q=" + encodeURIComponent(q);
  safeOpenExternal(url);
}

function initSearchUI() {
  $(SELECTORS.btnSearch).addEventListener("click", doSearch);
  $(SELECTORS.googleQuery).addEventListener("keydown", (e) => {
    if (e.key === "Enter") doSearch();
  });

  document.addEventListener("keydown", (e) => {
    if (
      e.key === "/" &&
      document.activeElement.tagName !== "INPUT" &&
      document.activeElement.tagName !== "TEXTAREA"
    ) {
      e.preventDefault();
      $(SELECTORS.googleQuery).focus();
    }
  });
}

function initSortUI() {
  const sortSelect = $(SELECTORS.gamesSort);
  if (!sortSelect) return;

  sortSelect.value = gamesSortOrder;
  sortSelect.addEventListener("change", (e) => {
    gamesSortOrder = e.target.value || "date-desc";
    renderGames();
  });
}

function initGameActionsUI() {
  $(SELECTORS.gamesList).addEventListener("click", (e) => {
    const editButton = e.target.closest(".js-edit-game");
    if (editButton) {
      openEdit(editButton.dataset.gameId);
      return;
    }
    const deleteButton = e.target.closest(".js-delete-game");
    if (deleteButton) {
      deleteGame(deleteButton.dataset.gameId);
    }
  });
}

function initGameModalUI() {
  $(SELECTORS.btnAdd).addEventListener("click", () => {
    editingId = null;
    $(SELECTORS.modalTitle).textContent = "Añadir juego";
    $(SELECTORS.gameForm).reset();
    const today = new Date().toISOString().slice(0, 10);
    $(SELECTORS.gDate).value = today;
    $(SELECTORS.coverStatus).textContent = "sin buscar";
    $(SELECTORS.gScore).value = 0;
    $(SELECTORS.gScoreValue).textContent = 0;
    document.getElementById("coverThumbGallery").innerHTML = "";
    updateScoreUI(0);
    updateCoverPreview();
    $(SELECTORS.modal).classList.add("show");
    $(SELECTORS.modal).setAttribute("aria-hidden", "false");
    $(SELECTORS.gTitle).focus();
  });

  $(SELECTORS.btnCancel).addEventListener("click", () => {
    $(SELECTORS.modal).classList.remove("show");
    $(SELECTORS.modal).setAttribute("aria-hidden", "true");
  });

  $(SELECTORS.btnFindCover).addEventListener("click", async () => {
    const title = $(SELECTORS.gTitle).value.trim();
    if (!title) {
      alert("Introduce primero el título");
      return;
    }
    $(SELECTORS.coverStatus).textContent = "Buscando...";
    const gallery = document.getElementById("coverThumbGallery");
    gallery.innerHTML = "";
    document.getElementById("coverPreviewWrap").innerHTML = "";

    try {
      const imgs = await fetchCoverRAWG(title);
      if (imgs && imgs.length) {
        imgs.forEach((imgUrl, idx) => {
          const thumb = document.createElement("img");
          thumb.src = imgUrl;
          thumb.title = "Elegir esta portada";
          thumb.addEventListener("click", () => {
            $(SELECTORS.gCover).value = imgUrl;
            updateCoverPreview();
            gallery
              .querySelectorAll("img")
              .forEach((img) => img.classList.remove("selected"));
            thumb.classList.add("selected");
          });
          if (
            $(SELECTORS.gCover).value === imgUrl ||
            (idx === 0 && !$(SELECTORS.gCover).value)
          ) {
            thumb.classList.add("selected");
          }
          gallery.appendChild(thumb);
        });
        if (!$(SELECTORS.gCover).value) {
          $(SELECTORS.gCover).value = imgs[0];
        }
        updateCoverPreview();
        $(SELECTORS.coverStatus).textContent = "Elige la portada correcta";
      } else {
        $(SELECTORS.coverStatus).textContent =
          "No encontrada (usa URL manualmente o guarda y luego edita)";
      }
    } catch (e) {
      $(SELECTORS.coverStatus).textContent = "Error al buscar";
      console.error(e);
    }
  });

  $(SELECTORS.gCover).addEventListener("input", () => {
    const val = $(SELECTORS.gCover).value.trim();
    document
      .getElementById("coverThumbGallery")
      .querySelectorAll("img")
      .forEach((img) => {
        img.classList.remove("selected");
        if (img.src === val) img.classList.add("selected");
      });
    updateCoverPreview();
  });

  $(SELECTORS.gameForm).addEventListener("submit", async (e) => {
    e.preventDefault();
    const payload = {
      title: $(SELECTORS.gTitle).value.trim(),
      platform: $(SELECTORS.gPlatform).value.trim(),
      date: $(SELECTORS.gDate).value || "",
      score: $(SELECTORS.gScore).value ? Number($(SELECTORS.gScore).value) : null,
      hours: $(SELECTORS.gHours).value ? Number($(SELECTORS.gHours).value) : null,
      cover: $(SELECTORS.gCover).value.trim(),
      notes: $(SELECTORS.gNotes).value.trim(),
    };

    if (!payload.cover && payload.title) {
      $(SELECTORS.coverStatus).textContent = "Buscando portada...";
      try {
        const imgs = await fetchCoverRAWG(payload.title);
        if (imgs && imgs.length) {
          payload.cover = imgs[0];
          $(SELECTORS.coverStatus).textContent = "Portada encontrada y asignada";
        } else {
          $(SELECTORS.coverStatus).textContent = "No se encontró portada automáticamente";
        }
      } catch (err) {
        console.warn(err);
        $(SELECTORS.coverStatus).textContent = "Error buscando portada";
      }
    }

    if (editingId) {
      updateGame(editingId, payload);
      editingId = null;
    } else {
      addGame(payload);
    }

    $(SELECTORS.modal).classList.remove("show");
    $(SELECTORS.modal).setAttribute("aria-hidden", "true");
  });

  $(SELECTORS.btnExport).addEventListener("click", exportJSON);
  $(SELECTORS.fileImport).addEventListener("change", (e) => {
    const f = e.target.files[0];
    if (f) importJSON(f);
    e.target.value = "";
  });
}

function initWeatherUI() {
  $(SELECTORS.btnGeo).addEventListener("click", () => {
    if (!navigator.geolocation) {
      alert("Geolocalización no disponible en este navegador");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        $(SELECTORS.inpLat).value = lat;
        $(SELECTORS.inpLon).value = lon;
        fetchWeather(lat, lon);
      },
      (err) => {
        alert("Error geolocalización: " + err.message);
      }
    );
  });

  $(SELECTORS.btnFetchWeather).addEventListener("click", () => {
    const lat = parseFloat($(SELECTORS.inpLat).value);
    const lon = parseFloat($(SELECTORS.inpLon).value);
    if (Number.isFinite(lat) && Number.isFinite(lon)) {
      fetchWeather(lat, lon);
    } else {
      alert("Introduce coordenadas válidas");
    }
  });

  showDefaultWeatherIfNeeded();
}

function initDeleteModalsUI() {
  $(SELECTORS.btnCancelDelete).addEventListener("click", closeConfirmModal);
  $(SELECTORS.confirmModal).addEventListener("click", (e) => {
    if (e.target === $(SELECTORS.confirmModal)) closeConfirmModal();
  });
  $(SELECTORS.btnConfirmDelete).addEventListener("click", () => {
    if (!pendingDeleteId) return;
    games = games.filter((x) => x.id !== pendingDeleteId);
    saveGames();
    renderGames();
    closeConfirmModal();
  });

  $(SELECTORS.btnCancelFavDelete).addEventListener("click", closeFavConfirm);
  $(SELECTORS.favConfirmModal).addEventListener("click", (e) => {
    if (e.target === $(SELECTORS.favConfirmModal)) closeFavConfirm();
  });
  $(SELECTORS.btnConfirmFavDelete).addEventListener("click", () => {
    if (pendingFavIndex === null) {
      closeFavConfirm();
      return;
    }
    getFavLinks((favs2) => {
      if (pendingFavIndex >= 0 && pendingFavIndex < favs2.length) {
        favs2.splice(pendingFavIndex, 1);
        saveFavLinks(favs2);
        renderFavLinks();
      }
      closeFavConfirm();
    });
  });
}

function initScoreSliderUI() {
  const scoreSlider = $(SELECTORS.gScore);
  if (!scoreSlider) return;

  scoreSlider.addEventListener("input", (e) => {
    updateScoreUI(e.target.value);
  });

  const modal = $(SELECTORS.modal);
  const observer = new MutationObserver(() => {
    if (modal.classList.contains("show")) {
      setTimeout(() => updateScoreUI(scoreSlider.value), 10);
    }
  });
  observer.observe(modal, {
    attributes: true,
    attributeFilter: ["class"],
  });

  window.addEventListener("resize", () => updateScoreUI(scoreSlider.value));
  updateScoreUI(scoreSlider.value);
}

function initApp() {
  initSortUI();
  loadGames();
  initFavLinksUI();
  initSearchUI();
  initGameActionsUI();
  initGameModalUI();
  initWeatherUI();
  initDeleteModalsUI();
  initScoreSliderUI();
}
