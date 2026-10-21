import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { timer, exhaustMap, catchError, of } from 'rxjs';
import { environment} from '../../../enviornments/enviornment';
import { DashboardResponse } from '../models/types';

@Injectable({ providedIn: 'root' })
export class TelemetryService {
  private http = inject(HttpClient);

  readonly data = signal<DashboardResponse | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly connected = signal(false);
  readonly lastSuccess = signal<Date | null>(null);

  constructor() {
    timer(0, 1000)
      .pipe(
        exhaustMap(() =>
          this.http.get<DashboardResponse>(`${environment.apiUrl}/dashboard`).pipe(
            catchError(() => {
              this.error.set('Cannot reach the server. Retrying...');
              this.connected.set(false);
              this.loading.set(false);
              return of(null);
            })
          )
        ),
        takeUntilDestroyed()
      )
      .subscribe((response) => {
        if (!response) return; // error case: keep old data, do nothing else

        this.data.set(response);
        this.error.set(null);
        this.connected.set(true);
        this.loading.set(false);
        this.lastSuccess.set(new Date());
      });
  }
}