import type { DayPackage, ExtraPersonRates, GeneralSettings, TentType } from '@camp-dilly/shared';

export const DEFAULT_DAY_PACKAGES: DayPackage[] = [
  { id: 'd1', label: '9:00 AM – 5:00 PM', rate: 1200, meals: { B: 1, L: 1, H: 1, D: 0 } },
  { id: 'd2', label: '9:00 AM – 9:00 PM', rate: 1500, meals: { B: 1, L: 1, H: 1, D: 1 } },
  { id: 'd3', label: '11:00 AM – 9:00 PM', rate: 1350, meals: { B: 0, L: 1, H: 1, D: 1 } },
  { id: 'd4', label: '4:00 PM – 9:00 PM', rate: 850, meals: { B: 0, L: 0, H: 1, D: 1 } },
];

export const DEFAULT_TENT_TYPES: TentType[] = [
  { id: 'cottage', name: 'Cottage', capacity: 2, rate: 6500, category: 'Cottage' },
  { id: 'tent4', name: 'Tent (4 Person)', capacity: 4, rate: 11000, category: 'Tent' },
  { id: 'rv', name: 'R V Tent', capacity: 4, rate: 0, category: 'RV Tent' },
  { id: 'ctent', name: 'C Tent', capacity: 2, rate: 0, category: 'C Tent' },
  { id: 'cross20', name: 'Crosscamp (20 Person)', capacity: 20, rate: 0, category: 'Crosscamp' },
  { id: 'cross14', name: 'Crosscamp (14 Person)', capacity: 14, rate: 0, category: 'Crosscamp' },
];

export const DEFAULT_EXTRA_RATES: ExtraPersonRates = { below5: 0, age5to10: 1500, above10: 1800 };

export const DEFAULT_GENERAL: GeneralSettings = { resortName: 'Camp Dilly', foodCostPerHead: 1200, walkInSurcharge: 100 };

export const DEFAULT_EXPENSE_CATEGORIES: Record<string, string[]> = {
  'Kitchen Expenses': ['Dairy', 'Vegetable', 'Ration', 'Bakery', 'Ready Food', 'Chas', 'Other'],
  'Room Expenses': ['Linen', 'Laundry', 'Maintenance', 'Tea Coffee Sachet', 'Cutlery', 'Other'],
  Salaries: ['Staff Salary', 'Overtime', 'Bonus', 'Other'],
  'Activities Expenses': ['Equipment', 'Repair', 'Other'],
  'Electricity Expenses': ['Bill', 'Repair', 'Other'],
  'Swimming Pool Expenses': ['Chlorine', 'Brush', 'Maintenance', 'Other'],
  'Generator Expenses': ['Diesel', 'Maintenance', 'Other'],
  'Legal and Professional': ['Consultancy', 'Audit', 'License', 'Other'],
  'Extra Fun': ['Decoration', 'DJ / Music', 'Other'],
  Landscaping: ['Plants', 'Gardener', 'Other'],
  'New Development': ['Construction', 'Design', 'Other'],
  'Purchase of New Utensils': ['Kitchen', 'Crockery', 'Other'],
  Maintenance: ['Repairs', 'Plumbing', 'Electrical', 'Other'],
  Miscellaneous: ['Other'],
  'Commissions Paid': ['Agent', 'Online Platform', 'Other'],
  'Partners Expenses': ['Withdrawal', 'Reimbursement', 'Other'],
};

export const DEFAULT_STORE_ITEMS = [
  { id: 'si1', name: 'Ice Cream', price: 50 },
  { id: 'si2', name: 'Water Bottle', price: 20 },
  { id: 'si3', name: 'Cold Drink', price: 40 },
  { id: 'si4', name: 'Costume Rental', price: 100 },
  { id: 'si5', name: 'Zip Line', price: 100 },
  { id: 'si6', name: 'Archery', price: 50 },
  { id: 'si7', name: 'Rifle Shooting', price: 50 },
  { id: 'si8', name: 'Rappelling', price: 100 },
  { id: 'si9', name: 'Rock Climbing', price: 100 },
  { id: 'si10', name: 'Dart Shooting', price: 50 },
  { id: 'si11', name: 'Tractor Ride (per person)', price: 50 },
  { id: 'si12', name: 'Cycle Ride (10 min)', price: 50 },
];

export const SETTINGS_DEFAULTS: Record<string, unknown> = {
  general: DEFAULT_GENERAL,
  day_packages: { items: DEFAULT_DAY_PACKAGES },
  tent_types: { items: DEFAULT_TENT_TYPES },
  extra_person_rates: DEFAULT_EXTRA_RATES,
  expense_categories: { categories: DEFAULT_EXPENSE_CATEGORIES },
  store_items: { items: DEFAULT_STORE_ITEMS },
  category_budgets: { budgets: {} },
};

export const SETTINGS_KEYS = Object.keys(SETTINGS_DEFAULTS);
