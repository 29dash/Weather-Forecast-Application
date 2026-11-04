// Talks to the free Open-Meteo APIs (no API key required) and returns
// clean, small objects that the frontend can render directly.

const GEO_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';
const CACHE_TTL_MS = 10 * 60 * 1000; // keep a forecast for 10 minutes
const cache = new Map();

// WMO weather interpretation codes -> text + emoji
const WEATHER_CODES = {
  0: ['Clear sky', '☀️'], 1: ['Mainly clear', '🌤️'], 2: ['Partly cloudy', '⛅'], 3: ['Overcast', '☁️'],
  45: ['Fog', '🌫️'], 48: ['Rime fog', '🌫️'],
  51: ['Light drizzle', '🌦️'], 53: ['Drizzle', '🌦️'], 55: ['Heavy drizzle', '🌦️'],
  56: ['Freezing drizzle', '🌧️'], 57: ['Freezing drizzle', '🌧️'],
  61: ['Light rain', '🌧️'], 63: ['Rain', '🌧️'], 65: ['Heavy rain', '🌧️'],
  66: ['Freezing rain', '🌧️'], 67: ['Freezing rain', '🌧️'],
  71: ['Light snow', '🌨️'], 73: ['Snow', '🌨️'], 75: ['Heavy snow', '❄️'], 77: ['Snow grains', '❄️'],
  80: ['Light showers', '🌦️'], 81: ['Showers', '🌧️'], 82: ['Violent showers', '⛈️'],
  85: ['Snow showers', '🌨️'], 86: ['Heavy snow showers', '❄️'],
  95: ['Thunderstorm', '⛈️'], 96: ['Thunderstorm with hail', '⛈️'], 99: ['Thunderstorm with hail', '⛈️'],
};

export function describeWeather(code) {
  const [label, icon] = WEATHER_CODES[code] ?? ['Unknown', '❓'];
  return { label, icon };
}

function httpError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}

async function getJSON(url) {
  let res;
  try {
    res = await fetch(url, { signal: AbortSignal.timeout(8000) });
  } catch {
    throw httpError(502, 'Weather service unreachable');
  }
  if (!res.ok) throw httpError(502, 'Weather service returned an error');
  return res.json();
}

export async function searchCity(name) {
  const query = String(name ?? '').trim();
  if (query.length < 2) throw httpError(400, 'Enter at least 2 characters');
  const params = new URLSearchParams({ name: query, count: '5', language: 'en', format: 'json' });
  const data = await getJSON(`${GEO_URL}?${params}`);
  return (data.results ?? []).map(({ name, country, admin1, latitude, longitude }) => ({
    name, country, admin1, latitude, longitude,
  }));
}

export async function getForecast(lat, lon) {
  lat = Number(lat);
  lon = Number(lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) {
    throw httpError(400, 'Invalid coordinates');
  }

  const key = `${lat.toFixed(2)},${lon.toFixed(2)}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.data;

  const params = new URLSearchParams({
    latitude: lat,
    longitude: lon,
    current: 'temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m',
    hourly: 'temperature_2m',
    daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunrise,sunset',
    timezone: 'auto',
    forecast_days: '7',
  });
  const raw = await getJSON(`${FORECAST_URL}?${params}`);

  // Keep only the next 24 hours, starting from the current hour.
  const c = raw.current;
  const startHour = c.time.slice(0, 13) + ':00';
  let start = raw.hourly.time.findIndex((t) => t >= startHour);
  if (start < 0) start = 0;
  const hourly = raw.hourly.time.slice(start, start + 24).map((time, i) => ({
    time,
    temp: raw.hourly.temperature_2m[start + i],
  }));

  const daily = raw.daily.time.map((date, i) => ({
    date,
    ...describeWeather(raw.daily.weather_code[i]),
    max: raw.daily.temperature_2m_max[i],
    min: raw.daily.temperature_2m_min[i],
    rain: raw.daily.precipitation_probability_max[i],
    sunrise: raw.daily.sunrise[i],
    sunset: raw.daily.sunset[i],
  }));

  const data = {
    timezone: raw.timezone,
    current: {
      time: c.time,
      temp: c.temperature_2m,
      feelsLike: c.apparent_temperature,
      humidity: c.relative_humidity_2m,
      wind: c.wind_speed_10m,
      ...describeWeather(c.weather_code),
    },
    hourly,
    daily,
  };
  cache.set(key, { at: Date.now(), data });
  return data;
}
