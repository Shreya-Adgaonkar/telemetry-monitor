import { DestroyRef, Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, exhaustMap, of, timer } from 'rxjs';
import { environment } from '../../../environments/environment';
import { DashboardResponse, SessionRow } from '../models/telemetry.model';

const MAX_SESSION_ROWS = 10000;

@Injectable({ providedIn: 'root' })
export class TelemetryService {
  private readonly http = inject(HttpClient);
  private readonly destroyRef = inject(DestroyRef);

  readonly data = signal<DashboardResponse | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly connected = signal(false);
  readonly lastSuccess = signal<Date | null>(null);
  readonly sessionCount = signal(0);

  private sessionRows: SessionRow[] = [];
  private lastSampleTime: string | null = null;

  constructor() {
    timer(0, 1000)
      .pipe(
        // exhaustMap: ignore new ticks while a request is still running
        exhaustMap(() =>
          this.http.get<DashboardResponse>(`${environment.apiUrl}/dashboard`).pipe(
            // catchError INSIDE, so one failed request never kills the polling stream
            catchError((err: HttpErrorResponse) => {
              this.handleError(err);
              return of(null);
            }),
          ),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((response) => {
        if (response) this.handleSuccess(response);
      });
  }

  getSessionRows(): readonly SessionRow[] {
    return this.sessionRows;
  }

  private handleSuccess(response: DashboardResponse): void {
    this.data.set(response);
    this.error.set(null);
    this.connected.set(true);
    this.loading.set(false);
    this.lastSuccess.set(new Date());
    this.appendSessionRow(response);
  }

  private handleError(err: HttpErrorResponse): void {
    this.connected.set(false);
    this.error.set(
      err.status === 0
        ? 'Cannot reach the server. Retrying…'
        : `Server error (${err.status}). Retrying…`,
    );
    // keep the previous data so the UI still shows the last known values
  }

  private appendSessionRow(r: DashboardResponse): void {
    const sampleTime = r.velocity.history.at(-1)?.time ?? null;
    if (sampleTime !== null && sampleTime === this.lastSampleTime) return; // same sample, skip
    this.lastSampleTime = sampleTime;

    this.sessionRows.push({
      timestamp: r.timestamp,
      velocity: r.velocity.value,
      pressure: r.pressure.value,
      temperature: r.temperature.value,
    });
    if (this.sessionRows.length > MAX_SESSION_ROWS) this.sessionRows.shift();
    this.sessionCount.set(this.sessionRows.length);
  }
}
