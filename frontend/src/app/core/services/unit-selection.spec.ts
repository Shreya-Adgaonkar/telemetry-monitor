import { TestBed } from '@angular/core/testing';
import { UnitSelectionService } from './unit-selection';

describe('UnitSelection', () => {
  let service: UnitSelectionService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(UnitSelectionService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
