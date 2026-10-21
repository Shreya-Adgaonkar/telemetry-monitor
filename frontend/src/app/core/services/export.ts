import { Injectable, inject } from '@angular/core';
import { ParameterKey } from '../models/telemetry.model';
import { TelemetryService } from './telemetry';
import { UnitConversionService } from './unit-conversion';
import { UnitSelectionService } from './unit-selection';


interface Table {
  headers: string[];
  rows: (string | number)[][];
}

@Injectable({ providedIn: 'root' })
export class ExportService {
  private readonly telemetry = inject(TelemetryService);
  private readonly converter = inject(UnitConversionService);
  private readonly selection = inject(UnitSelectionService);

  exportCsv(): void {
    const { headers, rows } = this.buildTable();
    if (!rows.length) return;

    const lines = [headers, ...rows].map((row) => row.map((c) => this.csvCell(c)).join(','));
    // BOM so Excel opens UTF-8 (°C, °F) correctly
    const csv = '\uFEFF' + lines.join('\r\n');
    this.download(new Blob([csv], { type: 'text/csv;charset=utf-8' }), `${this.fileStem()}.csv`);
  }

  async exportExcel(): Promise<void> {
    const { headers, rows } = this.buildTable();
    if (!rows.length) return;

    try {
      // Loaded on demand so it doesn't bloat the initial bundle
      const { Workbook } = await import('exceljs');
      const workbook = new Workbook();
      const sheet = workbook.addWorksheet('Telemetry');
      sheet.columns = headers.map((h, i) => ({
        header: h,
        key: `c${i}`,
        width: i === 0 ? 26 : 22,
      }));
      rows.forEach((r) => sheet.addRow(r));
      sheet.getRow(1).font = { bold: true };
      sheet.views = [{ state: 'frozen', ySplit: 1 }];

      const buffer = await workbook.xlsx.writeBuffer();
      this.download(
        new Blob([buffer as ArrayBuffer], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        }),
        `${this.fileStem()}.xlsx`,
      );
    } catch (err) {
      console.error('Excel export failed', err);
    }
  }

  private buildTable(): Table {
    const u = {
      velocity: this.selection.units.velocity(),
      pressure: this.selection.units.pressure(),
      temperature: this.selection.units.temperature(),
    };
    const headers = [
      'Timestamp (UTC)',
      `Velocity (${u.velocity})`,
      `Pressure (${u.pressure})`,
      `Temperature (${u.temperature})`,
    ];
    const rows = this.telemetry
      .getSessionRows()
      .map((r) => [
        r.timestamp,
        this.value('velocity', r.velocity, u.velocity),
        this.value('pressure', r.pressure, u.pressure),
        this.value('temperature', r.temperature, u.temperature),
      ]);
    return { headers, rows };
  }

  private value(key: ParameterKey, base: number, unit: string): number {
    const converted = this.converter.convert(key, base, unit);
    return Number(this.converter.format(key, converted, unit));
  }

  private csvCell(cell: string | number): string {
    const s = String(cell);
    return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  }

  private fileStem(): string {
    const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    return `telemetry_${stamp}`;
  }

  private download(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}