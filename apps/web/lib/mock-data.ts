// @ts-nocheck — legacy mock data, not used in production


export const FLEET_SEED: Vehicle[] = [
  { id: "DEV-7T2K-XC54", plate: "QYR-432", driver: "C. Restrepo",  status: "alert",   fuel: 6,  temp: 92, speed: 14, lat: 4.6541, lng: -74.0633, head: 45,  mask: true },
  { id: "DEV-9M4L-AB17", plate: "GFP-887", driver: "M. Ortega",    status: "active",  fuel: 78, temp: 81, speed: 62, lat: 4.6826, lng: -74.0488, head: 120, mask: true },
  { id: "DEV-3P8N-VD92", plate: "TWB-219", driver: "J. Linares",   status: "active",  fuel: 54, temp: 79, speed: 48, lat: 4.6390, lng: -74.0822, head: 270, mask: true },
  { id: "DEV-5Q1R-NH08", plate: "RUL-560", driver: "S. Bernal",    status: "idle",    fuel: 41, temp: 76, speed: 0,  lat: 4.7104, lng: -74.0721, head: 0,   mask: true },
  { id: "DEV-2X6F-PL33", plate: "KMD-104", driver: "A. Cárdenas",  status: "active",  fuel: 67, temp: 83, speed: 71, lat: 4.6712, lng: -74.0598, head: 200, mask: true },
  { id: "DEV-8H4D-WT71", plate: "HSC-902", driver: "L. Vargas",    status: "active",  fuel: 33, temp: 84, speed: 39, lat: 4.6228, lng: -74.0701, head: 310, mask: true },
  { id: "DEV-6B2C-RM45", plate: "PZN-345", driver: "D. Quintero",  status: "offline", fuel: 12, temp: 0,  speed: 0,  lat: 4.6975, lng: -74.0892, head: 0,   mask: true },
  { id: "DEV-4K9V-EY63", plate: "BWX-718", driver: "I. Moreno",    status: "idle",    fuel: 58, temp: 78, speed: 0,  lat: 4.6502, lng: -74.0445, head: 90,  mask: true },
  { id: "DEV-1J7G-OQ28", plate: "LRT-651", driver: "N. Ramos",     status: "active",  fuel: 22, temp: 88, speed: 55, lat: 4.6883, lng: -74.0334, head: 175, mask: true },
  { id: "DEV-0L5T-ZB19", plate: "VFG-029", driver: "P. Castaño",   status: "active",  fuel: 91, temp: 75, speed: 28, lat: 4.6328, lng: -74.0993, head: 60,  mask: true },
];

export const ALERTS: Alert[] = [
  {
    id: "a1", level: "critical", title: "Combustible crítico",
    device: "DEV-****-XC54", plate: "QYR-432",
    desc: "Autonomía estimada < 1 h", time: "hace 2 min",
  },
  {
    id: "a2", level: "warn", title: "Sobrecalentamiento de motor",
    device: "DEV-****-OQ28", plate: "LRT-651",
    desc: "Temperatura 88°C — umbral 85°C", time: "hace 6 min",
  },
  {
    id: "a3", level: "warn", title: "Exceso de velocidad",
    device: "DEV-****-RM45", plate: "PZN-345",
    desc: "92 km/h en zona 60 — Av. Cra. 9", time: "hace 14 min",
  },
  {
    id: "a4", level: "critical", title: "Pérdida de señal GPS",
    device: "DEV-****-RM45", plate: "PZN-345",
    desc: "Último ping: 4.6975, -74.0892", time: "hace 18 min",
  },
  {
    id: "a5", level: "info", title: "Mantenimiento programado",
    device: "DEV-****-WT71", plate: "HSC-902",
    desc: "Cambio de aceite — vence 23 May", time: "hace 1 h",
  },
  {
    id: "a6", level: "warn", title: "Ralentí prolongado",
    device: "DEV-****-NH08", plate: "RUL-560",
    desc: "32 min detenido con motor encendido", time: "hace 1 h",
  },
];
