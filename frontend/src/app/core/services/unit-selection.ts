import { Injectable, WritableSignal, signal } from '@angular/core';
import { PARAMETER_CONFIG } from '../models/parameter-config';
import { ParameterKey } from '../models/telemetry.model';

@Injectable({ providedIn: 'root' })
export class UnitSelectionService {
  readonly units: Record<ParameterKey, WritableSignal<string>> = {
    velocity: signal(PARAMETER_CONFIG.velocity.baseUnit),
    pressure: signal(PARAMETER_CONFIG.pressure.baseUnit),
    temperature: signal(PARAMETER_CONFIG.temperature.baseUnit),
  };
}
