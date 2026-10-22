# Telemetry Monitor

A Windows desktop application (Angular + Electron) that monitors a simulated embedded controller in real time. It shows live **velocity**, **pressure**, and **temperature** with circular gauges, status indicators, and live trend charts, and lets the user change units, switch themes, and export the collected data.

Built with Angular 22.x (the latest major version at the time of development), Electron, and TypeScript.

---

## Table of contents

1. [Features](#features)
2. [Tech stack](#tech-stack)
3. [Prerequisites](#prerequisites)
4. [Setup](#setup)
5. [Running the application](#running-the-application)
6. [Usage guide](#usage-guide)
7. [API](#api)
8. [Architecture and technical decisions](#architecture-and-technical-decisions)
9. [Assumptions](#assumptions)
10. [Project structure](#project-structure)
11. [Testing](#testing)
12. [Known limitations](#known-limitations)
13. [Troubleshooting](#troubleshooting)

---

## Features

**Dashboard**
- Three monitoring cards: Velocity, Pressure, Temperature
- Each card shows a circular gauge, the current value, the current unit, a status badge (Normal / Warning / Critical), the last updated time, and a live trend graph

**Real-time behaviour**
- Data is fetched from the backend every second, with no page refresh
- Gauges and graphs update automatically
- Connection status (Connected / Disconnected), a loading state on first load, an error banner when the backend is unreachable, and the last successful update time
- Polling recovers automatically when the backend comes back

**Live trend graphs**
- Latest 100 samples per parameter; new values are appended and the oldest is dropped
- Timestamps on the X axis, values and units on the Y axis
- Zoom in, zoom out, pan (mouse wheel, drag, and on-screen buttons) and a reset button
- Tooltips showing timestamp, value, and unit
- Updates in place, so the chart does not flicker, and zoom is kept while new data arrives

**Unit conversion (no extra backend request)**
- Velocity: mm/s, cm/s, m/s, km/h, ft/s
- Pressure: Pa, kPa, mbar, bar, psi, atm
- Temperature: °C, °F, K
- Changing a unit instantly updates the gauge, the current value, the graph, and the axis labels

**Themes**
- Light and dark themes, switched at runtime without reloading
- The choice is remembered between sessions and defaults to the operating system preference

**Data export**
- Export the collected session data to **CSV** or **Excel (.xlsx)** at any time
- Exports include timestamps and all three parameters, in the currently selected units

---

## Tech stack

| Area | Technology |
|---|---|
| Frontend | Angular 22.x (standalone components, signals), TypeScript, SCSS |
| Desktop shell | Electron |
| Backend | Node.js, Express, TypeScript |
| Charts | Chart.js, ng2-charts, chartjs-plugin-zoom |
| Excel export | ExcelJS |
| Dev tooling | tsx, concurrently, wait-on |

---

## Prerequisites

- **Node.js 24 LTS (24.15 or newer)**, or 22.22.3 or newer. The current Angular CLI refuses to run on older Node versions.
- **npm** (installed with Node)
- **Windows** (the app is built for Windows; Electron also runs on macOS and Linux for development)

Check your versions:

```bash
node -v
npm -v
```

---

## Setup

From the project root:

```bash
# 1. Install root dependencies (Electron, backend, dev tooling)
npm install

# 2. Install frontend dependencies
npm install --prefix frontend
```

---

## Running the application

```bash
npm run dev
```

This single command starts three things:

1. The **backend** on `http://127.0.0.1:3000`
2. The **Angular dev server** on `http://127.0.0.1:4200`
3. The **Electron window**, which opens once both ports are ready

Close the Electron window and press `Ctrl+C` in the terminal to stop everything.

### Running the parts separately

```bash
npm run backend     # backend only
npm run frontend    # Angular dev server only
npm run electron    # Electron only (waits for ports 4200 and 3000)
```

You can also open `http://127.0.0.1:4200` in a normal browser while the backend is running.

---

## Usage guide

| Action | How |
|---|---|
| Change a unit | Use the dropdown in the top-right of each card |
| Zoom the chart | Mouse wheel over the chart, or the **Zoom In** / **Zoom Out** buttons |
| Pan the chart | Click and drag horizontally |
| Reset the chart view | **Reset** button above the chart |
| Switch theme | **Dark theme / Light theme** button in the header |
| Export data | **Export CSV** or **Export Excel** in the header (disabled until data has been collected) |

---

## API

The backend exposes one endpoint.

### `GET /api/dashboard`

Returns the latest telemetry and up to the latest 100 samples of history for each parameter. Values are always in the base units: velocity in `cm/s`, pressure in `mbar`, temperature in `°C`.

```json
{
  "timestamp": "2026-07-22T15:10:05.000Z",
  "velocity": {
    "value": 185.4,
    "unit": "cm/s",
    "history": [
      { "time": "15:10:04", "value": 184.6 },
      { "time": "15:10:05", "value": 185.4 }
    ]
  },
  "pressure": {
    "value": 1012,
    "unit": "mbar",
    "history": [
      { "time": "15:10:04", "value": 1011 },
      { "time": "15:10:05", "value": 1012 }
    ]
  },
  "temperature": {
    "value": 36.8,
    "unit": "°C",
    "history": [
      { "time": "15:10:04", "value": 36.7 },
      { "time": "15:10:05", "value": 36.8 }
    ]
  }
}
```

- `timestamp` is an ISO 8601 UTC timestamp.
- `time` inside each history entry is `HH:mm:ss` in UTC.
- On an internal error the endpoint responds with status `500` and `{ "error": "message" }`.

Quick check from a terminal:

```bash
curl http://127.0.0.1:3000/api/dashboard
```

### Live data simulation

- A new sample is generated every second, on a timer that is independent of incoming requests.
- For 5 cycles the values drift randomly by up to about 10% of their baseline; then for 5 cycles they return gradually toward the baseline. This repeats indefinitely.
- The latest 100 samples are kept for each parameter.

---

## Architecture and technical decisions

```
┌──────────────┐   GET /api/dashboard    ┌─────────────────────────────┐
│   Backend    │ ◄──── every 1 second ── │  Angular app (in Electron)  │
│ Express + TS │ ──── JSON (base units) ►│  gauges, charts, units,     │
│  simulator   │                         │  themes, export             │
└──────────────┘                         └─────────────────────────────┘
```

### Backend (`backend/`)
- **`TelemetrySimulator`** owns all state (current values, history, cycle counter) and ticks on its own `setInterval`. The route handler only **reads** a snapshot. This matters because generating data per request would corrupt the simulation when several clients connect.
- The server exports a `startServer(port)` function and also starts itself when run directly.

### Frontend (`frontend/`)
- **Polling:** `TelemetryService` uses RxJS `timer(0, 1000)` with `exhaustMap`, so a slow request never causes overlapping requests. `catchError` is placed on the **inner** observable, so one failed request does not terminate the polling stream; the app keeps retrying and recovers by itself.
- **State:** Angular **signals** hold the data, loading, error, and connection state. Components derive everything with `computed` signals, so there is no manual subscription handling in the UI.
- **Unit conversion:** the backend always sends base units and the frontend converts them. `UnitConversionService` contains pure functions (multipliers for velocity and pressure, formulas for temperature). Because the gauge, value, and chart are `computed` from *raw data + selected unit*, a unit change recalculates locally and makes **no HTTP request**.
- **Status logic:** status (Normal / Warning / Critical) is evaluated on the raw base-unit value, so changing the display unit never changes the status. The gauge arc is also calculated from the raw value for the same reason.
- **Charts:** the Chart.js configuration is created once. New data is written into the existing data arrays and applied with `chart.update('none')`, so the chart is not rebuilt and does not flicker. Because the update happens in place, the zoom and pan state survives live updates.
- **Themes:** colours are CSS custom properties (`--bg`, `--surface`, `--text`, ...) defined for `:root` and for `[data-theme='dark']`. `ThemeService` sets the `data-theme` attribute and stores the choice in `localStorage` (wrapped in `try/catch`). The chart reads the same CSS variables to recolour its grid and labels.
- **Export:** `ExportService` reads the in-memory session log. CSV is built manually, with a UTF-8 BOM so Excel displays `°C` / `°F` correctly. Excel files use ExcelJS, loaded on demand to keep the initial bundle small.

### Electron (`electron/`)
- `main.js` creates the window with `contextIsolation: true` and `nodeIntegration: false`.
- In development it loads the Angular dev server at `http://127.0.0.1:4200` (`127.0.0.1` is used instead of `localhost` to avoid IPv6 resolution problems on Windows) and opens DevTools.

---

## Assumptions

1. **"Randomly increase or decrease by about 10%"**: on each drift cycle every parameter changes by a random amount between -10% and +10% of its **baseline**. The value is clamped to baseline ±25% so it cannot wander indefinitely.
2. **"After every 5 update cycles, gradually return toward the original values"**: the simulation runs in a repeating block of 10 cycles: 5 drift cycles, then 5 recovery cycles. Each recovery cycle closes 40% of the remaining distance to the baseline.
3. **Baselines** are taken from the sample response: velocity 185.4 cm/s, pressure 1012 mbar, temperature 36.8 °C. Values are rounded to 1, 0, and 1 decimal places respectively.
4. **Status thresholds and gauge ranges** are not specified in the brief, so these were chosen (base units):

   | Parameter | Normal | Warning | Critical | Gauge range |
   |---|---|---|---|---|
   | Velocity (cm/s) | 150 to 220 | 120 to 150 and 220 to 250 | outside 120 to 250 | 0 to 300 |
   | Pressure (mbar) | 980 to 1040 | 950 to 980 and 1040 to 1070 | outside 950 to 1070 | 800 to 1200 |
   | Temperature (°C) | 35 to 39 | 33 to 35 and 39 to 41 | outside 33 to 41 | 0 to 80 |

5. **History size:** the API returns up to 100 samples per parameter. The sample in the brief shows 5 as an illustration.
6. **Time zones:** backend times are UTC and the chart axis is labelled "Time (UTC)". "Last updated" values in the UI are shown in the local time zone.
7. **Export:** uses the **currently selected units** (shown in the column headers) and contains the readings collected in the current session, limited to the most recent 10,000 rows. The timestamp is the time the reading was fetched.
8. **Chart X axis:** a category axis is used because the backend sends `HH:mm:ss` strings. While zoomed in, the visible window moves as the oldest samples drop off.
9. **Polling instead of WebSockets:** the brief asks the app to fetch data every second, so simple polling was used.
10. **Session data is in memory only** and is cleared when the application closes.

---

## Project structure

```
telemetry-monitor/
├── backend/
│   ├── src/
│   │   ├── server.ts            Express app and startServer()
│   │   ├── simulator.ts         Telemetry simulation engine
│   │   └── types.ts             Shared response types
│   └── tsconfig.json
├── electron/
│   └── main.js                  Electron main process
├── frontend/
│   ├── src/
│   │   ├── environments/        API base URL
│   │   ├── styles.scss          Global styles and theme variables
│   │   └── app/
│   │       ├── core/
│   │       │   ├── models/      Types and per-parameter configuration
│   │       │   └── services/    telemetry, unit-conversion, unit-selection, theme, export
│   │       ├── features/
│   │       │   └── dashboard/   Dashboard page (header, grid, states)
│   │       └── shared/
│   │           └── components/
│   │               ├── gauge-card/    Gauge, value, status, unit selector
│   │               └── trend-chart/   Live chart with zoom and pan
│   └── package.json
├── package.json                 Root scripts and Electron
└── README.md
```

---

## Testing

Run the frontend unit tests:

```bash
npm test --prefix frontend -- --watch=false
```

The unit conversion tests check the key conversions, including temperature (0 °C = 32 °F = 273.15 K), velocity (100 cm/s = 3.6 km/h), and pressure (1013.25 mbar is about 1 atm).

### Manual verification checklist

1. In DevTools, open the **Network** tab: there is exactly one request per second, and **no new request** when a unit is changed.
2. Change every unit of every parameter: the gauge, value, chart values, Y-axis title, and tooltip unit all update immediately, and the status colour does not change.
3. Stop the backend: an error banner appears, the badge turns to Disconnected, and the last values stay on screen. Start it again: the app recovers without a refresh.
4. Switch theme while the chart is zoomed in: the zoom is kept and the colours update.
5. Export CSV and Excel after about a minute and open both files.
6. Resize the window to confirm the layout adapts.

---

## Known limitations

- **Windows installer packaging is not configured.** The application is run through `npm run dev`. Building a distributable installer (for example with `electron-builder`) would also require starting the backend from the Electron main process and building the Angular app with a relative base href (`ng build --base-href ./`).
- Session data is kept in memory only and is not persisted between runs.
- Status thresholds are fixed in code (`parameter-config.ts`) and are not user-configurable.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| `ng` or Angular commands refuse to run | Your Node.js version is too old. Install Node 24 LTS (24.15 or newer). |
| The Electron window is blank or shows a connection error | Make sure `npm run dev` is used so the window waits for port 4200. Check that nothing else uses ports 3000 or 4200. |
| Port 3000 or 4200 already in use | Close old terminals or stop the other process, then run `npm run dev` again. |
| `Disconnected` badge in the app | The backend is not running. Start it with `npm run backend` or use `npm run dev`. |
| PowerShell blocks scripts | Run `Set-ExecutionPolicy RemoteSigned` in an administrator PowerShell. |
