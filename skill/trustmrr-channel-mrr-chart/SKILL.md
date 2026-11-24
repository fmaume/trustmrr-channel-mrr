---
name: trustmrr-channel-mrr-chart
description: Call the Apify actor AtACnjhCvlcGC4nl3 (TrustMRR Startup scraper) with the channel input, then generate the "MRR by advertising channel" chart (cumulative MRR, count, Q1/average/Q3 MoM growth per channel). Use when the user asks to refresh, regenerate or rebuild the TrustMRR channel MRR graph or dataset.
---

# TrustMRR channel MRR chart

Produces the same chart as `trustmrr_channel_mrr_chart.html` from a fresh run of the
TrustMRR Startup scraper actor.

## Inputs

- `input.json` (in this skill folder): the actor input for the 23 `/channels/<slug>` URLs,
  with profile scraping and extended fields on.
- `APIFY_TOKEN` environment variable: the user's Apify API token.

## Steps

Run from the repository root.

1. Fetch the dataset from the actor:

   ```powershell
   $env:APIFY_TOKEN = "<token>"
   node scripts/fetch-dataset.js skill/trustmrr-channel-mrr-chart/input.json data/dataset_latest.json
   ```

2. Build the chart and summary from the dataset:

   ```powershell
   node scripts/build-chart.js data/dataset_latest.json trustmrr_channel_mrr_chart.html
   ```

   This writes `trustmrr_channel_mrr_chart.html` and `trustmrr_channel_mrr_chart_summary.json`.

3. Report the channel count and the top channels by cumulative MRR. Open the HTML to check it renders.

## Definitions

- **Cumulative MRR**: sum of MRR across the channel's startups.
- **Count**: number of startups listed under the channel.
- **Q1 / Q3 MoM**: 1st and 3rd quartile of month-over-month growth (linear interpolation, same as Excel QUARTILE.INC).
- **AVG MoM**: mean MoM growth.
- Startups with an empty MoM value are excluded from the MoM statistics only.
- A startup can belong to several channels, so cumulative MRR across channels overlaps.

## Notes

- A run can take several minutes because every startup profile is scraped.
- `build-chart.js` joins link records to profile records by URL, so it depends on the record shapes this actor returns. If the actor's output schema changes, update the script first.
- Keep the input in sync with the channel list. If a channel is added, update `input.json`.
