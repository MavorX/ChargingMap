// Data schema validator for ChargingMap.
// Pure Node built-ins only. Usage: node scripts/validate-data.mjs [--list=<path>]
// Aggregates ALL assertion failures (no fail-fast) and exits 1 if any failed.
/* global process */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CITIES, cityById, cityAtLocation } from '../src/constants/cities.js';
import { STATION_ID_PATTERN, STATIONS_PER_CITY_LIMIT, partIdFor } from '../src/constants/stationData.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DATA_DIR = path.join(ROOT, 'public', 'data');
const listArg = process.argv.find((a) => a.startsWith('--list='));
const LIST_PATH = listArg
  ? path.resolve(process.cwd(), listArg.slice('--list='.length))
  : path.join(DATA_DIR, 'station_list.json');
const DETAILS_DIR = path.join(path.dirname(LIST_PATH), 'details');
const DETAILS_FILE = path.join(path.dirname(LIST_PATH), 'station_details.json');

const MIN_STATIONS = 1;
const MAX_STATIONS = STATIONS_PER_CITY_LIMIT * CITIES.length;
const ALLOWED_STATUS = new Set([0, 1, 2, 3, 255]);
const ALLOWED_CONNECTOR_TYPES = new Set(['CCS Combo', 'GB/T', 'CHAdeMO', 'Type 2']);
const PERIOD_COUNT = 8;
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
  // HF keeps part-XX.json; SH uses sh-part-XX.json in the same directory.
  if (fs.existsSync(DETAILS_DIR) && fs.statSync(DETAILS_DIR).isDirectory()) {
    const merged = {};
    const duplicateIds = [];
    const misplacedIds = [];
    const files = fs
      .readdirSync(DETAILS_DIR)
      .filter((f) => f.toLowerCase().endsWith('.json'))
      .sort();
    for (const file of files) {
      const data = readJson(path.join(DETAILS_DIR, file));
      if (!isPlainObject(data)) continue;
      for (const [id, detail] of Object.entries(data)) {
        try {
          if (file !== `${partIdFor(id)}.json`) misplacedIds.push(`${id} in ${file}`);
        } catch { misplacedIds.push(`${id} in ${file}`); }
        if (Object.prototype.hasOwnProperty.call(merged, id)) duplicateIds.push(id);
        merged[id] = detail;
      }
    }
    return { details: merged, layout: `sharded (${files.length} files)`, duplicateIds, misplacedIds, ok: true };
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
const { details, layout, duplicateIds, misplacedIds = [], ok: detailsOk } = loadDetails();

const listIds = listRecords.map((s) => (s && typeof s === 'object' ? s.stationId : undefined));
const detailIds = Object.keys(details);
const listIdSet = new Set(listIds.filter((id) => typeof id === 'string'));
const detailIdSet = new Set(detailIds);

// 1. Bounded per-region counts; the default dataset is SH=1500 + HF=500.
assert('记录数', (f) => {
  if (!listIsArray) {
    f.push(`station_list.json 不是数组（路径 ${LIST_PATH}）`);
    return;
  }
  if (list.length < MIN_STATIONS || list.length > MAX_STATIONS) {
    f.push(`列表记录数 ${list.length}，要求 ${MIN_STATIONS}..${MAX_STATIONS}`);
  }
  for (const city of CITIES) {
    const count = list.filter(s => s?.cityId === city.id).length;
    if (count < 1 || count > STATIONS_PER_CITY_LIMIT) f.push(`${city.name} 记录数 ${count}，要求 1..${STATIONS_PER_CITY_LIMIT}`);
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
  if (misplacedIds.length > 0) f.push(`详情分片与 id 不匹配: ${sample(misplacedIds)}`);
});

// 4. Coordinates must belong to their declared city, not merely either bbox.
assert('坐标 bbox', (f) => {
  const bad = [];
  for (const s of listRecords) {
    const lng = Number(s && s.lng);
    const lat = Number(s && s.lat);
    if (
      !Number.isFinite(lng) || !Number.isFinite(lat) ||
      cityAtLocation({ lng, lat })?.id !== s?.cityId
    ) {
      bad.push(`${(s && s.stationId) || '(no id)'}(${s && s.lng},${s && s.lat})`);
    }
  }
  if (bad.length > 0) {
    f.push(`坐标超出声明城市 bbox: ${sample(bad)}`);
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

// 8. No permissive parseInt / unknown-prefix fallbacks in the id contract.
assert('stationId 格式', (f) => {
  const bad = [];
  for (const id of [...listIds, ...detailIds]) {
    try { partIdFor(id); } catch { bad.push(String(id)); }
  }
  if (bad.length > 0) f.push(`stationId 不符合 ${STATION_ID_PATTERN} 且序号应为 1..${STATIONS_PER_CITY_LIMIT}: ${sample(bad)}`);
});

assert('城市元数据', (f) => {
  for (const s of listRecords) {
    const city = cityById(s?.cityId);
    if (!city || s.cityName !== city.name || !s.stationId?.startsWith(city.id) || !s.address?.includes(city.name)) {
      f.push(`${s?.stationId}: 城市、编号或地址不一致`);
    }
  }
});

assert('枪位与列表一致', (f) => {
  for (const s of listRecords) {
    const detail = details[s?.stationId];
    if (!detail) continue;
    for (const [key, total, available] of [
      ['fastConnectors', s.quickChargeNum, s.quickAvailableNum],
      ['slowConnectors', s.slowChargeNum, s.slowAvailableNum]
    ]) {
      const connectors = detail[key] || [];
      if (connectors.length !== total || connectors.filter(c => c.status === 1).length !== available) f.push(`${s.stationId}: ${key} 数量不一致`);
      if (connectors.some(c => !detail.connectorTypes.includes(c.connectorType))) f.push(`${s.stationId}: 枪口类型不一致`);
    }
    if (detail.stationId !== s.stationId || JSON.stringify(s.connectorTypes) !== JSON.stringify(detail.connectorTypes)) f.push(`${s.stationId}: 列表与详情元数据不一致`);
  }
});

// 9. List-level connectorTypes must be a non-empty array of allowed values.
// The list payload carries this so filters work before detail shards load.
assert('列表 connectorTypes', (f) => {
  const bad = [];
  for (const s of listRecords) {
    const id = (s && s.stationId) || '(no id)';
    const types = s && s.connectorTypes;
    if (!Array.isArray(types) || types.length < 1) {
      bad.push(`${id}: ${Array.isArray(types) ? 'empty array' : 'missing/not array'}`);
      continue;
    }
    const invalid = types.filter((t) => !ALLOWED_CONNECTOR_TYPES.has(t));
    if (invalid.length > 0) bad.push(`${id}: 非法值 ${invalid.join(',')}`);
  }
  if (bad.length > 0) {
    f.push(`列表 connectorTypes 缺失或非法(允许 ${[...ALLOWED_CONNECTOR_TYPES].join('/')}): ${sample(bad)}`);
  }
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
