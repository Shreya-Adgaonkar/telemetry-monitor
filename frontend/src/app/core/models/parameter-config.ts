import { ParameterKey } from './telemetry.model';

export type Status = 'Normal' | 'Warning' | 'Critical';

export interface Range {
  min: number;
  max: number;
}

export interface ParameterConfig {
  label: string;
  baseUnit: string;
  units: string[];
  gaugeMin: number; // base units
  gaugeMax: number; // base units
  normal: Range; // base units
  warning: Range; // base units (outer range; outside it = Critical)
  decimals: Record<string, number>; // display decimals per unit
}

export const PARAMETER_CONFIG: Record<ParameterKey, ParameterConfig> = {
  velocity: {
    label: 'Velocity',
    baseUnit: 'cm/s',
    units: ['mm/s', 'cm/s', 'm/s', 'km/h', 'ft/s'],
    gaugeMin: 0,
    gaugeMax: 300,
    normal: { min: 150, max: 220 },
    warning: { min: 120, max: 250 },
    decimals: { 'mm/s': 0, 'cm/s': 1, 'm/s': 2, 'km/h': 2, 'ft/s': 2 },
  },
  pressure: {
    label: 'Pressure',
    baseUnit: 'mbar',
    units: ['Pa', 'kPa', 'mbar', 'bar', 'psi', 'atm'],
    gaugeMin: 800,
    gaugeMax: 1200,
    normal: { min: 980, max: 1040 },
    warning: { min: 950, max: 1070 },
    decimals: { Pa: 0, kPa: 2, mbar: 1, bar: 4, psi: 2, atm: 4 },
  },
  temperature: {
    label: 'Temperature',
    baseUnit: '°C',
    units: ['°C', '°F', 'K'],
    gaugeMin: 0,
    gaugeMax: 80,
    normal: { min: 35, max: 39 },
    warning: { min: 33, max: 41 },
    decimals: { '°C': 1, '°F': 1, K: 1 },
  },
};

/** Status is always evaluated on the raw base-unit value, so changing units never changes it. */
export function getStatus(key: ParameterKey, rawValue: number): Status {
  const c = PARAMETER_CONFIG[key];
  if (rawValue >= c.normal.min && rawValue <= c.normal.max) return 'Normal';
  if (rawValue >= c.warning.min && rawValue <= c.warning.max) return 'Warning';
  return 'Critical';
}