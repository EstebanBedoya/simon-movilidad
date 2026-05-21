export const BOG_BOUNDS = {
  latMin: 4.605,
  latMax: 4.735,
  lngMin: -74.115,
  lngMax: -74.025,
};

export function project(lat: number, lng: number, w = 100, h = 100) {
  const x = ((lng - BOG_BOUNDS.lngMin) / (BOG_BOUNDS.lngMax - BOG_BOUNDS.lngMin)) * w;
  const y = (1 - (lat - BOG_BOUNDS.latMin) / (BOG_BOUNDS.latMax - BOG_BOUNDS.latMin)) * h;
  return { x, y };
}

export function maskId(id: string): string {
  const parts = id.split("-");
  if (parts.length !== 3) return id;
  return `${parts[0]}-****-${parts[2]}`;
}

export function formatCoord(lat: number, lng: number): string {
  return `${lat.toFixed(4)}°, ${lng.toFixed(4)}°`;
}

export function genSeries(
  seed: number,
  n: number,
  base: number,
  jitter: number,
  trend = 0
): number[] {
  const out: number[] = [];
  let v = base;
  let s = seed * 9301 + 49297;
  for (let i = 0; i < n; i++) {
    s = (s * 9301 + 49297) % 233280;
    const r = s / 233280 - 0.5;
    v += r * jitter + trend;
    v = Math.max(0, v);
    out.push(v);
  }
  return out;
}
