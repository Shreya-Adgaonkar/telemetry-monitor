import { TestBed } from '@angular/core/testing';
import { TelemetryService } from './telemetry';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

describe('Telemetry', () => {
  let service: TelemetryService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(TelemetryService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
