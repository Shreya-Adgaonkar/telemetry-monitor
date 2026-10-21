import { TestBed } from '@angular/core/testing';
import { UnitConversion } from './unit-conversion';

describe('UnitConversion', () => {
  let service: UnitConversion;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(UnitConversion);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
