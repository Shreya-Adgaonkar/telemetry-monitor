import { UnitConversionService } from './unit-conversion';

describe('UnitConversionService', () => {
  const service = new UnitConversionService();

  it('converts temperature', () => {
    expect(service.convert('temperature', 0, '°F')).toBeCloseTo(32);
    expect(service.convert('temperature', 0, 'K')).toBeCloseTo(273.15);
    expect(service.convert('temperature', 100, '°F')).toBeCloseTo(212);
  });

  it('converts velocity from cm/s', () => {
    expect(service.convert('velocity', 100, 'km/h')).toBeCloseTo(3.6);
    expect(service.convert('velocity', 100, 'm/s')).toBeCloseTo(1);
    expect(service.convert('velocity', 100, 'mm/s')).toBeCloseTo(1000);
  });

  it('converts pressure from mbar', () => {
    expect(service.convert('pressure', 1013.25, 'atm')).toBeCloseTo(1, 3);
    expect(service.convert('pressure', 1000, 'bar')).toBeCloseTo(1);
    expect(service.convert('pressure', 1000, 'Pa')).toBeCloseTo(100000);
  });
});
