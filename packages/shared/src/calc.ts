import type {
  DayPackage,
  DayPicnicComputed,
  DayPicnicInput,
  ExtraPersonRates,
  MealCounts,
  OvernightComputed,
  OvernightInput,
  TentType,
} from './types';

export function clamp0(n: number | undefined | null): number {
  return Math.max(0, Math.round(Number(n) || 0));
}

/** Day-picnic pricing: below-5 free, 5-10yrs at 70% of the package rate,
 * above-10 at full rate. Meals only count for the courses the chosen
 * package actually includes. */
export function computeDayPicnic(input: DayPicnicInput, pkg: DayPackage, walkInSurcharge: number): DayPicnicComputed {
  const paxBelow5 = clamp0(input.paxBelow5);
  const pax5to10 = clamp0(input.pax5to10);
  const paxAbove10 = clamp0(input.paxAbove10);
  const totalPax = paxBelow5 + pax5to10 + paxAbove10;

  const base = pax5to10 * pkg.rate * 0.7 + paxAbove10 * pkg.rate * 1.0;
  const surcharge = input.walkIn ? totalPax * (walkInSurcharge || 0) : 0;
  const amount = Math.round(base + surcharge);

  const meals: MealCounts = {
    B: pkg.meals.B ? totalPax : 0,
    L: pkg.meals.L ? totalPax : 0,
    H: pkg.meals.H ? totalPax : 0,
    D: pkg.meals.D ? totalPax : 0,
  };

  return { totalPax, amount, meals };
}

/** Splits overnight pax into "included in the unit's base capacity" vs
 * "extra, billed per age band" — capacity is filled adults-first
 * (Above10 -> 5to10 -> Below5), since the flyer's flat per-unit rate is
 * quoted for a stated adult occupancy. */
export function autoSplitExtra(paxBelow5: number, pax5to10: number, paxAbove10: number, capacity: number) {
  let capLeft = clamp0(capacity);
  const takeAbove = Math.min(capLeft, paxAbove10); capLeft -= takeAbove;
  const take510 = Math.min(capLeft, pax5to10); capLeft -= take510;
  const takeBelow = Math.min(capLeft, paxBelow5); capLeft -= takeBelow;
  return {
    extraAbove10: clamp0(paxAbove10 - takeAbove),
    extra5to10: clamp0(pax5to10 - take510),
    extraBelow5: clamp0(paxBelow5 - takeBelow),
  };
}

/** Overnight pricing: base unit rate covers its stated capacity; anyone
 * beyond that is billed as an extra person per night. Food cost is
 * bifurcated out of the total at a standardized per-head rate so room
 * revenue can be reported separately from the food component. */
export function computeOvernight(
  input: OvernightInput,
  unit: Pick<TentType, 'capacity' | 'rate'>,
  extraRates: ExtraPersonRates,
  foodCostPerHead: number,
): OvernightComputed {
  const paxBelow5 = clamp0(input.paxBelow5);
  const pax5to10 = clamp0(input.pax5to10);
  const paxAbove10 = clamp0(input.paxAbove10);
  const totalPax = paxBelow5 + pax5to10 + paxAbove10;
  const nights = clamp0(input.nights) || 1;

  let extraBelow5: number, extra5to10: number, extraAbove10: number;
  if (input.manualExtra) {
    extraBelow5 = clamp0(input.extraBelow5);
    extra5to10 = clamp0(input.extra5to10);
    extraAbove10 = clamp0(input.extraAbove10);
  } else {
    ({ extraBelow5, extra5to10, extraAbove10 } = autoSplitExtra(paxBelow5, pax5to10, paxAbove10, unit.capacity));
  }

  const extraCharge = (extra5to10 * extraRates.age5to10 + extraAbove10 * extraRates.above10 + extraBelow5 * extraRates.below5) * nights;
  const baseAmount = unit.rate * nights;
  const totalAmount = Math.round(baseAmount + extraCharge);
  const foodCostValue = Math.round((foodCostPerHead || 0) * totalPax * nights);
  const roomRevenue = totalAmount - foodCostValue;
  const meals: MealCounts = { B: totalPax * nights, L: totalPax * nights, H: totalPax * nights, D: totalPax * nights };

  return { totalPax, nights, extraBelow5, extra5to10, extraAbove10, extraCharge, baseAmount, totalAmount, foodCostValue, roomRevenue, meals };
}
