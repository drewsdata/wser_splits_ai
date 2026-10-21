# WSER Timing Data Analysis (Static Web / GitHub Pages Edition)

An interactive analytics web application for the **Western States 100-Mile Endurance Run (WSER)** timing dataset (2017–2026), originally authored by **Drew Coughlin ([drewsdata.github.io](https://drewsdata.github.io/))** as an R Shiny application, and converted into a high-performance, client-side static Single Page Application (React + TypeScript + Vite) designed to be hosted directly on **GitHub Pages**.

---

## 🏔️ Features

1. **Results (Finish Time Distribution & DNFs)**:
   - Filter by Year range, Gender (All, Female, Male), Result (All finishes, Silver Buckle sub-24h, Bronze Buckle 24–30h, DNF), and Runner Age range.
   - Interactive histogram faceted by year (matching R Shiny `ggplot2 facet_wrap(~year)`) or combined overlay.
   - Grouped DNF count bar charts by year.
   - Summary statistics table with finishers, total entrants, % completion rate, average, median, min, and max times.

2. **Checkpoints (Segment Elapsed Time)**:
   - Dynamic selection of Start Checkpoint and End Checkpoint across all 20 official course aid stations.
   - Interactive Age vs Elapsed Time scatter plot with LOESS smoothing curves for Male, Female, and All runners.
   - Checkpoint summary statistics table.
   - Course Checkpoints Reference Table with cumulative miles, kilometers, and distance to next station.

3. **Splits (Segment Split Pacing)**:
   - Pacing calculation in either **Minutes per Mile** (`min/mi`) or **Minutes per Kilometer** (`min/km`).
   - Interactive Age vs Split Pace scatter plot with LOESS trendlines.
   - Splits summary table with MM:SS pacing statistics.

4. **Runners (Searchable Directory & Individual Split Reports)**:
   - Instant search across all 3,298 runner records by name, bib number, city, state, or country.
   - Filterable, sortable, paginated runner table.
   - Modal runner report: Clicking any runner reveals their full 20-checkpoint breakdown (cumulative time, leg split time, split pace, position at checkpoint, and position delta gained/lost) plus a position progression chart across the 100.2-mile course.
   - CSV export for filtered datasets.

5. **Distribution (Year Ridge Density Plot)**:
   - Interactive SVG density ridge visualization showing finish time distributions from 2017 to 2026, complete with individual observation dots and vertical markers for winning time, mean time, median time, and cutoff time.
   - High-resolution view of the original R-generated `year_ridge_plot.png` with download option.

6. **About (Project & Licensing)**:
   - Background information, official data source links, and CC BY-NC 4.0 license attribution for Drew Coughlin.

---

## 🚀 How to Host on GitHub Pages

Because this application runs entirely client-side with no backend or WebSocket requirements, you can host it directly on GitHub Pages using either of the following methods:

### Option 1: Automatic Deployment via GitHub Actions (Recommended)

1. In your GitHub repository, go to **Settings > Pages**.
2. Under **Build and deployment > Source**, select **GitHub Actions**.
3. Create a file in your repository at `.github/workflows/deploy.yml` with:

```yaml
name: Deploy Static App to GitHub Pages

on:
  push:
    branches: ['main']
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: 'pages'
  cancel-in-progress: true

jobs:
  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Install dependencies
        run: |
          if [ -f package-lock.json ]; then
            npm ci
          else
            npm install
          fi

      - name: Build static site
        run: npm run build

      - name: Setup Pages
        uses: actions/configure-pages@v4

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: './dist'

      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

### Option 2: Deploy using `gh-pages` npm package

```bash
# 1. Build the static site
npm run build

# 2. Deploy dist folder to the gh-pages branch
npx gh-pages -d dist
```

---

## 🛠️ Local Development

```bash
# Install dependencies
npm install

# Start local development server
npm run dev

# Run TypeScript linter
npm run lint

# Build production bundle
npm run build
```
