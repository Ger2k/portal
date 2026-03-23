// =====================
// Auth
// =====================
function getAuthErrorMessage(err) {
  const code = err && err.code ? err.code : "auth/unknown";
  const base = `Error de acceso (${code}).`;

  if (code === "auth/popup-blocked") {
    return `${base} El navegador bloqueo la ventana emergente. Se intentara el acceso por redireccion.`;
  }
  if (code === "auth/operation-not-supported-in-this-environment") {
    return `${base} Este entorno no permite popup. Se intentara acceso por redireccion.`;
  }
  if (code === "auth/unauthorized-domain") {
    return `${base} Tu dominio no esta autorizado en Firebase Authentication.`;
  }
  if (code === "auth/network-request-failed") {
    return `${base} No hay conexion o la red esta bloqueando Firebase.`;
  }

  return `${base} Revisa consola para el detalle tecnico.`;
}

async function signInWithGoogle() {
  const provider = new firebase.auth.GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  $(SELECTORS.authError).textContent = "";

  try {
    await auth.signInWithPopup(provider);
  } catch (err) {
    console.error("Error en login con Google (popup)", err);
    const code = err && err.code ? err.code : "";
    if (
      code === "auth/popup-blocked" ||
      code === "auth/operation-not-supported-in-this-environment"
    ) {
      $(SELECTORS.authError).textContent = getAuthErrorMessage(err);
      await auth.signInWithRedirect(provider);
      return;
    }
    $(SELECTORS.authError).textContent = getAuthErrorMessage(err);
  }
}

function initAuthUI() {
  auth
    .getRedirectResult()
    .catch((err) => {
      console.error("Error en login con Google (redirect)", err);
      $(SELECTORS.authError).textContent = getAuthErrorMessage(err);
    });

  $(SELECTORS.btnGoogleLogin).addEventListener("click", signInWithGoogle);

  $(SELECTORS.btnLogout).addEventListener("click", async () => {
    try {
      await auth.signOut();
    } catch (err) {
      console.error("Error cerrando sesion", err);
      alert("No se pudo cerrar sesion ahora mismo.");
    }
  });

  auth.onAuthStateChanged((user) => {
    currentUser = user || null;
    currentUid = user ? user.uid : null;
    updateSessionBadge();

    if (!user) {
      setAppLocked(true);
      clearUserScopedState();
      return;
    }

    setAppLocked(false);

    if (!appInitialized) {
      initApp();
      appInitialized = true;
    } else {
      loadGames();
      renderFavLinks();
    }
  });
}
