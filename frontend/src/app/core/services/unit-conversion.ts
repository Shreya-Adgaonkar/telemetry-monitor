import { Injectable } from '@angular/core';
import { PARAMETER_CONFIG } from '../models/parameter-config';
import { ParameterKey } from '../models/telemetry.model';

// Multipliers FROM the base unit (velocity: cm/s, pressure: mbar)
const MULTIPLIERS: Record<'velocity' | 'pressure', Record<string, number>> = {
  velocity: { 'mm/s': 10, 'cm/s': 1, 'm/s': 0.01, 'km/h': 0.036, 'ft/s': 0.0328084 },
  pressure: { Pa: 100, kPa: 0.1, mbar: 1, bar: 0.001, psi: 0.0145038, atm: 0.000986923 },
};

@Injectable({ providedIn: 'root' })
export class UnitConversionService {
  /** Converts a base-unit value to the target unit. Never rounds. */
  convert(key: ParameterKey, baseValue: number, toUnit: string): number {
    if (key === 'temperature') {
      switch (toUnit) {
        case '°F':
          return (baseValue * 9) / 5 + 32;
        case 'K':
          return baseValue + 273.15;
        default:
          return baseValue; // °C
      }
    }
    return baseValue * (MULTIPLIERS[key][toUnit] ?? 1);
  }

  /** Rounds for DISPLAY only. */
  format(key: ParameterKey, value: number, unit: string): string {
    const decimals = PARAMETER_CONFIG[key].decimals[unit] ?? 2;
    return value.toFixed(decimals);
  }
}