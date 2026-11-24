#!/usr/bin/env node
// Build the "MRR by advertising channel" chart from a TrustMRR Apify dataset.
//
// Usage:
//   node scripts/build-chart.js <dataset.json> [output.html]
//
// The dataset mixes two record types (as returned by the TrustMRR Startup scraper):
//   - link records:    { categoryUrl, startupProfile }   -> channel membership
//   - profile records: { profileUrl, MRR, MoMGrowth, ... } -> metrics
// Each startup is joined to its channel by startupProfile === profileUrl.
//
// Per channel:
//   cumulative MRR = sum of member startups' MRR
//   count          = number of member startups
//   Q1 / Q3        = 1st and 3rd quartile of MoMGrowth (linear interpolation, like Excel QUARTILE.INC)
//   average        = mean of MoMGrowth
// Startups with a non-numeric MoMGrowth (e.g. "") are excluded from the MoM stats only.

const fs = require('fs');
const path = require('path');

const [, , inputArg, outputArg] = process.argv;
if (!inputArg) {
  console.error('Usage: node scripts/build-chart.js <dataset.json> [output.html]');
  process.exit(1);
}
const outputPath = outputArg || path.join(__dirname, '..', 'trustmrr_channel_mrr_chart.html');

const items = JSON.parse(fs.readFileSync(inputArg, 'utf8'));
const profiles = new Map(items.filter((r) => r.profileUrl).map((p) => [p.profileUrl, p]));
const links = items.filter((r) => r.categoryUrl && r.startupProfile);

const channels = {};
for (const link of links) {
  const profile = profiles.get(link.startupProfile);
  if (!profile) continue;
  const slug = link.categoryUrl.split('/').filter(Boolean).pop();
  const c = (channels[slug] ||= { slug, mrr: 0, startups: new Set(), mom: [] });
  c.mrr += Number(profile.MRR) || 0;
  c.startups.add(profile.profileUrl);
  if (typeof profile.MoMGrowth === 'number') c.mom.push(profile.MoMGrowth);
}

const quantile = (values, q) => {
  const a = [...values].sort((x, y) => x - y);
  const h = (a.length - 1) * q;
  const lo = Math.floor(h);
  const next = a[lo + 1] ?? a[lo];
  return a[lo] + (h - lo) * (next - a[lo]);
};
const mean = (values) => values.reduce((x, y) => x + y, 0) / values.length;

const rows = Object.values(channels)
  .map((c) => ({
    channel: c.slug,
    cumulativeMRR: Math.round(c.mrr * 100) / 100,
    count: c.startups.size,
    momN: c.mom.length,
    q1: c.mom.length ? quantile(c.mom, 0.25) : null,
    avgMoM: c.mom.length ? mean(c.mom) : null,
    q3: c.mom.length ? quantile(c.mom, 0.75) : null,
  }))
  .sort((a, b) => b.cumulativeMRR - a.cumulativeMRR);

const fmtMRR = (v) => (v >= 1e6 ? `$${(v / 1e6).toFixed(2)}M` : `$${Math.round(v / 1e3)}k`);
const fmtPct = (v) => (v == null ? 'n/a' : `${v > 0 ? '+' : ''}${v.toFixed(1)}%`);
const pillCls = (v) => (v == null ? 'zero' : v > 0 ? 'pos' : v < 0 ? 'neg' : 'zero');
const maxMRR = Math.max(...rows.map((r) => r.cumulativeMRR));

const body = rows
  .map(
    (r) => `<tr>
<td class='ch'>${r.channel}</td>
<td class='barcell'><div class='track'><div class='bar' style='width:${((r.cumulativeMRR / maxMRR) * 100).toFixed(1)}%'></div><span class='val'>${fmtMRR(r.cumulativeMRR)}</span></div></td>
<td class='num'>${r.count}</td>
<td class='num'><span class='pill ${pillCls(r.q1)}'>${fmtPct(r.q1)}</span></td>
<td class='num'><span class='pill ${pillCls(r.avgMoM)}'>${fmtPct(r.avgMoM)}</span></td>
<td class='num'><span class='pill ${pillCls(r.q3)}'>${fmtPct(r.q3)}</span></td>
</tr>`
  )
  .join('\n');

const html = `<!doctype html><html><head><meta charset='utf-8'><meta name='viewport' content='width=device-width,initial-scale=1'>
<title>MRR by Advertising Channel</title>
<style>
body{margin:0;background:#0b0e14;color:#e8ecf2;font-family:Inter,Segoe UI,Arial,sans-serif;padding:32px 16px}
.card{max-width:1100px;margin:auto;background:#0d1117;border-radius:14px;padding:28px 28px 20px}
h1{font-size:26px;margin:0 0 6px}
.sub{color:#8b95a7;font-size:14px;margin-bottom:18px}
table{width:100%;border-collapse:collapse;font-size:14px}
th{text-align:left;color:#6b7689;font-family:Consolas,monospace;font-size:12px;letter-spacing:.06em;padding:8px 6px;border-bottom:1px solid #222a36}
th.num,td.num{text-align:center}
td{padding:9px 6px;border-bottom:1px solid #161c26;vertical-align:middle}
td.ch{width:22%;white-space:nowrap}
td.barcell{width:44%}
.track{position:relative;background:#161c26;border-radius:4px;height:26px}
.bar{height:26px;border-radius:4px;background:linear-gradient(90deg,#2fbf8f,#38b6ff)}
.val{position:absolute;right:8px;top:4px;font-family:Consolas,monospace;font-size:13px;color:#fff;text-shadow:0 1px 2px #000}
.pill{display:inline-block;min-width:74px;padding:4px 8px;border-radius:6px;font-family:Consolas,monospace;font-size:13px}
.pos{background:#0f3d2c;color:#5ef0b0}.neg{background:#3d1a1f;color:#ff8a94}.zero{background:#222a36;color:#c9d1dc}
.note{margin-top:16px;font-size:12px;color:#8b95a7;line-height:1.5}
</style></head><body><div class='card'>
<h1>MRR by Advertising Channel — TrustMRR Top Startups</h1>
<div class='sub'>Cumulative MRR = sum of member startups' MRR · Count = startups listed under the channel · MoM = Q1 / average / Q3 month-over-month growth</div>
<table><thead><tr><th>CHANNEL</th><th>CUMULATIVE MRR</th><th class='num'>COUNT</th><th class='num'>Q1 MoM</th><th class='num'>AVG MoM</th><th class='num'>Q3 MoM</th></tr></thead>
<tbody>
${body}
</tbody></table>
<div class='note'>Startups appear in multiple channels, so cumulative MRR across channels overlaps and should not be summed into a total. Startups with an empty MoM value are excluded from the MoM stats only. Averages are pulled up by a few very large MoM outliers driven by small starting bases; the 1st and 3rd quartiles show the middle 50% spread and are less sensitive to them. Source: ${path.basename(inputArg)}.</div>
</div></body></html>`;

fs.writeFileSync(outputPath, html);
const summaryPath = outputPath.replace(/\.html$/, '') + '_summary.json';
fs.writeFileSync(summaryPath, JSON.stringify(rows, null, 2));
console.log(`Wrote ${outputPath} (${rows.length} channels)`);
console.log(`Wrote ${summaryPath}`);
