import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { PARAMETER_KEYS } from '../../core/models/telemetry.model';
import { GaugeCard } from '../../shared/components/gauge-card/gauge-card';
import { TelemetryService } from '../../core/services/telemetry';
import { ExportService } from '../../core/services/export';
import { ThemeService } from '../../core/services/theme';

@Component({
  selector: 'app-dashboard',
  imports: [GaugeCard],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Dashboard {
  protected readonly telemetry = inject(TelemetryService);
  protected readonly themeService = inject(ThemeService);
  private readonly exporter = inject(ExportService);

  protected readonly keys = PARAMETER_KEYS;

  protected readonly lastSuccessText = computed(() => {
    const d = this.telemetry.lastSuccess();
    return d ? d.toLocaleTimeString() : '--';
  });

  protected readonly connectionText = computed(() => {
    if (this.telemetry.loading() && !this.telemetry.error()) return 'Connecting…';
    return this.telemetry.connected() ? 'Connected' : 'Disconnected';
  });

  protected exportCsv(): void {
    this.exporter.exportCsv();
  }

  protected exportExcel(): void {
    void this.exporter.exportExcel();
  }
}
