import {
  ChangeDetectionStrategy,
  Component,
  afterNextRender,
  effect,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { BaseChartDirective } from 'ng2-charts';
import { Chart, ChartConfiguration, ChartData } from 'chart.js';
import zoomPlugin from 'chartjs-plugin-zoom';
import { PARAMETER_CONFIG } from '../../../core/models/parameter-config';
import { HistoryPoint, ParameterKey } from '../../../core/models/telemetry.model';
import { UnitConversionService } from '../../../core/services/unit-conversion';
import { ThemeService } from '../../../core/services/theme';

Chart.register(zoomPlugin);

const MAX_SAMPLES = 100;

@Component({
  selector: 'app-trend-chart',
  standalone: true,
  imports: [BaseChartDirective],
  templateUrl: './trend-chart.html',
  styleUrl: './trend-chart.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TrendChart {
  readonly parameter = input.required<ParameterKey>();
  readonly history = input.required<HistoryPoint[]>(); // raw base-unit values
  readonly unit = input.required<string>();

  private readonly converter = inject(UnitConversionService);
  private readonly themeService = inject(ThemeService);
  private readonly chartRef = viewChild(BaseChartDirective);
  private readonly viewReady = signal(false);

  // Created ONCE. Updated in place afterwards, which is what prevents flicker.
  readonly chartData: ChartData<'line', number[], string> = {
    labels: [],
    datasets: [
      {
        data: [],
        label: '',
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 4,
        tension: 0.3,
        fill: false,
      },
    ],
  };

  readonly chartOptions: ChartConfiguration<'line'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    interaction: { mode: 'index', intersect: false },
    scales: {
      x: {
        title: { display: true, text: 'Time (UTC)' },
        ticks: { autoSkip: true, maxTicksLimit: 8, maxRotation: 0 },
      },
      y: {
        title: { display: true, text: '' },
      },
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          title: (items) => (items.length ? `Time: ${items[0].label} (UTC)` : ''),
          label: (ctx) => {
            const unit = this.unit();
            const value = this.converter.format(this.parameter(), ctx.parsed.y ?? 0, unit);
            return `Value: ${value} ${unit}`;
          },
        },
      },
      zoom: {
        zoom: { wheel: { enabled: true }, pinch: { enabled: true }, mode: 'x' },
        pan: { enabled: true, mode: 'x' },
      },
    },
  };

  constructor() {
    afterNextRender(() => this.viewReady.set(true));

    // Data / unit changes: mutate in place, then update without animation
    effect(() => {
      const key = this.parameter();
      const unit = this.unit(); // Ensure this is read actively
      const history = this.history().slice(-MAX_SAMPLES);
      const title = `${PARAMETER_CONFIG[key].label} (${unit})`;

      // 1. Mutate chart data arrays in place
      this.chartData.labels = history.map((p) => p.time);
      this.chartData.datasets[0].data = history.map((p) =>
        this.converter.convert(key, p.value, unit),
      );
      this.chartData.datasets[0].label = title;

      const chart = this.liveChart();
      if (chart) {
        // 2. Explicitly force scales to accept the new structural title references
        if (chart.options.scales?.['y']) {
          chart.options.scales['y'].title = {
            display: true,
            text: title,
          };
        }

        // 3. Re-link internal references to ensure redraw
        chart.data.labels = this.chartData.labels;
        chart.data.datasets[0].data = this.chartData.datasets[0].data;

        this.applyTheme(chart);
        chart.update('none'); // Update without flickering animations
      }
    });

    // Theme changes: re-read the css variables
    effect(() => {
      this.themeService.theme();
      const chart = this.liveChart();
      if (chart) {
        this.applyTheme(chart);
        chart.update('none');
      }
    });
  }

  zoomIn(): void {
    this.liveChart()?.zoom(1.2);
  }

  zoomOut(): void {
    this.liveChart()?.zoom(0.8);
  }

  resetZoom(): void {
    this.liveChart()?.resetZoom();
  }

  private liveChart(): Chart<'line'> | undefined {
    if (!this.viewReady()) return undefined;
    return this.chartRef()?.chart as unknown as Chart<'line'> | undefined;
  }

  private cssVar(name: string): string {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }

  private applyTheme(chart: Chart<'line'>): void {
    const text = this.cssVar('--text-muted');
    const grid = this.cssVar('--grid');
    for (const axis of ['x', 'y']) {
      const scale = chart.options.scales?.[axis];
      if (!scale) continue;
      scale.title = { ...scale.title, color: text };
      scale.ticks = { ...scale.ticks, color: text };
      scale.grid = { ...scale.grid, color: grid };
    }
    const ds = chart.data.datasets[0];
    ds.borderColor = this.cssVar('--accent');
  }
}
