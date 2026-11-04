const $ = (id) => document.getElementById(id);
let unit = localStorage.getItem('unit') || 'C';
let state = null; // { place, data }
let chart = null;

const toUnit = (c) => (unit === 'C' ? c : (c * 9) / 5 + 32);
const fmt = (c) => `${Math.round(toUnit(c))}°${unit}`;

function setStatus(msg, isError = false) {
  const el = $('status');
  el.textContent = msg;
  el.className = isError ? 'error' : '';
}

async function fetchJSON(url) {
  const res = await fetch(url);
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || 'Request failed');
  return body;
}

async function searchCity(name) {
  setStatus('Searching…');
  try {
    const places = await fetchJSON(`/api/geocode?q=${encodeURIComponent(name)}`);
    if (!places.length) throw new Error(`No city found for "${name}"`);
    await loadWeather(places[0]);
  } catch (err) {
    setStatus(err.message, true);
  }
}

async function loadWeather(place) {
  setStatus('Loading forecast…');
  try {
    const data = await fetchJSON(`/api/weather?lat=${place.latitude}&lon=${place.longitude}`);
    state = { place, data };
    saveRecent(place);
    render();
    setStatus('');
  } catch (err) {
    setStatus(err.message, true);
  }
}

function placeLabel(p) {
  return [p.name, p.admin1, p.country].filter(Boolean).join(', ');
}

function render() {
  if (!state) return;
  const { place, data } = state;
  const c = data.current;

  const current = $('current');
  current.hidden = false;
  current.innerHTML = `
    <div class="now">
      <div><div class="place"></div><div class="desc">${c.label}</div></div>
      <div class="icon">${c.icon}</div>
      <div class="big">${fmt(c.temp)}</div>
    </div>
    <div class="stats">
      <div><small>Feels like</small>${fmt(c.feelsLike)}</div>
      <div><small>Humidity</small>${c.humidity}%</div>
      <div><small>Wind</small>${Math.round(c.wind)} km/h</div>
    </div>`;
  current.querySelector('.place').textContent = placeLabel(place); // textContent: safe for any city name

  // Hourly chart
  $('hourlyCard').hidden = false;
  if (chart) chart.destroy();
  chart = new Chart($('hourlyChart'), {
    type: 'line',
    data: {
      labels: data.hourly.map((h) => h.time.slice(11, 16)),
      datasets: [{
        label: `Temperature (°${unit})`,
        data: data.hourly.map((h) => Math.round(toUnit(h.temp) * 10) / 10),
        borderColor: '#2563eb',
        backgroundColor: 'rgba(37, 99, 235, 0.15)',
        fill: true,
        tension: 0.4,
        pointRadius: 2,
      }],
    },
    options: {
      plugins: { legend: { display: false } },
      scales: { y: { ticks: { callback: (v) => `${v}°` } }, x: { ticks: { maxTicksLimit: 8 } } },
    },
  });

  // 7-day list
  $('dailyCard').hidden = false;
  $('daily').innerHTML = data.daily.map((d) => {
    const day = new Date(`${d.date}T00:00`).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
    return `<li>
      <span>${day}</span><span>${d.icon}</span><span>${d.label}</span>
      <span class="temps">${fmt(d.max)} <span>/ ${fmt(d.min)}</span>
        <div class="rain">💧 ${d.rain ?? 0}%</div></span>
    </li>`;
  }).join('');
}

// ---- Recent searches (stored in the browser) ----
function getRecent() {
  try { return JSON.parse(localStorage.getItem('recent')) || []; } catch { return []; }
}
function saveRecent(place) {
  const list = [place, ...getRecent().filter((p) => placeLabel(p) !== placeLabel(place))].slice(0, 5);
  localStorage.setItem('recent', JSON.stringify(list));
  renderRecent();
}
function renderRecent() {
  const box = $('recent');
  box.innerHTML = '';
  getRecent().forEach((p) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = p.name;
    b.title = placeLabel(p);
    b.addEventListener('click', () => loadWeather(p));
    box.appendChild(b);
  });
}

// ---- Events ----
$('searchForm').addEventListener('submit', (e) => {
  e.preventDefault();
  searchCity($('cityInput').value.trim());
});

$('unitBtn').addEventListener('click', () => {
  unit = unit === 'C' ? 'F' : 'C';
  localStorage.setItem('unit', unit);
  $('unitBtn').textContent = `°${unit}`;
  render();
});

$('locBtn').addEventListener('click', () => {
  if (!navigator.geolocation) return setStatus('Geolocation is not supported by this browser', true);
  setStatus('Getting your location…');
  navigator.geolocation.getCurrentPosition(
    (pos) => loadWeather({ name: 'My location', latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
    () => setStatus('Location permission denied', true),
  );
});

// ---- Start ----
$('unitBtn').textContent = `°${unit}`;
renderRecent();
const last = getRecent()[0];
last ? loadWeather(last) : searchCity('Bengaluru');
