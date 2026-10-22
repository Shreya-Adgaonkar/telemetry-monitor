# Telemetry Monitor

Windows desktop application (Angular + Electron) that monitors a simulated embedded controller in real time: velocity, pressure, and temperature.

## Features
- Live dashboard with circular gauges, status (Normal / Warning / Critical), and last-updated time
- Real-time trend charts (latest 100 samples) with zoom in, zoom out, pan, and tooltips
- Runtime unit conversion without extra backend requests
- Light and dark themes
- CSV and Excel export of the collected session data
- Connection status, loading, and error states

## Tech stack
Angular 22.x (latest at time of development), Electron, TypeScript, Node.js + Express backend, Chart.js, ExcelJS.

## Prerequisites
- Node.js [24.22.1]
- npm

## Setup
```bash
npm install
npm install --prefix frontend
```

## Run (development)
```bash
npm run dev
```
Starts the backend (port 3000), the Angular dev server (port 4200), and the Electron window.

## Build a Windows installer
```bash
npm run dist
```
The installer is created in `release/`. [Note any limitations you hit.]

## API
`GET /api/dashboard` returns:
```json
{
  "timestamp": "2026-07-22T15:10:05Z",
  "velocity": { "value": 185.4, "unit": "cm/s", "history": [{ "time": "15:10:05", "value": 185.4 }] },
  "pressure": { "value": 1012, "unit": "mbar", "history": [] },
  "temperature": { "value": 36.8, "unit": "°C", "history": [] }
}
```
`history` holds up to the latest 100 samples per parameter.

## Architecture
- **backend/**: Express server. A simulator class ticks every second on its own timer; the route only reads the current snapshot, so multiple clients cannot corrupt the simulation.
- **frontend/**: Angular standalone components with signals.
  - `TelemetryService` polls every second using `timer` + `exhaustMap` (no overlapping requests). `catchError` sits inside the inner stream so a failed request never stops polling.
  - `UnitConversionService` holds pure conversion functions. The backend always sends base units (cm/s, mbar, °C); the frontend converts, so changing a unit needs no HTTP request.
  - Gauges and charts use `computed` signals derived from raw data and the selected unit.
  - Charts are created once and updated in place with `chart.update('none')` to avoid flicker.
  - Themes use CSS custom properties switched by a `data-theme` attribute.
- **electron/**: `main.js` opens the window. In development it loads the Angular dev server; in the packaged app it starts the backend and loads the built files.

## Assumptions
- "Randomly change by ~10%": each drift tick adds a random change of up to ±10% of the baseline, clamped to baseline ±25%.
- "After every 5 cycles, return gradually": 5 drift cycles, then 5 recovery cycles that each close 40% of the gap to the baseline, repeating forever.
- Status thresholds and gauge ranges (base units):
  - Velocity: normal 150–220, warning 120–250, gauge 0–300
  - Pressure: normal 980–1040, warning 950–1070, gauge 800–1200
  - Temperature: normal 35–39, warning 33–41, gauge 0–80
- The API returns up to 100 history samples; the sample in the brief shows 5 as an illustration.
- Backend times are UTC; the chart axis is labelled UTC, and "last updated" is shown in local time.
- Export uses the currently selected units and includes up to the last 10,000 samples of the session. The timestamp is the time the reading was fetched.
- The chart uses a category X axis, so while zoomed the visible window slides as old samples drop off.
- Polling is used instead of WebSockets because the brief asks to fetch every second.

## Folder structure
```
backend/    Express + simulator (TypeScript)
frontend/   Angular app
electron/   Electron main process
```