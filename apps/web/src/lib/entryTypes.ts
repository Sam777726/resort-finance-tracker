import type { AdvancePayment, BalancePayment, MealCounts, PartialPayment } from '@camp-dilly/shared';

export interface DayEntry {
  id: string;
  date: string;
  packageId: string;
  packageLabel: string;
  rate: number;
  walkIn: boolean;
  tentId: string;
  tentName: string;
  paxBelow5: number;
  pax5to10: number;
  paxAbove10: number;
  totalPax: number;
  meals: MealCounts;
  amount: number;
  discountAmount: number;
  grossAmount: number;
  advance: AdvancePayment;
  partial: PartialPayment;
  balance: BalancePayment;
  notes: string;
}

export interface OvernightEntry {
  id: string;
  checkIn: string;
  nights: number;
  unitId: string;
  unitName: string;
  capacity: number;
  baseRate: number;
  paxBelow5: number;
  pax5to10: number;
  paxAbove10: number;
  totalPax: number;
  manualExtra: boolean;
  extraBelow5: number;
  extra5to10: number;
  extraAbove10: number;
  baseAmount: number;
  extraCharge: number;
  totalAmount: number;
  foodCostValue: number;
  roomRevenue: number;
  meals: MealCounts;
  discountAmount: number;
  grossAmount: number;
  advance: AdvancePayment;
  partial: PartialPayment;
  balance: BalancePayment;
  notes: string;
}

export interface StoreSale {
  id: string;
  date: string;
  itemId: string;
  itemName: string;
  qty: number;
  unitPrice: number;
  amount: number;
  method: string;
  notes: string;
}

export interface ExpenseEntry {
  id: string;
  date: string;
  primary: string;
  sub: string;
  amount: number;
  method: string;
  vendor: string;
  description: string;
}
