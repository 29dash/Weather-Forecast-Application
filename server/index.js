import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { geocodeHandler, weatherHandler } from './handlers.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, '..', 'public')));
app.get('/api/geocode', geocodeHandler); // /api/geocode?q=Bengaluru
app.get('/api/weather', weatherHandler); // /api/weather?lat=12.97&lon=77.59

app.listen(PORT, () => console.log(`SkyCast running at http://localhost:${PORT}`));
