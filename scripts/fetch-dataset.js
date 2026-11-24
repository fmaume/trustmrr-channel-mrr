#!/usr/bin/env node
// Run the TrustMRR Startup scraper Apify actor and save its dataset as JSON.
//
// Usage:
//   APIFY_TOKEN=<your token> node scripts/fetch-dataset.js <input.json> <output.json>
//
// Uses the Apify REST API (no dependencies): start the run, poll until it finishes,
// then download every item of the run's default dataset.

const fs = require('fs');

const ACTOR_ID = 'AtACnjhCvlcGC4nl3'; // advantageous_subcontra/trustmrr (TrustMRR Startup scraper)
const API = 'https://api.apify.com/v2';

const [, , inputArg, outputArg] = process.argv;
const token = process.env.APIFY_TOKEN;
if (!inputArg || !outputArg) {
  console.error('Usage: APIFY_TOKEN=<token> node scripts/fetch-dataset.js <input.json> <output.json>');
  process.exit(1);
}
if (!token) {
  console.error('APIFY_TOKEN is not set. Create a token at https://console.apify.com/account/integrations.');
  process.exit(1);
}

const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const input = JSON.parse(fs.readFileSync(inputArg, 'utf8'));

  // 1. Start the run.
  const startRes = await fetch(`${API}/acts/${ACTOR_ID}/runs`, {
    method: 'POST',
    headers,
    body: JSON.stringify(input),
  });
  if (!startRes.ok) throw new Error(`Start failed: ${startRes.status} ${await startRes.text()}`);
  const { data: run } = await startRes.json();
  console.log(`Run started: ${run.id}`);

  // 2. Poll until finished.
  let status = run.status;
  let current = run;
  while (!['SUCCEEDED', 'FAILED', 'ABORTED', 'TIMED-OUT'].includes(status)) {
    await sleep(15000);
    const res = await fetch(`${API}/actor-runs/${run.id}`, { headers });
    current = (await res.json()).data;
    status = current.status;
    console.log(`  status: ${status}`);
  }
  if (status !== 'SUCCEEDED') throw new Error(`Run ended with status ${status}`);

  // 3. Download all dataset items (paginated).
  const datasetId = current.defaultDatasetId;
  const items = [];
  const pageSize = 1000;
  for (let offset = 0; ; offset += pageSize) {
    const res = await fetch(`${API}/datasets/${datasetId}/items?format=json&clean=true&offset=${offset}&limit=${pageSize}`, { headers });
    if (!res.ok) throw new Error(`Dataset download failed: ${res.status}`);
    const page = await res.json();
    items.push(...page);
    if (page.length < pageSize) break;
  }

  fs.writeFileSync(outputArg, JSON.stringify(items, null, 2));
  console.log(`Saved ${items.length} items to ${outputArg}`);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
