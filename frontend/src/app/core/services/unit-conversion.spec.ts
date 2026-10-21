import { TestBed } from '@angular/core/testing';
import { UnitConversionService } from './unit-conversion';

describe('UnitConversion', () => {
  let service: UnitConversionService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(UnitConversionService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
