// Data schema validator for ChargingMap.
// Pure Node built-ins only. Usage: node scripts/validate-data.mjs [--list=<path>]
// Aggregates ALL assertion failures (no fail-fast) and exits 1 if any failed.
/* global process */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DATA_DIR = path.join(ROOT, 'public', 'data');
const listArg = process.argv.find((a) => a.startsWith('--list='));
const LIST_PATH = listArg
  ? path.resolve(process.cwd(), listArg.slice('--list='.length))
  : path.join(DATA_DIR, 'station_list.json');
const DETAILS_DIR = path.join(DATA_DIR, 'details');
const DETAILS_FILE = path.join(DATA_DIR, 'station_details.json');

const MIN_STATIONS = 1;
const MAX_STATIONS = 1000;
const BBOX = { lngMin: 117.0, lngMax: 117.6, latMin: 31.2, latMax: 32.2 };
const ALLOWED_STATUS = new Set([0, 1, 2, 3, 255]);
const PERIOD_COUNT = 8;
const ID_PATTERN = /^HF\d{6}$/;
const MAX_SAMPLES = 10;

const RESULTS = []; // { name, failures: string[] }

function assert(name, check) {
  const failures = [];
  try {
    check(failures);
  } catch (err) {
    failures.push(`断言执行异常: ${err && err.message ? err.message : String(err)}`);
  }
  RESULTS.push({ name, failures });
}

function sample(items) {
  const arr = Array.from(items);
  const shown = arr.slice(0, MAX_SAMPLES);
  const suffix = arr.length > MAX_SAMPLES ? ` ... (共 ${arr.length} 项，仅列前 ${MAX_SAMPLES} 项)` : '';
  return shown.join('; ') + suffix;
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function loadDetails() {
  // Future layout: public/data/details/*.json (sharded, merged when the dir exists).
  if (fs.existsSync(DETAILS_DIR) && fs.statSync(DETAILS_DIR).isDirectory()) {
    const merged = {};
    const duplicateIds = [];
    const files = fs
      .readdirSync(DETAILS_DIR)
      .filter((f) => f.toLowerCase().endsWith('.json'))
      .sort();
    for (const file of files) {
      const data = readJson(path.join(DETAILS_DIR, file));
      if (!isPlainObject(data)) continue;
      for (const [id, detail] of Object.entries(data)) {
        if (Object.prototype.hasOwnProperty.call(merged, id)) duplicateIds.push(id);
        merged[id] = detail;
      }
    }
    return { details: merged, layout: `sharded (${files.length} files)`, duplicateIds, ok: true };
  }
  if (fs.existsSync(DETAILS_FILE)) {
    const data = readJson(DETAILS_FILE);
    return { details: isPlainObject(data) ? data : {}, layout: 'single file', duplicateIds: [], ok: isPlainObject(data) };
  }
  return { details: {}, layout: 'missing', duplicateIds: [], ok: false };
}

// --- Load ---------------------------------------------------------------
const list = fs.existsSync(LIST_PATH) ? readJson(LIST_PATH) : null;
const listIsArray = Array.isArray(list);
const listRecords = listIsArray ? list : [];
const { details, layout, duplicateIds, ok: detailsOk } = loadDetails();

const listIds = listRecords.map((s) => (s && typeof s === 'object' ? s.stationId : undefined));
const detailIds = Object.keys(details);
const listIdSet = new Set(listIds.filter((id) => typeof id === 'string'));
const detailIdSet = new Set(detailIds);

// 1. Record count must be 1..1000.
assert('记录数', (f) => {
  if (!listIsArray) {
    f.push(`station_list.json 不是数组（路径 ${LIST_PATH}）`);
    return;
  }
  if (list.length < MIN_STATIONS || list.length > MAX_STATIONS) {
    f.push(`列表记录数 ${list.length}，要求 ${MIN_STATIONS}..${MAX_STATIONS}`);
  }
});

// 2. stationId must be unique.
assert('stationId 唯一性', (f) => {
  const seen = new Set();
  const dupes = new Set();
  const malformed = [];
  for (let i = 0; i < listRecords.length; i++) {
    const id = listRecords[i] && listRecords[i].stationId;
    if (typeof id !== 'string' || id.length === 0) {
      malformed.push(`index ${i}`);
      continue;
    }
    if (seen.has(id)) dupes.add(id);
    seen.add(id);
  }
  if (dupes.size > 0) f.push(`重复 stationId: ${sample(dupes)}`);
  if (malformed.length > 0) f.push(`缺少 stationId: ${sample(malformed)}`);
});

// 3. List and detail ids must align both directions.
assert('列表↔详情 id 对齐', (f) => {
  if (!detailsOk) {
    f.push(`详情数据缺失或格式非法（layout=${layout}）`);
    return;
  }
  const missingDetail = listIds.filter((id) => typeof id === 'string' && !detailIdSet.has(id));
  const missingList = detailIds.filter((id) => !listIdSet.has(id));
  if (missingDetail.length > 0) f.push(`列表有但详情缺失: ${sample(missingDetail)}`);
  if (missingList.length > 0) f.push(`详情有但列表缺失: ${sample(missingList)}`);
  if (duplicateIds.length > 0) f.push(`分片间重复 id: ${sample(new Set(duplicateIds))}`);
});

// 4. Coordinates within Hefei bbox.
assert('坐标 bbox', (f) => {
  const bad = [];
  for (const s of listRecords) {
    const lng = Number(s && s.lng);
    const lat = Number(s && s.lat);
    if (
      !Number.isFinite(lng) ||
      !Number.isFinite(lat) ||
      lng < BBOX.lngMin ||
      lng > BBOX.lngMax ||
      lat < BBOX.latMin ||
      lat > BBOX.latMax
    ) {
      bad.push(`${(s && s.stationId) || '(no id)'}(${s && s.lng},${s && s.lat})`);
    }
  }
  if (bad.length > 0) {
    f.push(`坐标超出合肥 bbox(lng ${BBOX.lngMin}-${BBOX.lngMax}, lat ${BBOX.latMin}-${BBOX.latMax}): ${sample(bad)}`);
  }
});

// 5. Available connectors must not exceed totals.
assert('可用数<=总数', (f) => {
  const bad = [];
  for (const s of listRecords) {
    if (!s) continue;
    if (Number(s.quickAvailableNum) > Number(s.quickChargeNum)) {
      bad.push(`${s.stationId} quick ${s.quickAvailableNum}>${s.quickChargeNum}`);
    }
    if (Number(s.slowAvailableNum) > Number(s.slowChargeNum)) {
      bad.push(`${s.stationId} slow ${s.slowAvailableNum}>${s.slowChargeNum}`);
    }
  }
  if (bad.length > 0) f.push(`可用数超过总数: ${sample(bad)}`);
});

// 6. Detail periodPrices must have exactly 8 entries.
assert('periodPrices 条数', (f) => {
  const bad = [];
  for (const id of detailIds) {
    const periods = details[id] && details[id].periodPrices;
    if (!Array.isArray(periods) || periods.length !== PERIOD_COUNT) {
      bad.push(`${id}: ${Array.isArray(periods) ? periods.length : 'missing'}`);
    }
  }
  if (bad.length > 0) f.push(`periodPrices 条数 !== ${PERIOD_COUNT}: ${sample(bad)}`);
});

// 7. connector.status must be in {0,1,2,3,255}.
assert('connector.status 取值', (f) => {
  const bad = [];
  for (const id of detailIds) {
    const detail = details[id] || {};
    const connectors = [...(detail.fastConnectors || []), ...(detail.slowConnectors || [])];
    for (const c of connectors) {
      if (!ALLOWED_STATUS.has(c && c.status)) bad.push(`${id}:${(c && c.id) || '?'}=${c && c.status}`);
    }
  }
  if (bad.length > 0) f.push(`非法 connector.status(允许 0/1/2/3/255): ${sample(bad)}`);
});

// 8. stationId format ^HF\d{6}$ — conditional until T6 enforces it.
// Only enforced when the first list id already carries the HF prefix (legacy
// data must not be blocked before the T6 migration).
assert('stationId 格式', (f) => {
  const firstId = listIds[0];
  const contractActive = typeof firstId === 'string' && firstId.startsWith('HF');
  if (!contractActive) {
    // Legacy id format in place; T6 will make this assertion unconditional.
    return;
  }
  const bad = [];
  for (const id of listIds) {
    if (typeof id !== 'string' || !ID_PATTERN.test(id)) bad.push(String(id));
  }
  for (const id of detailIds) {
    if (!ID_PATTERN.test(id)) bad.push(`${id} (detail key)`);
  }
  if (bad.length > 0) f.push(`stationId 不符合 ^HF\\d{6}$: ${sample(bad)}`);
});

// --- Report: aggregate all failures, then exit once ---------------------
const failed = RESULTS.filter((r) => r.failures.length > 0);

console.log(
  `data layout: ${layout}; list=${listRecords.length} stations, details=${detailIds.length} entries`
);

if (failed.length > 0) {
  for (const r of failed) {
    for (const msg of r.failures) {
      console.log(`[FAIL] ${r.name}: ${msg}`);
    }
  }
  console.log(`\n${failed.length}/${RESULTS.length} assertions failed`);
  process.exit(1);
}

console.log(`[OK] ${listRecords.length} stations, ${RESULTS.length} assertions passed`);
