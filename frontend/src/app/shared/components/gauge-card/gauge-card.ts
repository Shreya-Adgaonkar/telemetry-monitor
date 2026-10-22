import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { PARAMETER_CONFIG, getStatus } from '../../../core/models/parameter-config';
import { ParameterKey } from '../../../core/models/telemetry.model';
import { TelemetryService } from '../../../core/services/telemetry';
import { UnitConversionService } from '../../../core/services/unit-conversion';
import { UnitSelectionService } from '../../../core/services/unit-selection';
import { TrendChart } from '../trend-chart/trend-chart';

@Component({
  selector: 'app-gauge-card',
  imports: [TrendChart],
  templateUrl: './gauge-card.html',
  styleUrl: './gauge-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GaugeCard {
  readonly parameter = input.required<ParameterKey>();
    private readonly telemetry = inject(TelemetryService);
  private readonly converter = inject(UnitConversionService);
  private readonly selection = inject(UnitSelectionService);
  private readonly paramData = computed(() => this.telemetry.data()?.[this.parameter()] ?? null);
  readonly history = computed(() => this.paramData()?.history ?? []);


  readonly circumference = 2 * Math.PI * 50;

  readonly config = computed(() => PARAMETER_CONFIG[this.parameter()]);
  readonly selectedUnit = computed(() => this.selection.units[this.parameter()]());

  readonly rawValue = computed(() => this.paramData()?.value ?? null);
  readonly displayValue = computed(() => {
    const raw = this.rawValue();
    if (raw === null) return '--';
    const key = this.parameter();
    const unit = this.selectedUnit();
    return this.converter.format(key, this.converter.convert(key, raw, unit), unit);
  });

  readonly rangeLabel = computed(() => {
    const key = this.parameter();
    const unit = this.selectedUnit();
    const c = this.config();
    const min = this.converter.format(key, this.converter.convert(key, c.gaugeMin, unit), unit);
    const max = this.converter.format(key, this.converter.convert(key, c.gaugeMax, unit), unit);
    return `${min} – ${max} ${unit}`;
  });

  // Percent and status use RAW base values, so the arc and status never jump when units change
  readonly percent = computed(() => {
    const raw = this.rawValue();
    if (raw === null) return 0;
    const c = this.config();
    const p = (raw - c.gaugeMin) / (c.gaugeMax - c.gaugeMin);
    return Math.min(1, Math.max(0, p));
  });

  readonly dashOffset = computed(() => this.circumference * (1 - this.percent()));

  readonly status = computed(() => {
    const raw = this.rawValue();
    return raw === null ? null : getStatus(this.parameter(), raw);
  });

  readonly lastUpdated = computed(() => {
    const d = this.telemetry.data();
    return d ? new Date(d.timestamp).toLocaleTimeString() : '--';
  });

  onUnitChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.selection.units[this.parameter()].set(value);
  }
}
