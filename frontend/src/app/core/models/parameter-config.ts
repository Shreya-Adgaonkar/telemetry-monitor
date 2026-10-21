import { ParameterKey } from './types';

export const PARAMETER_CONFIG = {
  velocity: {
    label: 'Velocity', baseUnit: 'cm/s',
    units: ['mm/s', 'cm/s', 'm/s', 'km/h', 'ft/s'],
    min: 0, max: 300, normal: [150, 220], warning: [120, 250],
  },
  pressure: {
    label: 'Pressure', baseUnit: 'mbar',
    units: ['Pa', 'kPa', 'mbar', 'bar', 'psi', 'atm'],
    min: 800, max: 1200, normal: [980, 1040], warning: [950, 1070],
  },
  temperature: {
    label: 'Temperature', baseUnit: '°C',
    units: ['°C', '°F', 'K'],
    min: 0, max: 80, normal: [35, 39], warning: [33, 41],
  },
} satisfies Record<ParameterKey, {
  label: string; baseUnit: string; units: string[];
  min: number; max: number; normal: number[]; warning: number[];
}>;

export const UNIT_DECIMALS: Record<string, number> = {
  'Pa': 0, 'kPa': 2, 'mbar': 1, 'bar': 4, 'psi': 2, 'atm': 4,
  'mm/s': 0, 'cm/s': 1, 'm/s': 2, 'km/h': 2, 'ft/s': 2,
  '°C': 1, '°F': 1, 'K': 1,
};

export type Status = 'normal' | 'warning' | 'critical';

export function getStatus(key: ParameterKey, v: number): Status {
  const { normal, warning } = PARAMETER_CONFIG[key];
  if (v >= normal[0] && v <= normal[1]) return 'normal';
  if (v >= warning[0] && v <= warning[1]) return 'warning';
  return 'critical';
}