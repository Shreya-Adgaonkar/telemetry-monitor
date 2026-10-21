import { Component, inject } from '@angular/core';
import { TelemetryService } from '../../core/services/telemetry';

@Component({
  selector: 'app-dashboard',
  imports: [],
  styleUrl: './dashboard.scss',
  templateUrl: './dashboard.html',
})
export class Dashboard {
  readonly telemetry = inject(TelemetryService);
}