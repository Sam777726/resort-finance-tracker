/** Shared domain types — imported by both the NestJS API and the React app
 * so a booking's shape can never silently drift between client and server. */

export type PaymentMethod = 'cash' | 'upi' | 'cc' | 'cheque';

export interface PaymentSplit {
  cash: number;
  upi: number;
  cc: number;
  cheque?: number;
}

export type BalanceStatus = 'pending' | 'received';

export interface AdvancePayment {
  amount: number;
  date: string | null;
  split: PaymentSplit;
}

export interface BalancePayment {
  amount: number;
  status: BalanceStatus;
  split: PaymentSplit;
  receivedDate: string | null;
}

export interface MealCounts {
  B: number;
  L: number;
  H: number;
  D: number;
}

export interface DayPackage {
  id: string;
  label: string;
  rate: number;
  meals: { B: 0 | 1; L: 0 | 1; H: 0 | 1; D: 0 | 1 };
}

export interface TentType {
  id: string;
  name: string;
  category: string;
  capacity: number;
  rate: number;
}

export interface ExtraPersonRates {
  below5: number;
  age5to10: number;
  above10: number;
}

export interface GeneralSettings {
  resortName: string;
  foodCostPerHead: number;
  walkInSurcharge: number;
}

/** Input every day-picnic pricing calculation starts from — matches what
 * the pax steppers on the booking form produce. */
export interface DayPicnicInput {
  packageId: string;
  walkIn: boolean;
  paxBelow5: number;
  pax5to10: number;
  paxAbove10: number;
}

export interface DayPicnicComputed {
  totalPax: number;
  amount: number;
  meals: MealCounts;
}

export interface OvernightInput {
  unitId: string;
  nights: number;
  manualExtra: boolean;
  paxBelow5: number;
  pax5to10: number;
  paxAbove10: number;
  extraBelow5?: number;
  extra5to10?: number;
  extraAbove10?: number;
}

export interface OvernightComputed {
  totalPax: number;
  nights: number;
  extraBelow5: number;
  extra5to10: number;
  extraAbove10: number;
  baseAmount: number;
  extraCharge: number;
  totalAmount: number;
  foodCostValue: number;
  roomRevenue: number;
  meals: MealCounts;
}

/** WebSocket event names the API broadcasts after a write, and the shape of
 * the payload for each — the frontend uses this to invalidate the right
 * TanStack Query cache key instead of guessing. */
export const LIVE_EVENTS = {
  DAY_CHANGED: 'income-day:changed',
  OVERNIGHT_CHANGED: 'income-overnight:changed',
  STORE_CHANGED: 'income-store:changed',
  EXPENSE_CHANGED: 'expense:changed',
  SETTINGS_CHANGED: 'settings:changed',
} as const;

export type LiveEventName = (typeof LIVE_EVENTS)[keyof typeof LIVE_EVENTS];
