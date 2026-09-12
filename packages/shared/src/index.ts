// Types are erased at compile time, so `export type {...} from` is always
// safe. Values are re-exported as plain `const` re-assignments rather than
// `export { x } from` — TypeScript emits the latter as a CommonJS getter
// (`Object.defineProperty(exports, "x", { get: () => mod.x })`), which
// Rollup's CJS-named-export detection (used by the web app's Vite build)
// doesn't reliably see through when consuming a local workspace package.
// A `const` re-assignment instead compiles to a plain, statically-visible
// `exports.x = mod.x` — this bit the LIVE_EVENTS export specifically; the
// same pattern here for everything else so it can't recur silently.
export type {
  PaymentMethod,
  PaymentSplit,
  BalanceStatus,
  AdvancePayment,
  PartialPayment,
  BalancePayment,
  MealCounts,
  DayPackage,
  TentType,
  ExtraPersonRates,
  GeneralSettings,
  DayPicnicInput,
  DayPicnicComputed,
  OvernightInput,
  OvernightComputed,
  LiveEventName,
} from './types';

import { LIVE_EVENTS as _LIVE_EVENTS } from './types';
export const LIVE_EVENTS = _LIVE_EVENTS;

import { clamp0 as _clamp0, computeDayPicnic as _computeDayPicnic, autoSplitExtra as _autoSplitExtra, computeOvernight as _computeOvernight } from './calc';
export const clamp0 = _clamp0;
export const computeDayPicnic = _computeDayPicnic;
export const autoSplitExtra = _autoSplitExtra;
export const computeOvernight = _computeOvernight;
