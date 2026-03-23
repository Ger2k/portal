# Portal personal de juegos

Aplicacion web estatica para gestionar juegos completados, links favoritos, busqueda rapida y clima.

## Caracteristicas

- Login con Google (Firebase Authentication).
- Datos por usuario aislados en Firebase Realtime Database.
- CRUD de juegos completados con notas, puntuacion, horas y portada.
- Sidebar de links favoritos por usuario.
- Busqueda en Google desde la portada.
- Clima actual por coordenadas con Open-Meteo.
- Importacion y exportacion de juegos en JSON.

## Estructura del proyecto

```text
.
├─ index.html
├─ styles.css
├─ README.md
├─ netlify/
│  └─ functions/
│     └─ rawg-cover.js
└─ js/
   ├─ config.js
   ├─ utils.js
   ├─ favorites.js
   ├─ games.js
   ├─ weather.js
   ├─ auth.js
   ├─ ui.js
   └─ main.js
```

## Arquitectura JavaScript

- `js/config.js`: constantes, selectores, estado global e inicializacion de Firebase.
- `js/utils.js`: helpers comunes y utilidades de sesion/rutas por usuario.
- `js/favorites.js`: logica de links favoritos.
- `js/games.js`: almacenamiento y CRUD de juegos, render y portada RAWG.
- `js/weather.js`: consulta y cache local de clima.
- `js/auth.js`: flujo de login/logout con Google y manejo de errores.
- `js/ui.js`: inicializacion de eventos de interfaz.
- `js/main.js`: punto de entrada de la app (`DOMContentLoaded`).

## Requisitos

- Navegador moderno.
- Proyecto Firebase con:
  - Authentication (Google) habilitado.
  - Realtime Database con reglas por `uid`.
  - Dominios autorizados en Authentication (local y produccion).

## Configuracion Firebase

La configuracion se encuentra en `js/config.js`, dentro de `FIREBASE_CONFIG`.

Campos esperados:

- `apiKey`
- `authDomain`
- `databaseURL`
- `projectId`
- `storageBucket`
- `messagingSenderId`
- `appId`

## Reglas recomendadas de Realtime Database

```json
{
  "rules": {
    "users": {
      "$uid": {
        ".read": "auth != null && auth.uid === $uid",
        ".write": "auth != null && auth.uid === $uid"
      }
    },
    "games": { ".read": false, ".write": false },
    "favlinks": { ".read": false, ".write": false }
  }
}
```

## Desarrollo local

Puedes abrir la app con un servidor local simple.

Ejemplo con `serve`:

```bash
npx serve .
```

Luego abre la URL que te indique el servidor (por ejemplo `http://127.0.0.1:3000`).

Importante: no usar `file://` para probar login con Google.

Si quieres probar tambien la Netlify Function en local, usa:

```bash
npx netlify dev
```

Esto levanta la web y expone `/.netlify/functions/*` localmente.

## Variables de entorno (Netlify)

Para ocultar secretos, la key de RAWG no vive en frontend. Ahora se lee desde la funcion serverless.

Configura en Netlify:

1. Site configuration > Environment variables
2. Crear variable: `RAWG_API_KEY`
3. Valor: tu key real de RAWG
4. Guardar y redeploy del sitio

La funcion que la usa es `netlify/functions/rawg-cover.js`.

## Dominios autorizados (Auth)

En Firebase Console > Authentication > Settings > Authorized domains, agrega:

- `localhost`
- `127.0.0.1`
- tu dominio de produccion (por ejemplo Netlify)

Sin esto, aparecera `auth/unauthorized-domain`.

## Despliegue

La app es estatica y se puede desplegar en Netlify, Vercel, GitHub Pages o Firebase Hosting.

Checklist de despliegue:

1. Subir archivos (`index.html`, `styles.css`, `js/*`).
2. Confirmar dominio en Authorized domains.
3. Validar login en produccion.
4. Verificar reglas de base de datos activas.

## Smoke test recomendado

1. Login con Cuenta A.
2. Crear 1 juego y 1 link favorito.
3. Logout.
4. Login con Cuenta B y comprobar que inicia vacio.
5. Volver a Cuenta A y comprobar que recupera sus datos.
6. Probar editar/borrar juego, import/export y clima.

## Notas

- La busqueda de portadas usa un proxy serverless (`/.netlify/functions/rawg-cover`) para no exponer la key RAWG en cliente.
- El proxy prioriza caratulas (`background_image`) por coincidencia de titulo y usa capturas (`short_screenshots`) solo como fallback.
- El fallback de login intenta popup y, si falla por entorno, usa redirect.