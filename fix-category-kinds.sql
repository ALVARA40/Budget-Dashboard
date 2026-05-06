-- ============================================================
-- Fix categories.kind values
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================

-- NEEDS (kind = 'need')
UPDATE categories SET kind = 'need' WHERE name IN (
  'AD&D Insurance',
  'Banking expenses',
  'Car Insurance',
  'Communications',
  'Dental Insurance',
  'Electric',
  'Equity Net Value',
  'Fuel',
  'Groceries',
  'Health Insurance',
  'Internet Service',
  'Life Insurance',
  'Long-term disability',
  'Maintenance',
  'Medical Health',
  'Mortgage/Rent',
  'Parking & Tolls Fees',
  'Personal',
  'Pet Food',
  'Pet Medical',
  'Rideshare Fare (Taxi, Bus, etc.)',
  'School tuition',
  'Security',
  'Speech/OT Therapies',
  'Vacations Purchase',
  'Vehicle Payment',
  'Vision Insurance',
  'Voluntary Benefits',
  'Waste Removal & Recycle',
  'Water & Sewer'
);

-- WANTS (kind = 'want')
UPDATE categories SET kind = 'want' WHERE name IN (
  'Apps',
  'Beverages/Dessert',
  'Clothing',
  'Concerts/Live theater/Sport events',
  'Dining out',
  'Hair cut/nails',
  'Home Decor',
  'Hotel',
  'Shopping',
  'Streaming services',
  'Toys',
  'Videogames'
);

-- MANDATORY DEDUCTIONS (kind = 'need' — these are payroll deductions, treated as needs)
UPDATE categories SET kind = 'need' WHERE name IN (
  'Federal',
  'Medicare',
  'Social Security/FICA'
);

-- INCOME (kind = 'income' — should already be correct, but just in case)
UPDATE categories SET kind = 'income' WHERE name IN (
  'Work Income',
  'Work Income (GDP, Extras,...)',
  'Other Income',
  'Rental Income'
);

-- SAVINGS (kind = 'savings' — should already be correct, but just in case)
UPDATE categories SET kind = 'savings' WHERE name IN (
  '529 Plan Account',
  'Retirement Account',
  'Retirement Account-Company Match',
  'Retirement Account-Retirement Contribution',
  'Savings Account'
);

-- Verify the result:
SELECT kind, COUNT(*) AS count, array_agg(name ORDER BY name) AS categories
FROM categories
WHERE user_id = auth.uid()
GROUP BY kind
ORDER BY kind;
