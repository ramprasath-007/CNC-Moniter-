# CNC Micro-Stoppage Monitor — Start here

Complete source code, including the Production Loss Monitoring page.
Exported 30 September 2026.

## Run on your computer

1. Extract this ZIP completely.
2. Install Node.js 22.13 or newer if it is not already installed.
3. Open the extracted CNC-Micro-Stoppage-Monitor folder in VS Code.
4. Open a terminal in that folder and run:

```sh
npm install
npm run dev
```

5. Open the local address printed by the terminal (normally http://localhost:5173).
6. Choose **Production Loss** in the sidebar. Its demonstration dataset works immediately.

This is a React + TypeScript / Vinext project. Run it through the development server; there is no standalone index.html to double-click. Internet access is needed for the initial dependency installation. Dependencies are deliberately not bundled in this source ZIP.

## Show the production-loss demonstration

The labelled synthetic eight-hour shift has 35 interruptions totalling 19 minutes. Default example assumptions are 30 seconds per unit and ₹100 per minute. The dashboard estimates 38 units lost, ₹1,900 lost and 3.96% capacity loss. Edit the cycle-time and cost inputs to update the cards, charts, breakdown and CSV export.

For animated sensor readings, open **Simulation** and explicitly enable Demo Mode. For real telemetry, configure your own Firebase Realtime Database in **Settings**. The standalone production-loss sample remains separate from machine history.

## Included

- Eleven views: Overview, Production Loss, Live Monitor, Micro-Stoppage Events, Analytics, Machine Performance, Reports, Devices & Sensors, System Architecture, Simulation, Settings.
- All application source, styles, UI components, configuration, lockfile and local build scripts.
- Synthetic datasets, calculations, CSV exports, Firebase read adapter and calculation tests.
- README.md with Firebase paths, examples, metric definitions and limitations.

## Useful commands

```sh
npm run build
node --test tests/monetary-loss.test.cjs
```

The build targets Cloudflare Workers through Vinext. Hosting on a different provider can require adapting the build configuration. For local demonstrations, use npm run dev.

## Scope

Production counts and money are estimates based on duration and assumptions. The sample is synthetic, not a measurement from a physical CNC machine. ESP32 firmware, Firebase credentials and real machine data are not included. The Firebase adapter reads data written by your device/backend.

Source snapshot: ee931701cdaaf003f527c245c41cca2c6b8ca1d0
