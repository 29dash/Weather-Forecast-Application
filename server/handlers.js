// Request handlers shared by the Express server and the Vercel serverless functions.
import { searchCity, getForecast } from './weatherService.js';

function sendError(res, err) {
  res.status(err.status ?? 500).json({ error: err.message ?? 'Something went wrong' });
}

export async function geocodeHandler(req, res) {
  try {
    res.status(200).json(await searchCity(req.query.q));
  } catch (err) {
    sendError(res, err);
  }
}

export async function weatherHandler(req, res) {
  try {
    res.status(200).json(await getForecast(req.query.lat, req.query.lon));
  } catch (err) {
    sendError(res, err);
  }
}
