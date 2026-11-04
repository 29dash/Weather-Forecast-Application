# Deploying SkyCast to Vercel

SkyCast needs **no environment variables** because Open-Meteo is free and keyless.

## Steps

1. Push this project to a GitHub repository.
2. Sign in at <https://vercel.com> with GitHub and click **Add New → Project**.
3. Import the `Weather-Forecast-Application` repository.
4. Leave the framework preset as **Other**. `vercel.json` already sets the output directory to `public`.
5. Click **Deploy**.

Vercel serves `public/` as the website and turns every file in `api/` into a serverless function:

| File | URL |
|------|-----|
| `api/geocode.js` | `/api/geocode?q=Bengaluru` |
| `api/weather.js` | `/api/weather?lat=12.97&lon=77.59` |

Every push to the `main` branch triggers a new deployment automatically.

## Local run (without Vercel)

```bash
npm install
npm start      # http://localhost:3000
```

## Troubleshooting

- **404 on `/api/...`** – make sure the `api/` folder is in the repository root.
- **"Weather service unreachable"** – the Open-Meteo API could not be reached; try again later.
