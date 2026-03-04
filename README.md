# Vermont Town Meeting Day Turnout Map (2014–2024)

Interactive, static web map and charts for Vermont town-level turnout trends, including:
- choropleth map of turnout by municipality,
- polling-place point layer,
- year and metric controls,
- statewide and town-level trend charts.

This project is intended for lightweight publishing (no backend required) and reproducible data updates.

## Website
[https://uvm-ccn.github.io/vt-town-meeting-2026/](https://uvm-ccn.github.io/vt-town-meeting-2026/)

## Table of Contents

- [Project Overview](#project-overview)
- [What the App Shows](#what-the-app-shows)
- [Repository Structure](#repository-structure)
- [Data Inputs](#data-inputs)
- [Local Development](#local-development)
- [Data Update Workflow](#data-update-workflow)
- [Geocoding Polling Places](#geocoding-polling-places)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)
- [Attribution and License](#attribution-and-license)

## Project Overview

The app is a static Leaflet + D3 site that loads local CSV/GeoJSON files at runtime and renders:
- a town polygon choropleth (`vermont-towns.geojson`),
- polling place markers (`Data/geocoded_polling_places.csv`),
- turnout trends from `Data/Turnout Statistics/Combined/town-meeting-absentee-col-rm.csv`,
- a population vs turnout scatterplot from `Data/vt-town-pops-2022.csv`.

No build step is required.

## What the App Shows

### Map interactions
- Town fill colors by selected turnout metric (`Australian Ballot` or `Floor Vote`)
- Year slider covering **2014–2024**
- Layer toggles for turnout polygons and polling places
- Town search with autocomplete
- Town popup with year-specific values
- Town sidebar chart (selected town turnout over time)

### Charts
- Statewide average turnout trend by year
- Population vs floor-vote turnout scatterplot (2022)

## Repository Structure

```text
.
├── index.html
├── styles.css
├── script.js
├── vermont-towns.geojson
├── deploy.sh
├── geocode_polling_places.py
├── vt-town-meeting-map-2026.html
├── README.md
├── LICENSE
├── analysis/
│   └── exploration.ipynb
└── Data/
    ├── geocoded_polling_places.csv
    ├── clean-tabula-2025_vermont_election_polling_places.csv
    ├── vt-town-pops-2022.csv
    ├── vt-town-pops.csv
    ├── Turnout Statistics/
    │   ├── Combined/
    │   └── Raw/
    └── Voting Methods/
        ├── Combined/
        └── Raw/
```

### Primary runtime entry point
- `index.html` is the main app page.
- `vt-town-meeting-map-2026.html` is an alternate map-focused page.

## Data Inputs

The current app expects these files and paths to exist exactly:

- `vermont-towns.geojson`
- `Data/Turnout Statistics/Combined/town-meeting-absentee-col-rm.csv`
- `Data/vt-town-pops-2022.csv`
- `Data/geocoded_polling_places.csv`

### Turnout CSV expectations
The JS parser reads columns by index in this order:
1. town
2. floor vote turnout
3. australian ballot turnout
4. year

Turnout values are expected as decimals (e.g., `0.245`), not percentages.

## Local Development

### Prerequisites
- Git
- Any static HTTP server (examples below)
- Optional (for geocoding script): Python 3.9+

### Run locally

```bash
git clone https://github.com/<your-org-or-user>/vt-town-meeting-2026.git
cd vt-town-meeting-2026
python3 -m http.server 8000
```

Open: <http://localhost:8000>

Alternative static servers:
- `npx http-server`
- VS Code Live Server extension

## Data Update Workflow

Use this sequence to keep updates reproducible:

1. **Update raw turnout or voting-method files** under `Data/.../Raw/`.
2. **Regenerate combined files** (R Markdown notebooks in `Data/.../Raw/` if you are using that workflow).
3. **Refresh geocoded polling places** if source polling addresses changed.
4. **Verify app loads without console errors** and spot-check several towns/years.
5. **Commit data + code together** so data and app logic stay in sync.

## Geocoding Polling Places

Script: `geocode_polling_places.py`

### Install dependencies

```bash
python3 -m pip install pandas geopy
```

### Run

```bash
python3 geocode_polling_places.py
```

### Input/output
- Input: `Data/clean-tabula-2025_vermont_election_polling_places.csv`
- Output: `Data/geocoded_polling_places.csv`

Notes:
- Uses Nominatim via `geopy`.
- Includes rate limiting (`1 request/second`) to respect service usage.

## Deployment

### Option A: GitHub Pages with current script

```bash
chmod +x deploy.sh
./deploy.sh
```

### Important deployment note

The current `deploy.sh` copies top-level files but **does not copy the `Data/` directory**. Since `index.html` fetches data from `Data/...`, deploys will be incomplete unless you include `Data/` in your deployment process.

Recommended actions before relying on `deploy.sh` for production:
- update `deploy.sh` to copy `Data/` recursively,
- run a smoke test on the deployed site (map + both charts + polling layer).

### Option B: Generic static hosting

Deploy the full repository contents (including `Data/`) to any static host:
- GitHub Pages
- Netlify
- Vercel
- S3/CloudFront
- University web hosting

## Troubleshooting

- **Blank map or missing charts:** verify you are serving over HTTP, not opening files directly via `file://`.
- **Fetch 404 errors:** confirm data paths and capitalization match exactly.
- **No polling markers:** check `Data/geocoded_polling_places.csv` has `latitude`, `longitude`, and `geocode_status=success` rows.
- **Town search misses values:** ensure names in data match town names in `vermont-towns.geojson`.
- **Mobile controls not visible:** year and metric controls are intentionally hidden on small screens.

## Attribution and License

### Geospatial boundaries
- Source: Vermont Center for Geographic Information (VCGI)
- Dataset: VT town boundaries (GeoJSON exported in this repo)
- Policy: Vermont Open Geodata Policy (attribution required)

### Turnout and polling information
- Source context: Vermont Secretary of State election resources
- Additional transformations and combined files are maintained in this repository

### License

Code in this repository is licensed under MIT (see `LICENSE`).

Data may have separate attribution and reuse requirements from their original providers. Always include proper source attribution when republishing derived outputs.

---

Maintainer tip: if you add or rename data files, update both `script.js` fetch paths and this README in the same PR.
