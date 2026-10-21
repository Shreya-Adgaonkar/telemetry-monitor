import { Component, inject } from '@angular/core';
import { TelemetryService } from '../../core/services/telemetry';
import { GaugeCard } from '../../shared/components/gauge-card/gauge-card';

@Component({
  selector: 'app-dashboard',
  imports: [GaugeCard],
  styleUrl: './dashboard.scss',
  templateUrl: './dashboard.html',
})
export class Dashboard {
  readonly telemetry = inject(TelemetryService);
}