export const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: '◉' },
  { to: '/day-picnic', label: 'Day Picnic', icon: '☀' },
  { to: '/overnight', label: 'Overnight', icon: '☂' },
  { to: '/store', label: 'In-House Store', icon: '🛍' },
  { to: '/expenses', label: 'Expenses', icon: '💰' },
  { to: '/payments', label: 'Payments', icon: '⌛' },
  { to: '/reports', label: 'Reports', icon: '📊' },
  // The API rejects every settings write from a non-admin with a 403 (see
  // SettingsController's @Roles('admin')) — hiding the link for staff
  // avoids sending them into a page of inputs that look editable but can
  // never actually save.
  { to: '/settings', label: 'Settings', icon: '⚙', adminOnly: true },
] as const;
