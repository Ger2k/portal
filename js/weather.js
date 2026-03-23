// =====================
// Weather
// =====================
async function fetchWeather(lat, lon) {
  try {
    $(SELECTORS.wTemp).textContent = "...";
    $(SELECTORS.wDesc).textContent = "Cargando...";
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${encodeURIComponent(
      lat
    )}&longitude=${encodeURIComponent(
      lon
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
      $(SELECTORS.wPlace).textContent = `Lat ${lat.toFixed(4)}, Lon ${lon.toFixed(4)}`;
      localStorage.setItem(WEATHER_KEY, JSON.stringify({ lat, lon }));
    } else {
      $(SELECTORS.wDesc).textContent = "No hay datos actuales";
    }
  } catch (err) {
    $(SELECTORS.wDesc).textContent = "Error al obtener tiempo";
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
