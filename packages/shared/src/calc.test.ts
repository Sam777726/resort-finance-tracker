import { autoSplitExtra, computeDayPicnic, computeOvernight } from './calc';
import type { DayPackage, ExtraPersonRates } from './types';

describe('computeDayPicnic', () => {
  const pkg: DayPackage = { id: 'd2', label: '9AM-9PM', rate: 1500, meals: { B: 1, L: 1, H: 1, D: 1 } };

  it('charges below-5 free, 5-10 at 70%, above-10 at full rate', () => {
    const r = computeDayPicnic({ packageId: 'd2', walkIn: false, paxBelow5: 1, pax5to10: 1, paxAbove10: 2 }, pkg, 100);
    // 0 + 1500*0.7 + 2*1500 = 1050 + 3000 = 4050
    expect(r.amount).toBe(4050);
    expect(r.totalPax).toBe(4);
  });

  it('only counts meals the package actually includes', () => {
    const breakfastOnlyPkg: DayPackage = { id: 'd4', label: '4PM-9PM', rate: 850, meals: { B: 0, L: 0, H: 1, D: 1 } };
    const r = computeDayPicnic({ packageId: 'd4', walkIn: false, paxBelow5: 0, pax5to10: 0, paxAbove10: 3 }, breakfastOnlyPkg, 100);
    expect(r.meals).toEqual({ B: 0, L: 0, H: 3, D: 3 });
  });

  it('adds the walk-in surcharge per pax when flagged', () => {
    const r = computeDayPicnic({ packageId: 'd2', walkIn: true, paxBelow5: 0, pax5to10: 0, paxAbove10: 2 }, pkg, 100);
    expect(r.amount).toBe(2 * 1500 + 2 * 100);
  });

  it('never produces a negative pax count from bad input', () => {
    const r = computeDayPicnic({ packageId: 'd2', walkIn: false, paxBelow5: -5, pax5to10: 0, paxAbove10: 0 }, pkg, 100);
    expect(r.totalPax).toBe(0);
    expect(r.amount).toBe(0);
  });
});

describe('autoSplitExtra', () => {
  it('fills capacity adults-first, spilling extras in Above10 -> 5to10 -> Below5 order', () => {
    // capacity 2, pax = 1 below5 + 1 age5to10 + 2 above10 (total 4)
    const r = autoSplitExtra(1, 1, 2, 2);
    // both capacity slots go to the 2 "above10" pax; the below5 and 5to10 pax become extra
    expect(r).toEqual({ extraAbove10: 0, extra5to10: 1, extraBelow5: 1 });
  });

  it('produces no extras when everyone fits inside capacity', () => {
    const r = autoSplitExtra(0, 1, 1, 4);
    expect(r).toEqual({ extraAbove10: 0, extra5to10: 0, extraBelow5: 0 });
  });
});

describe('computeOvernight', () => {
  const extraRates: ExtraPersonRates = { below5: 0, age5to10: 1500, above10: 1800 };

  it('matches the flyer: a 2-person cottage at ₹6500 with no extras', () => {
    const r = computeOvernight(
      { unitId: 'cottage', nights: 1, manualExtra: false, paxBelow5: 0, pax5to10: 0, paxAbove10: 2 },
      { capacity: 2, rate: 6500 }, extraRates, 1200,
    );
    expect(r.baseAmount).toBe(6500);
    expect(r.extraCharge).toBe(0);
    expect(r.totalAmount).toBe(6500);
    expect(r.foodCostValue).toBe(2 * 1200); // 2 pax * 1 night
    expect(r.roomRevenue).toBe(6500 - 2400);
  });

  it('bills pax beyond capacity as extra, per night', () => {
    // cottage cap 2, 3 pax (2 above10 fill capacity, 1 age5to10 is extra), 2 nights
    const r = computeOvernight(
      { unitId: 'cottage', nights: 2, manualExtra: false, paxBelow5: 0, pax5to10: 1, paxAbove10: 2 },
      { capacity: 2, rate: 6500 }, extraRates, 1200,
    );
    expect(r.baseAmount).toBe(13000); // 6500 * 2 nights
    expect(r.extraCharge).toBe(1500 * 2); // 1 extra age5to10 pax * 2 nights
    expect(r.totalAmount).toBe(13000 + 3000);
    expect(r.foodCostValue).toBe(3 * 1200 * 2); // 3 total pax * 2 nights
  });

  it('respects a manual override of the extra-pax split', () => {
    const r = computeOvernight(
      { unitId: 'cottage', nights: 1, manualExtra: true, paxBelow5: 0, pax5to10: 0, paxAbove10: 3, extraAbove10: 2, extra5to10: 0, extraBelow5: 0 },
      { capacity: 2, rate: 6500 }, extraRates, 1200,
    );
    expect(r.extraAbove10).toBe(2);
    expect(r.extraCharge).toBe(2 * 1800);
  });

  it('defaults nights to 1 when given 0 or missing', () => {
    const r = computeOvernight(
      { unitId: 'cottage', nights: 0, manualExtra: false, paxBelow5: 0, pax5to10: 0, paxAbove10: 1 },
      { capacity: 2, rate: 6500 }, extraRates, 1200,
    );
    expect(r.nights).toBe(1);
  });
});
