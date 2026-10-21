import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TrendChart } from './trend-chart';

describe('TrendChart', () => {
  let component: TrendChart;
  let fixture: ComponentFixture<TrendChart>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TrendChart]
    }).compileComponents();

    fixture = TestBed.createComponent(TrendChart);
    component = fixture.componentInstance;

    // FIX: Set all required inputs to prevent NG0950 layout initialization crashes
    fixture.componentRef.setInput('parameter', 'velocity');
    fixture.componentRef.setInput('history', []);
    fixture.componentRef.setInput('unit', 'm/s');

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
