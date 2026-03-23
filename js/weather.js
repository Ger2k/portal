// =====================
// Weather
// =====================
function formatCoords(lat, lon) {
  return `Lat ${Number(lat).toFixed(4)}, Lon ${Number(lon).toFixed(4)}`;
}

async function resolvePlaceName(lat, lon) {
  const url = `https://geocoding-api.open-meteo.com/v1/reverse?latitude=${encodeURIComponent(
    lat
  )}&longitude=${encodeURIComponent(lon)}&language=es&count=1`;

  const res = await fetch(url);
  if (!res.ok) throw new Error("No se pudo resolver la ubicacion");

  const data = await res.json();
  const first = data && Array.isArray(data.results) ? data.results[0] : null;
  if (!first) return "";

  const city = first.city || first.name || "";
  const admin = first.admin1 || "";
  const country = first.country || "";

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
    if (s.lat && s.lon) {
      $(SELECTORS.inpLat).value = s.lat;
      $(SELECTORS.inpLon).value = s.lon;

      if (s.place) {
        $(SELECTORS.wPlace).textContent = s.place;
      }

      fetchWeather(Number(s.lat), Number(s.lon));
      return true;
    }
  } catch (e) {
    console.warn(e);
  }
  return false;
}

function showDefaultWeatherIfNeeded() {
  const loaded = tryLoadWeatherFromStorage();
  if (!loaded) {
    const lat = 40.3989;
    const lon = -3.6944;
    $(SELECTORS.inpLat).value = lat;
    $(SELECTORS.inpLon).value = lon;
    fetchWeather(lat, lon);
  }
}
