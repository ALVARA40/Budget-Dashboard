-- ============================================================
-- Fix categories.kind values
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================

-- NEEDS (kind = 'need')
UPDATE categories SET kind = 'need' WHERE name IN (
  'AD&D Insurance',
  'Banking expenses',
  'Car Insurance',
  'Car Purchase',
  'Communications',
  'Dental Insurance',
  'Education',
  'Electric',
  'Equity Net Value',
  'Extracurricular activities',
  'Fuel',
  'Groceries',
  'Health Insurance',
  'Internet Service',
  'Licensing',
  'Life Insurance',
  'Long-term disability',
  'Maintenance',
  'Medical Health',
  'Medical Therapies',
  'Mortgage/Rent',
  'Natural Gas/Oil',
  'Parking & Tolls Fees',
  'Personal',
  'Pet Food',
  'Pet Grooming',
  'Pet Medical',
  'Rideshare Fare (Taxi, Bus, etc.)',
  'School supplies',
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
  'Credit Card',
  'Dining out',
  'Gifts and charity',
  'Gym',
  'Hair cut/nails',
  'Home Decor',
  'Hotel',
  'Shopping',
  'Streaming services',
  'Toys',
  'Travel',
  'Videogames'
);

-- MANDATORY DEDUCTIONS (kind = 'need' — payroll deductions)
UPDATE categories SET kind = 'need' WHERE name IN (
  'Federal',
  'Medicare',
  'Social Security/FICA',
  'State'
);

-- INCOME (kind = 'income')
UPDATE categories SET kind = 'income' WHERE name IN (
  'Other Income',
  'Rental Income',
  'Spouse Income',
  'Work Income',
  'Work Income (GDP, Extras,...)'
);

-- SAVINGS (kind = 'savings' — should already be correct, but reaffirming)
UPDATE categories SET kind = 'savings' WHERE name IN (
  '529 Plan Account',
  'Retirement Account',
  'Retirement Account-Company Match',
  'Retirement Account-Retirement Contribution',
  'Savings Account'
);

-- Verify the result — should show income/need/want/savings with correct counts:
SELECT kind, COUNT(*) AS count, array_agg(name ORDER BY name) AS categories
FROM categories
WHERE user_id = auth.uid()
GROUP BY kind
ORDER BY kind;
