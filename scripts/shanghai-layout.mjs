import { shanghaiRoads, shanghaiShowcaseSites } from './shanghai-roads.mjs';
import { shanghaiDemandAreas } from './shanghai-demand.mjs';

// Only prevent near-duplicate parking sites; this is not a target spacing.
export const SHANGHAI_MIN_STATION_DISTANCE_METERS = 110;
export const SHANGHAI_NEIGHBORHOOD_RADIUS_METERS = 250;
export const SHANGHAI_MAX_NEIGHBORHOOD_STATIONS = 5;
const METERS_PER_DEGREE = Math.PI * 6371000 / 180;
const CENTER = { lng: 121.473, lat: 31.23 };
const LNG_SCALE = METERS_PER_DEGREE * Math.cos(CENTER.lat * Math.PI / 180);
const CELL_SIZE = 400;

export function distanceMeters(a, b) {
  const dx = (a.lng - b.lng) * Math.cos((a.lat + b.lat) * Math.PI / 360);
  return Math.hypot(dx, a.lat - b.lat) * METERS_PER_DEGREE;
}

const project = point => [
  (point.lng - CENTER.lng) * LNG_SCALE,
  (point.lat - CENTER.lat) * METERS_PER_DEGREE
];
const demandAreas = shanghaiDemandAreas.map(area => ({ ...area, position: project(area) }));

function latticeValue(x, y, seed) {
  let hash = Math.imul(x, 0x1f123bb5) ^ Math.imul(y, 0x5f356495) ^ seed;
  hash = Math.imul(hash ^ (hash >>> 16), 0x45d9f3b);
  return ((hash ^ (hash >>> 16)) >>> 0) / 4294967296;
}

function smoothNoise(x, y, seed) {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const smooth = t => t * t * (3 - 2 * t);
  const sx = smooth(x - ix);
  const sy = smooth(y - iy);
  const blend = (a, b, t) => a + (b - a) * t;
  return blend(
    blend(latticeValue(ix, iy, seed), latticeValue(ix + 1, iy, seed), sx),
    blend(latticeValue(ix, iy + 1, seed), latticeValue(ix + 1, iy + 1, seed), sx),
    sy
  );
}

function demandAt(point, seed) {
  const [x, y] = project(point);
  // Multiple overlapping catchments, not concentric rings around one city center.
  let demand = 0.035;
  for (const area of demandAreas) {
    const dx = (x - area.position[0]) / area.radius[0];
    const dy = (y - area.position[1]) / area.radius[1];
    demand += area.weight * Math.exp(-0.5 * (dx * dx + dy * dy));
  }
  // Correlated neighborhood/block variation leaves quiet stretches even within
  // a busy area. Smooth interpolation avoids visible grid/catchment boundaries.
  const activity = 3.2 * (smoothNoise(x / 2200, y / 2200, seed) - 0.5)
    + 1.5 * (smoothNoise(x / 650, y / 650, seed ^ 0x5348) - 0.5);
  return demand * Math.exp(activity);
}

function pointOnRoad(road, t) {
  return {
    lng: road.start[0] + (road.end[0] - road.start[0]) * t,
    lat: road.start[1] + (road.end[1] - road.start[1]) * t
  };
}

function createSampler(seed) {
  const sections = [];
  let totalWeight = 0;
  for (const road of shanghaiRoads) {
    const length = distanceMeters(pointOnRoad(road, 0), pointOnRoad(road, 1));
    const count = Math.ceil(length / 350);
    for (let i = 0; i < count; i++) {
      const start = i / count;
      const end = (i + 1) / count;
      const demand = demandAt(pointOnRoad(road, (start + end) / 2), seed);
      totalWeight += length / count * Math.sqrt(road.weight) * demand;
      sections.push({ road, start, end, cumulativeWeight: totalWeight });
    }
  }
  // Build once from the seed, never from the requested station count. Growing
  // the dataset retains the positions already published for that seed.
  return random => {
    const target = random() * totalWeight;
    let low = 0;
    let high = sections.length - 1;
    while (low < high) {
      const mid = (low + high) >>> 1;
      if (sections[mid].cumulativeWeight < target) low = mid + 1;
      else high = mid;
    }
    const section = sections[low];
    const t = section.start + random() * (section.end - section.start);
    return pointBesideRoad(section.road, t, random);
  };
}

function pointBesideRoad(road, t, random) {
  const lng = road.start[0] + (road.end[0] - road.start[0]) * t;
  const lat = road.start[1] + (road.end[1] - road.start[1]) * t;
  const lngScale = METERS_PER_DEGREE * Math.cos(lat * Math.PI / 180);
  const dx = (road.end[0] - road.start[0]) * lngScale;
  const dy = (road.end[1] - road.start[1]) * METERS_PER_DEGREE;
  const length = Math.hypot(dx, dy);
  // Parking lots on either side, rather than a row of pins on the centerline.
  const offset = (35 + random() * 145) * (random() < 0.5 ? -1 : 1);
  return {
    road,
    lng: Number((lng - dy / length * offset / lngScale).toFixed(6)),
    lat: Number((lat + dx / length * offset / METERS_PER_DEGREE).toFixed(6))
  };
}

function cellFor(point) {
  return project(point).map(value => Math.floor(value / CELL_SIZE));
}

export function generateShanghaiLocations(count, random) {
  const locations = [];
  const cells = new Map();
  const sample = createSampler(Math.floor(random() * 4294967296));
  const add = (point, neighbors = []) => {
    const [x, y] = cellFor(point);
    const key = `${x},${y}`;
    if (!cells.has(key)) cells.set(key, []);
    cells.get(key).push(point);
    point.nearbyCount = neighbors.length;
    neighbors.forEach(other => { other.nearbyCount++; });
    locations.push(point);
  };

  // Reserve fixed demo entrances BEFORE sampling, so later overrides cannot
  // introduce collisions next to People's Square, Lujiazui or Xujiahui.
  for (const site of shanghaiShowcaseSites.slice(0, count)) {
    const road = shanghaiRoads.find(r => r.district === site.district && r.name === site.road);
    const point = { road, lng: site.lng, lat: site.lat };
    add(point);
  }

  for (let attempt = 0; locations.length < count && attempt < count * 500; attempt++) {
    const point = sample(random);
    const [x, y] = cellFor(point);
    let crowded = false;
    const neighbors = [];
    // Allow real clusters, but not dozens of sites sharing the same block.
    // Check existing neighbors' counts too: accepting a point must not overflow
    // a previously accepted site's catchment, even across roads or intersections.
    for (let dx = -1; dx <= 1 && !crowded; dx++) {
      for (let dy = -1; dy <= 1 && !crowded; dy++) {
        for (const other of cells.get(`${x + dx},${y + dy}`) || []) {
          const distance = distanceMeters(point, other);
          if (distance < SHANGHAI_MIN_STATION_DISTANCE_METERS) {
            crowded = true;
            break;
          }
          if (distance < SHANGHAI_NEIGHBORHOOD_RADIUS_METERS) {
            neighbors.push(other);
            if (
              neighbors.length >= SHANGHAI_MAX_NEIGHBORHOOD_STATIONS ||
              other.nearbyCount >= SHANGHAI_MAX_NEIGHBORHOOD_STATIONS - 1
            ) {
              crowded = true;
              break;
            }
          }
        }
      }
    }
    if (!crowded) add(point, neighbors);
  }

  // Never silently relax the collision/density guards to meet the count.
  if (locations.length !== count) {
    throw new Error(`上海道路容量不足：已放置 ${locations.length}/${count} 站，请扩展路网而非压缩间距。`);
  }
  return locations;
}
