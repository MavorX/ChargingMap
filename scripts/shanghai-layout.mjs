import { shanghaiRoads, shanghaiShowcaseSites } from './shanghai-roads.mjs';

export const SHANGHAI_MIN_STATION_DISTANCE_METERS = 360;
const METERS_PER_DEGREE = Math.PI * 6371000 / 180;
const CENTER = { lng: 121.473, lat: 31.23 };
const CELL_SIZE = 800;

export function distanceMeters(a, b) {
  const dx = (a.lng - b.lng) * Math.cos((a.lat + b.lat) * Math.PI / 360);
  return Math.hypot(dx, a.lat - b.lat) * METERS_PER_DEGREE;
}

// Road length matters: a 700 m CBD street must not receive as many stations as
// a 6 km residential corridor merely because it has a high demand weight.
const corridors = shanghaiRoads.map(road => {
  const length = distanceMeters(
    { lng: road.start[0], lat: road.start[1] },
    { lng: road.end[0], lat: road.end[1] }
  );
  return { road, weight: length * Math.sqrt(road.weight) };
});
const totalWeight = corridors.reduce((sum, corridor) => sum + corridor.weight, 0);

function pickCorridor(random) {
  let remaining = random() * totalWeight;
  for (const corridor of corridors) {
    remaining -= corridor.weight;
    if (remaining <= 0) return corridor.road;
  }
  return corridors[corridors.length - 1].road;
}

function pointBesideRoad(road, random) {
  const t = 0.02 + random() * 0.96;
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

function spacingFor(point, random) {
  // Density eases away from the inner city, without district-boundary steps.
  // Per-site variation avoids an evenly spaced bead/grid appearance.
  return (SHANGHAI_MIN_STATION_DISTANCE_METERS + Math.min(180, distanceMeters(point, CENTER) * 0.006))
    * (1 + random() * 0.15);
}

function cellFor(point) {
  return [
    Math.floor((point.lng - CENTER.lng) * METERS_PER_DEGREE * Math.cos(CENTER.lat * Math.PI / 180) / CELL_SIZE),
    Math.floor((point.lat - CENTER.lat) * METERS_PER_DEGREE / CELL_SIZE)
  ];
}

export function generateShanghaiLocations(count, random) {
  const locations = [];
  const cells = new Map();
  const add = point => {
    const [x, y] = cellFor(point);
    const key = `${x},${y}`;
    if (!cells.has(key)) cells.set(key, []);
    cells.get(key).push(point);
    locations.push(point);
  };

  // Reserve fixed demo entrances BEFORE sampling, so later overrides cannot
  // introduce collisions next to People's Square, Lujiazui or Xujiahui.
  for (const site of shanghaiShowcaseSites.slice(0, count)) {
    const road = shanghaiRoads.find(r => r.district === site.district && r.name === site.road);
    const point = { road, lng: site.lng, lat: site.lat };
    add({ ...point, spacing: spacingFor(point, random) });
  }

  for (let attempt = 0; locations.length < count && attempt < count * 500; attempt++) {
    const point = pointBesideRoad(pickCorridor(random), random);
    point.spacing = spacingFor(point, random);
    const [x, y] = cellFor(point);
    let crowded = false;
    // Check neighboring roads as well as this corridor, including intersections
    // and opposite parking lots. The largest spacing is below one cell width.
    for (let dx = -1; dx <= 1 && !crowded; dx++) {
      for (let dy = -1; dy <= 1 && !crowded; dy++) {
        crowded = (cells.get(`${x + dx},${y + dy}`) || []).some(
          other => distanceMeters(point, other) < Math.max(point.spacing, other.spacing)
        );
      }
    }
    if (!crowded) add(point);
  }

  // Never silently relax the spacing or duplicate a site to meet the count.
  if (locations.length !== count) {
    throw new Error(`上海道路容量不足：已放置 ${locations.length}/${count} 站，请扩展路网而非压缩间距。`);
  }
  return locations;
}
