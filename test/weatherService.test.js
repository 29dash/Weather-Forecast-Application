import test from 'node:test';
import assert from 'node:assert/strict';
import { describeWeather, searchCity, getForecast } from '../server/weatherService.js';

const mockFetch = (payload, ok = true) => {
  globalThis.fetch = async () => ({ ok, json: async () => payload });
};

test('describeWeather maps known and unknown WMO codes', () => {
  assert.equal(describeWeather(0).label, 'Clear sky');
  assert.equal(describeWeather(95).label, 'Thunderstorm');
  assert.equal(describeWeather(12345).label, 'Unknown');
});

test('searchCity returns simplified results', async () => {
  mockFetch({ results: [{ name: 'Bengaluru', country: 'India', admin1: 'Karnataka', latitude: 12.97, longitude: 77.59, id: 1 }] });
  const out = await searchCity('Bengaluru');
  assert.deepEqual(out, [{ name: 'Bengaluru', country: 'India', admin1: 'Karnataka', latitude: 12.97, longitude: 77.59 }]);
});

test('searchCity returns an empty list when nothing matches', async () => {
  mockFetch({});
  assert.deepEqual(await searchCity('zzzzzz'), []);
});

test('searchCity rejects very short queries', async () => {
  await assert.rejects(() => searchCity('a'), { status: 400 });
});

test('getForecast rejects invalid coordinates', async () => {
  await assert.rejects(() => getForecast('abc', 10), { status: 400 });
  await assert.rejects(() => getForecast(120, 10), { status: 400 });
});

test('getForecast trims hourly data to 24 hours from the current hour', async () => {
  const hours = Array.from({ length: 48 }, (_, i) => `2026-11-04T${String(i % 24).padStart(2, '0')}:00`.replace('2026-11-04', i < 24 ? '2026-11-04' : '2026-11-05'));
  mockFetch({
    timezone: 'Asia/Kolkata',
    current: { time: '2026-11-04T10:15', temperature_2m: 28, apparent_temperature: 30, relative_humidity_2m: 60, wind_speed_10m: 9, weather_code: 2 },
    hourly: { time: hours, temperature_2m: hours.map((_, i) => 20 + i) },
    daily: {
      time: ['2026-11-04'], weather_code: [61], temperature_2m_max: [31], temperature_2m_min: [22],
      precipitation_probability_max: [70], sunrise: ['2026-11-04T06:10'], sunset: ['2026-11-04T17:48'],
    },
  });
  const out = await getForecast(12.97, 77.59);
  assert.equal(out.hourly.length, 24);
  assert.equal(out.hourly[0].time, '2026-11-04T10:00');
  assert.equal(out.current.label, 'Partly cloudy');
  assert.equal(out.daily[0].label, 'Light rain');
});
