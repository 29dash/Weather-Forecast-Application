# 🌤️ SkyCast – Weather Forecast Application

A simple full-stack weather forecast web app. Search any city (or use your location) to see the current
conditions, a 24-hour temperature chart and a 7-day forecast.

Built for **AAT-1 – Full Stack Technologies (22CSE71)**, New Horizon College of Engineering.

## Features

- 🔍 City search with geocoding
- 📍 "Use my location" button (browser geolocation)
- 🌡️ Current temperature, feels-like, humidity and wind
- 📈 Next-24-hours temperature chart (Chart.js)
- 📅 7-day forecast with rain probability
- 🔁 °C / °F toggle (remembered in the browser)
- 🕘 Recent searches (stored in `localStorage`)
- ⚡ 10-minute server-side cache to reduce API calls
- ☁️ One-click deployment on Vercel (serverless functions)

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | HTML5, CSS3, JavaScript (ES6), Chart.js 4 |
| Backend | Node.js 18+, Express 4 |
| Serverless | Vercel Serverless Functions (`api/`) |
| Weather data | [Open-Meteo](https://open-meteo.com/) Forecast + Geocoding APIs (free, **no API key**) |
| Testing | Node.js built-in test runner (`node --test`) |

## Project Structure

```
Weather-Forecast-Application/
├── api/                    # Vercel serverless entry points
│   ├── geocode.js
│   └── weather.js
├── public/                 # Frontend (served as static files)
│   ├── index.html
│   ├── style.css
│   └── app.js
├── server/                 # Express backend + shared logic
│   ├── index.js            # Local server
│   ├── handlers.js         # Request handlers (shared with api/)
│   └── weatherService.js   # Open-Meteo calls, formatting, cache
├── test/
│   └── weatherService.test.js
├── DEPLOYMENT.md
├── vercel.json
├── package.json
└── README.md
```

## Getting Started

```bash
git clone https://github.com/<your-username>/Weather-Forecast-Application.git
cd Weather-Forecast-Application
npm install
npm start
```

Open <http://localhost:3000>. No `.env` file is required (optional: set `PORT`, see `.env.example`).

Run the tests:

```bash
npm test
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/geocode?q=<city>` | Returns up to 5 matching places (name, region, country, latitude, longitude) |
| GET | `/api/weather?lat=<lat>&lon=<lon>` | Returns current weather, next 24 hours and 7-day forecast |

Errors are returned as JSON: `{ "error": "message" }` with status 400 (bad input) or 502 (weather service problem).

## Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for Vercel steps.

## Future Enhancements

- Choose between multiple matching cities
- Air-quality index and UV index
- Weather alerts and saved favourite cities (with login)
- Dark mode and PWA / offline support

## Credits

Weather data from [Open-Meteo.com](https://open-meteo.com/) (CC BY 4.0).

## License

MIT
