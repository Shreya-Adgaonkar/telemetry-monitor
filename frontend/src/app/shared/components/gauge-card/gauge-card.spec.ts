import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GaugeCard } from './gauge-card';

describe('GaugeCard', () => {
  let component: GaugeCard;
  let fixture: ComponentFixture<GaugeCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GaugeCard],
      // Provide mock versions of TelemetryService/UnitConversionService if needed here
    }).compileComponents();

    fixture = TestBed.createComponent(GaugeCard);
    component = fixture.componentInstance;

    // FIX: Set required inputs before the first change detection run!
    fixture.componentRef.setInput('parameter', 'velocity'); // Use a valid ParameterKey string from your config

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
