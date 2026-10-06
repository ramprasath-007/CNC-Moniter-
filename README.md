# CNC Micro-Stoppage Monitoring System

A React + TypeScript frontend with eleven monitoring views, Chart.js charts, an isolated educational simulator, event inspection, computed analytics, CSV/print reports and Firebase Realtime Database reading services.

## Run locally

Requires Node.js 22.13 or newer.

```sh
npm install
npm run dev
```

The managed checkout uses pnpm; its lockfile is included. `npm run build` creates the deployment build.

## Data behavior

Hardware mode is always the startup default. The telemetry simulator starts only when explicitly enabled. The Overview shortcut and Production Loss page separately show a labelled synthetic sample shift without starting that simulator. Demo data exists only in memory and is never written to Firebase. Refreshing disables simulation. Fresh hardware telemetry preempts a running demo, clears all demo history from the visible dashboard and reloads real records.

The browser polls Firebase using the configured refresh interval. Settings stores only device-local preferences. Optional short-lived Firebase user ID tokens are held in memory, not browser storage. Use your existing authenticated read rules; do not put database secrets or service-account keys in this frontend. An application sign-in/token-refresh integration is a future deployment task, not implemented here.

## Firebase integration

Enter your own Realtime Database root URL in Settings and, if your rules require it, a current Firebase user ID token. The frontend is read-only; the ESP32/backend must write machine data and durable event/history records.

Paths:

- `/machines/CNC-001/live`
- `/machines/CNC-001/history/<chronologically ordered key>` (last 25,000 records)
- `/machines/CNC-001/events/<chronologically ordered key>` (last 5,000 records)
- `/system/devices` (optional status metadata)

Use Firebase push keys or other chronologically sortable keys. The dashboard normalizes timestamp values, sorts them, validates the selected machine and rejects SIMULATION records arriving through the hardware adapter. Use ISO 8601 timestamps with timezone (`2026-09-23T09:30:00+05:30`) or epoch milliseconds/seconds. The ESP32 must have a synchronized clock.

Live telemetry example:

```json
{"machineId":"CNC-001","timestamp":"2026-09-23T09:30:00+05:30","current":2.84,"vibration":1.37,"machineStatus":"RUNNING","microStoppage":false,"stoppageDuration":0,"transport":"WIFI"}
```

States: RUNNING, IDLE, MICRO-STOPPAGE, STOPPED, OFFLINE. Transport: WIFI (current), LORA_GATEWAY (future). SIMULATION is reserved for the in-browser demo.

Current is measured in amperes; vibration is the firmware-defined calibrated magnitude in g. Define whether gravity has been removed and use the same convention when calibrating thresholds. Threshold settings here only change chart guides and demo duration settings, not firmware. Hardware detection is authoritative.

Completed event example:

```json
{"machineId":"CNC-001","startTime":"2026-09-23T09:12:16+05:30","endTime":"2026-09-23T09:12:23+05:30","currentBefore":2.91,"currentDuring":0.42,"currentAfter":2.85,"vibrationBefore":1.21,"vibrationDuring":0.18,"vibrationAfter":1.24,"transport":"WIFI"}
```

Event duration is calculated from the start and end timestamps. Missing before/after readings remain blank. Event graphs use actual nearby history samples. Sensor self-test status is shown only when explicitly supplied through device metadata; readings alone are not treated as independent health checks.

## Metric definitions and limits

Operating time comes from RUNNING intervals. Available time is the sum of observed RUNNING, IDLE, MICRO-STOPPAGE and STOPPED intervals. Intervals longer than the offline timeout are excluded as unknown. Utilization = operating / observed available time. Downtime = STOPPED + MICRO-STOPPAGE. Idle remains separately reported. Reports therefore describe the loaded observation window, not complete shift OEE.

Production-loss percentage is the micro-stop share of observed time. Estimated units lost = recorded micro-stop duration / configured cycle time. These are estimates, not measured production counts. Reports snapshot their inputs at generation and label the data source. The simulator includes clearly generated recent and six preceding daily histories for demonstration.

CSV generation escapes spreadsheet formula prefixes. Browser printing provides a printable report; it is not a server PDF service. Hardware storage, ESP32 firmware, production authentication, firmware threshold updates and unlimited historical querying are outside this frontend implementation.

## Structure

- `src/services/firebase.ts`: read adapter and telemetry validation
- `src/services/telemetryService.ts`: centralized source selection, polling and simulator lifecycle
- `src/services/eventService.ts`: event normalization and CSV exports
- `src/utils/calculations.ts`: time-weighted metrics and activity segments
- `src/data/mockTelemetry.ts`: explicit-only demo generator
- `src/components`: shared chart, table, machine visualization and detail components
- `src/views`: monitoring, analytics, reports, device, architecture, simulation and settings views

The layout uses hash navigation for bookmarkable views while keeping a single telemetry subscription alive. No real hardware is claimed to be connected until fresh validated telemetry is received.

## Estimated money loss (INR)

Settings → Downtime cost (₹ per minute) accepts your assumed cost of one stopped machine-minute. The default is blank; absent cost or absent records displays an em dash, not an invented rate or zero. A deliberately entered zero is supported. Preferences remain local to the browser.

Estimated micro-stoppage money loss = completed micro-stoppage seconds / 60 × cost per minute. For example, 300 seconds at ₹100/minute estimates ₹500. The amount excludes planned idle and sustained stopped time, and is not an AI forecast, measured profit loss, or projected future loss.

The Overview, Machine Performance, event details and reports show this estimate. Event CSV exports include estimated_loss_INR and assumed_cost_INR_per_minute; summary exports include estimated_micro_stop_loss_INR. Report rate assumptions are frozen at generation. Changing your saved rate recalculates dashboard and event estimates but does not silently alter a generated report.

## Production loss demonstration

Open **Production Loss** in the sidebar (or the Overview shortcut). This view opens a labelled synthetic eight-hour shift without starting the telemetry simulator or changing machine settings. Its 35 sample interruptions total 1,140 seconds. At the illustrative 30 seconds/unit and ₹100/minute, this gives 38 cycle-equivalent units lost, ₹1,900 estimated cost and 3.96% time loss. Ideal capacity is 960 units; capacity after micro-stops is 922 units. Neither is measured output.

Editable assumptions recalculate cards, capacity comparison, interval loss chart, cumulative monetary chart, breakdown and CSV. Each export labels its source and includes the assumptions. Inputs apply only to this analysis. The **Machine records** option instead uses loaded hardware or explicitly started simulator records for today or seven days; demo records are never inserted into hardware history. Events crossing intervals have their time split while their count is attributed once to the starting interval. Gaps are excluded from observed time, and capacity percentages are withheld when event coverage is incomplete. Actual output, rejects, planned idle and other downtime are outside the comparison.
