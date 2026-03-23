// =====================
// Weather
// =====================
const DEFAULT_WEATHER_LOCATION = { lat: 40.3989, lon: -3.6944 };

function formatCoords(lat, lon) {
  return `Lat ${Number(lat).toFixed(4)}, Lon ${Number(lon).toFixed(4)}`;
}

async function resolvePlaceName(lat, lon) {
  const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${encodeURIComponent(
    lat
  )}&longitude=${encodeURIComponent(lon)}&localityLanguage=es`;

  const res = await fetch(url);
  if (!res.ok) throw new Error("No se pudo resolver la ubicacion");

  const data = await res.json();
  const city =
    (data && (data.city || data.locality || data.principalSubdivision)) || "";
  const admin = (data && data.principalSubdivision) || "";
  const country =
    (data && (data.countryName || data.countryCode || data.country)) || "";

  if (city && country) return `${city}, ${country}`;
  if (city && admin) return `${city}, ${admin}`;
  if (city) return city;
  if (country) return country;
  return "";
}

async function fetchWeather(lat, lon) {
  const safeLat = Number(lat);
  const safeLon = Number(lon);

  if (!Number.isFinite(safeLat) || !Number.isFinite(safeLon)) {
    $(SELECTORS.wDesc).textContent = "Coordenadas no validas";
    return;
  }

  try {
    $(SELECTORS.wTemp).textContent = "...";
    $(SELECTORS.wDesc).textContent = "Cargando...";
    $(SELECTORS.wPlace).textContent = "Buscando ubicacion...";

    const url = `https://api.open-meteo.com/v1/forecast?latitude=${encodeURIComponent(
      safeLat
    )}&longitude=${encodeURIComponent(
      safeLon
    )}&current_weather=true&temperature_unit=celsius&timezone=auto`;

    const res = await fetch(url);
    if (!res.ok) throw new Error("Respuesta del servidor no valida");

    const data = await res.json();
    if (data && data.current_weather) {
      const cw = data.current_weather;
      $(SELECTORS.wTemp).textContent = Math.round(cw.temperature) + " °C";
      $(SELECTORS.wDesc).textContent =
        (weatherCodes[cw.weathercode] || "Condicion #" + cw.weathercode) +
        " · velocidad " +
        cw.windspeed +
        " m/s";

      let placeLabel = "";
      try {
        placeLabel = await resolvePlaceName(safeLat, safeLon);
      } catch (err) {
        console.warn("No se pudo resolver la ubicacion", err);
      }

      $(SELECTORS.wPlace).textContent = placeLabel || formatCoords(safeLat, safeLon);
      localStorage.setItem(
        WEATHER_KEY,
        JSON.stringify({ lat: safeLat, lon: safeLon, place: placeLabel || "" })
      );
    } else {
      $(SELECTORS.wDesc).textContent = "No hay datos actuales";
      $(SELECTORS.wPlace).textContent = formatCoords(safeLat, safeLon);
    }
  } catch (err) {
    $(SELECTORS.wDesc).textContent = "Error al obtener tiempo";
    $(SELECTORS.wPlace).textContent = formatCoords(safeLat, safeLon);
    console.error(err);
  }
}

function tryLoadWeatherFromStorage() {
  const raw = localStorage.getItem(WEATHER_KEY);
  if (!raw) return false;
  try {
    const s = JSON.parse(raw);
    const storedLat = Number(s.lat);
    const storedLon = Number(s.lon);
    if (Number.isFinite(storedLat) && Number.isFinite(storedLon)) {
      $(SELECTORS.inpLat).value = storedLat;
      $(SELECTORS.inpLon).value = storedLon;

      if (s.place) {
        $(SELECTORS.wPlace).textContent = s.place;
      }

      fetchWeather(storedLat, storedLon);
      return true;
    }
  } catch (e) {
    console.warn(e);
  }
  return false;
}

function tryLoadWeatherFromGeolocation() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = Number(pos.coords.latitude);
        const lon = Number(pos.coords.longitude);
        if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
          resolve(false);
          return;
        }

        $(SELECTORS.inpLat).value = lat;
        $(SELECTORS.inpLon).value = lon;
        fetchWeather(lat, lon);
        resolve(true);
      },
      (err) => {
        console.warn("No se pudo obtener geolocalizacion inicial", err);
        resolve(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 9000,
        maximumAge: 300000,
      }
    );
  });
}

async function showDefaultWeatherIfNeeded() {
  const loaded = tryLoadWeatherFromStorage();
  if (loaded) return;

  $(SELECTORS.wPlace).textContent = "Detectando ubicacion...";
  const geoLoaded = await tryLoadWeatherFromGeolocation();
  if (!geoLoaded) {
    const lat = DEFAULT_WEATHER_LOCATION.lat;
    const lon = DEFAULT_WEATHER_LOCATION.lon;
    $(SELECTORS.inpLat).value = lat;
    $(SELECTORS.inpLon).value = lon;
    fetchWeather(lat, lon);
  }
}
