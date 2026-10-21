import { Component, computed, inject, input } from '@angular/core';
import { TelemetryService } from '../../../core/services/telemetry';
import { ParameterKey } from '../../../core/models/types';
import { PARAMETER_CONFIG, UNIT_DECIMALS, getStatus } from '../../../core/models/parameter-config';

@Component({
  selector: 'app-gauge-card',
  templateUrl: './gauge-card.html',
  styleUrl: './gauge-card.scss',
})
export class GaugeCard {
  private telemetry = inject(TelemetryService);

  parameter = input.required<ParameterKey>();
  circumference = 2 * Math.PI * 50;

  config = computed(() => PARAMETER_CONFIG[this.parameter()]);
  rawValue = computed(() => this.telemetry.data()?.[this.parameter()].value ?? null);

  percent = computed(() => {
    const v = this.rawValue();
    if (v === null) return 0;
    const { min, max } = this.config();
    return Math.min(1, Math.max(0, (v - min) / (max - min)));
  });

  status = computed(() => {
    const v = this.rawValue();
    return v === null ? null : getStatus(this.parameter(), v);
  });

  displayValue = computed(() => {
    const v = this.rawValue();
    return v === null ? '--' : v.toFixed(UNIT_DECIMALS[this.config().baseUnit]);
  });

  lastUpdated = computed(() => {
    const ts = this.telemetry.data()?.timestamp;
    return ts ? new Date(ts).toLocaleTimeString() : '--:--:--';
  });
}