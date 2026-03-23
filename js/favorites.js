// =====================
// Links favoritos sidebar
// =====================
function getFavLinks(cb) {
  const favRef = getUserFavLinksRef();
  if (!favRef) {
    cb([]);
    return;
  }

  favRef
    .once("value")
    .then((snapshot) => {
      const arr = snapshot.val() || [];
      localStorage.setItem(getUserStorageKey(FAV_KEY), JSON.stringify(arr));
      cb(arr);
      console.log("Links favoritos cargados desde Firebase:");
    })
    .catch((err) => {
      try {
        console.log("Error al cargar links favoritos de Firebase, usando localStorage", err);
        cb(JSON.parse(localStorage.getItem(getUserStorageKey(FAV_KEY))) || []);
      } catch {
        cb([]);
      }
    });
}

function saveFavLinks(arr) {
  const favRef = getUserFavLinksRef();
  if (!favRef) return;
  localStorage.setItem(getUserStorageKey(FAV_KEY), JSON.stringify(arr));
  favRef.set(arr);
}

function renderFavLinks() {
  getFavLinks((favs) => {
    const nav = document.getElementById("sidebarLinks");
    nav.innerHTML = "";

    favs.forEach((fav, i) => {
      const btn = document.createElement("button");
      btn.className = "sidebar-link-btn";
      btn.title = fav.url;
      btn.type = "button";
      btn.onclick = (e) => {
        if (e.target.classList.contains("fav-remove")) return;
        safeOpenExternal(fav.url);
      };

      if (fav.icon && fav.icon.startsWith("http")) {
        const img = document.createElement("img");
        img.src = fav.icon;
        img.alt = "icono";
        btn.appendChild(img);
      } else {
        btn.textContent = fav.icon || "🔗";
      }

      const delBtn = document.createElement("button");
      delBtn.className = "fav-remove";
      delBtn.type = "button";
      delBtn.title = "Eliminar link";
      delBtn.innerHTML = "";
      delBtn.onclick = (ev) => {
        ev.stopPropagation();
        openFavConfirm(i, fav);
      };

      btn.appendChild(delBtn);
      nav.appendChild(btn);
    });

    const addBtn = document.createElement("button");
    addBtn.className = "sidebar-link-btn add";
    addBtn.title = "Añadir link favorito";
    addBtn.innerHTML = "+";
    addBtn.onclick = () => openFavModal();
    nav.appendChild(addBtn);
  });
}

function openFavModal() {
  document.getElementById("favModal").classList.add("show");
  document.getElementById("favModal").setAttribute("aria-hidden", "false");
  document.getElementById("favForm").reset();
  document.getElementById("favUrl").focus();
}

function closeFavModal() {
  document.getElementById("favModal").classList.remove("show");
  document.getElementById("favModal").setAttribute("aria-hidden", "true");
}

function initFavLinksUI() {
  renderFavLinks();

  document.getElementById("favForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const url = document.getElementById("favUrl").value.trim();
    let icon = document.getElementById("favIcon").value.trim();
    if (!icon) icon = "🔗";

    getFavLinks((favs) => {
      favs.push({ url, icon });
      saveFavLinks(favs);
      renderFavLinks();
      closeFavModal();
    });
  });

  document.getElementById("favCancel").addEventListener("click", closeFavModal);
  document.getElementById("favModal").addEventListener("click", (e) => {
    if (e.target === document.getElementById("favModal")) closeFavModal();
  });
}

function openFavConfirm(index, fav) {
  pendingFavIndex = index;
  const el = document.querySelector(SELECTORS.favConfirmUrl);
  el.textContent = fav && fav.url ? fav.url : "(sin url)";
  document.querySelector(SELECTORS.favConfirmModal).classList.add("show");
  document.querySelector(SELECTORS.favConfirmModal).setAttribute("aria-hidden", "false");
}

function closeFavConfirm() {
  pendingFavIndex = null;
  document.querySelector(SELECTORS.favConfirmModal).classList.remove("show");
  document.querySelector(SELECTORS.favConfirmModal).setAttribute("aria-hidden", "true");
}
