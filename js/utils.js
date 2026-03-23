// =====================
// Helpers
// =====================
const $ = (sel) => document.querySelector(sel);
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("es-ES") : "-");

function escapeHtml(s) {
  if (!s) return "";
  return String(s).replace(
    /[&<>"]|'/g,
    (m) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      }[m])
  );
}

function debounce(fn, wait) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
}

function safeOpenExternal(url) {
  try {
    const parsed = new URL(url, window.location.href);
    if (!/^https?:$/.test(parsed.protocol)) return;
    window.open(parsed.href, "_blank", "noopener,noreferrer");
  } catch (err) {
    console.warn("URL invalida", err);
  }
}

function normalizeGamesData(raw) {
  if (Array.isArray(raw)) return raw.filter(Boolean);
  if (raw && typeof raw === "object") return Object.values(raw).filter(Boolean);
  return [];
}

function sanitizeImageUrl(url) {
  if (!url) return "";
  try {
    const parsed = new URL(url, window.location.href);
    return /^https?:$/.test(parsed.protocol) ? parsed.href : "";
  } catch {
    return "";
  }
}

function setAppLocked(locked) {
  document.body.classList.toggle("auth-required", locked);
  $(SELECTORS.authModal).classList.toggle("show", locked);
  $(SELECTORS.authModal).setAttribute("aria-hidden", locked ? "false" : "true");
}

function getUserStorageKey(baseKey) {
  return currentUid ? `${baseKey}_${currentUid}` : baseKey;
}

function getUserGamesRef() {
  return currentUid ? db.ref(`users/${currentUid}/games`) : null;
}

function getUserFavLinksRef() {
  return currentUid ? db.ref(`users/${currentUid}/favlinks`) : null;
}

function clearUserScopedState() {
  games = [];
  pendingDeleteId = null;
  pendingFavIndex = null;
  editingId = null;
  renderGames();
  document.getElementById("sidebarLinks").innerHTML = "";
}

function updateSessionBadge() {
  $(SELECTORS.userEmail).textContent = currentUser
    ? currentUser.email || "Sesion iniciada"
    : "Sin sesion";
  $(SELECTORS.btnLogout).style.display = currentUser ? "inline-flex" : "none";
}
