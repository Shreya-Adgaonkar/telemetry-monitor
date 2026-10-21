import { TestBed } from '@angular/core/testing';
import { UnitSelection } from './unit-selection';

describe('UnitSelection', () => {
  let service: UnitSelection;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(UnitSelection);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
