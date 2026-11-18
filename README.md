# Gaza – Every Life Counts

A static web app (plain HTML/CSS/JS, no dependencies, no external fonts) that visualises the reported casualty figures in the Gaza Strip since 7 October 2023. One figure is drawn for every person killed or injured. A side menu switches between Gaza (children killed / total killed), the West Bank and Lebanon (people killed / people injured). The page is available in German, English, Arabic, Spanish, French, Turkish, Russian and Chinese.

## Data
- **Live:** on every page load the browser fetches `https://data.techforpalestine.org/api/v3/summary.json` (fields `gaza.killed.total`, `gaza.killed.children`, `west_bank.killed.total`, `west_bank.injured.total`, `lebanon.killed.total`, `lebanon.injured.total` and the `last_update` date of each region).
- **Fallback:** if the live request fails, the page uses `data/summary.json`. The GitHub Action `.github/workflows/update-data.yml` refreshes this file twice a day (it can also be started manually via "Run workflow").
- No figures are hard-coded. `data/summary.json` is only an automatically maintained cache.

## Publish with GitHub Pages
1. Upload the **contents** of this `public` folder to the **root** of your repository, not the folder itself. `index.html` must sit at the top level of the repository. Make sure the hidden `.github` folder is included.
2. Go to *Settings → Pages*, choose "Deploy from a branch", then `main` and `/ (root)`.
3. Go to *Settings → Actions → General* and enable "Read and write permissions" for workflows, so the Action can commit the refreshed data.
4. Optional: run the workflow once under *Actions → Update data → Run workflow*.

Note: GitHub pauses scheduled workflows when a repository has had no activity for a long time. If that happens, start the workflow once manually.

## Files
| File | Purpose |
| --- | --- |
| `index.html`, `style.css`, `script.js` | The website |
| `favicon.svg`, `apple-touch-icon.png` | Tab icon |
| `data/summary.json` | Cached figures used as a fallback |
| `scripts/update-data.mjs` | Fetches the latest figures from the API |
| `.github/workflows/update-data.yml` | Runs the update script twice a day |
| `.nojekyll` | Tells GitHub Pages to serve the files as they are |

## Run locally
Run `python3 -m http.server 8000` in this folder and open `http://localhost:8000`.
