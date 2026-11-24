# TrustMRR: MRR by advertising channel

Chart of cumulative MRR, startup count and Q1 / average / Q3 month-over-month growth for the top TrustMRR startups, grouped by advertising channel (SEO, Meta Ads, Instagram, LinkedIn, TikTok, Cold Email, Influencers, and so on).

## Contents

- `trustmrr_channel_mrr_chart.html`: the chart (open in a browser).
- `trustmrr_channel_mrr_chart_summary.json`: the per-channel numbers behind it.
- `data/dataset_trustmrr_2026-11-24_05-48-03-811.json`: the Apify dataset (2,513 records: 1,702 channel links and 811 startup profiles), scraped 2026-11-24.
- `scripts/build-chart.js`: builds the chart and summary from any dataset with the same shape.
- `scripts/fetch-dataset.js`: runs the Apify actor `AtACnjhCvlcGC4nl3` (TrustMRR Startup scraper) and saves its dataset.
- `skill/trustmrr-channel-mrr-chart/`: the Claude skill that runs the actor and rebuilds the chart. Includes `input.json`, the actor input.

## Usage

Requires Node.js 18+ and no other dependencies.

Rebuild the chart from the included dataset:

```
node scripts/build-chart.js data/dataset_trustmrr_2026-11-24_05-48-03-811.json trustmrr_channel_mrr_chart.html
```

Fetch a fresh dataset from Apify and rebuild (needs an Apify API token):

```
APIFY_TOKEN=<your token> node scripts/fetch-dataset.js skill/trustmrr-channel-mrr-chart/input.json data/dataset_latest.json
node scripts/build-chart.js data/dataset_latest.json trustmrr_channel_mrr_chart.html
```

## Definitions

- **Cumulative MRR**: sum of MRR of the startups listed under the channel.
- **Count**: number of startups listed under the channel.
- **Q1 / Q3 MoM**: 1st and 3rd quartile of month-over-month growth (linear interpolation, like Excel `QUARTILE.INC`).
- **AVG MoM**: mean month-over-month growth.
- Startups with an empty MoM value are excluded from the MoM statistics only.
- A startup can appear in several channels, so cumulative MRR across channels overlaps and should not be summed.

## Input assumption

The actor input used for the included dataset is inferred, because the original input was not recorded: the 23 `/channels/<slug>` URLs, `scrollLimit` 3 (about 90 startups per channel), and profile plus extended-profile scraping on. See `skill/trustmrr-channel-mrr-chart/input.json`.

Data is from TrustMRR (https://trustmrr.com). Check its terms before reusing the data.
