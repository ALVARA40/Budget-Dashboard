// Static data seeded from the user's Excel file (April 2026).
// The app renders this when Supabase is not yet connected.
// Once you connect Supabase, live queries replace these values.

import type { KpiData, FlowMonth, SplitSegment, BudgetItem, Transaction, SavingsGoal } from '../types';

export const STATIC_KPI: KpiData = {
  income:      { value: 38632.12, delta: +6.4  },
  expenses:    { value: 23285.07, delta: -2.1  },
  savings:     { value:  9253.75, delta: +11.8 },
  savingsRate: { value: 23.95,    delta: +3.2  },
};

export const STATIC_FLOW: FlowMonth[] = [
  { m: 'Nov', income: 17504, expenses: 12378 },
  { m: 'Dec', income: 18840, expenses: 12323 },
  { m: 'Jan', income: 57207, expenses: 17916 },
  { m: 'Feb', income: 18563, expenses: 22042 },
  { m: 'Mar', income: 80607, expenses: 55685 },
  { m: 'Apr', income: 38632, expenses: 23285 },
];

export const STATIC_SPLIT: SplitSegment[] = [
  { key: 'needs',   label: 'Needs',   value: 12104.61, target: 50, actual: 52, color: '#7C5CFC' },
  { key: 'wants',   label: 'Wants',   value:  6987.63, target: 30, actual: 30, color: '#F5B544' },
  { key: 'savings', label: 'Savings', value:  4193.20, target: 20, actual: 18, color: '#33C58A' },
];

export const STATIC_BUDGET: BudgetItem[] = [
  { name: 'Mortgage/Rent',        spent: 4433.48, budget: 4433.58, color: '#7C5CFC' },
  { name: 'Federal Tax',          spent: 2666.80, budget: 2667.00, color: '#4BA3F7' },
  { name: 'Groceries',            spent: 1194.56, budget:  850.00, color: '#F25F5C' },
  { name: 'Social Security/FICA', spent: 1029.12, budget: 1029.40, color: '#9B7BFF' },
  { name: 'Health Insurance',     spent:  735.10, budget:  735.10, color: '#33C58A' },
  { name: 'Shopping',             spent:  612.00, budget:  550.00, color: '#F25F5C' },
];

export const STATIC_TRANSACTIONS: Transaction[] = [
  { id:'1', user_id:'', date:'2026-04-22', amount:-148.22,  description:'Whole Foods Market',   category_id:'', bank_id:'', company_id:'', method:'card',     created_at:'', category:{ id:'', user_id:'', name:'Groceries',          color:'#9B7BFF', kind:'need',    monthly_budget:850  } },
  { id:'2', user_id:'', date:'2026-04-21', amount: 9413.00, description:'Work Income — Salary', category_id:'', bank_id:'', company_id:'', method:'transfer', created_at:'', category:{ id:'', user_id:'', name:'Work Income',         color:'#33C58A', kind:'income',  monthly_budget:0    } },
  { id:'3', user_id:'', date:'2026-04-20', amount:  -62.40, description:'Shell Gas Station',    category_id:'', bank_id:'', company_id:'', method:'card',     created_at:'', category:{ id:'', user_id:'', name:'Fuel',                color:'#F5B544', kind:'need',    monthly_budget:150  } },
  { id:'4', user_id:'', date:'2026-04-19', amount: -214.88, description:'Amazon',               category_id:'', bank_id:'', company_id:'', method:'card',     created_at:'', category:{ id:'', user_id:'', name:'Shopping',            color:'#4BA3F7', kind:'want',    monthly_budget:550  } },
  { id:'5', user_id:'', date:'2026-04-18', amount:-2100.00, description:'Chase Mortgage',       category_id:'', bank_id:'', company_id:'', method:'transfer', created_at:'', category:{ id:'', user_id:'', name:'Mortgage/Rent',       color:'#7C5CFC', kind:'need',    monthly_budget:4433 } },
  { id:'6', user_id:'', date:'2026-04-17', amount: 1820.00, description:'Bancolombia Transfer', category_id:'', bank_id:'', company_id:'', method:'transfer', created_at:'', category:{ id:'', user_id:'', name:'Other Income',        color:'#33C58A', kind:'income',  monthly_budget:0    } },
  { id:'7', user_id:'', date:'2026-04-16', amount:  -22.99, description:'Netflix',              category_id:'', bank_id:'', company_id:'', method:'card',     created_at:'', category:{ id:'', user_id:'', name:'Streaming services',  color:'#F25F5C', kind:'want',    monthly_budget:50   } },
  { id:'8', user_id:'', date:'2026-04-15', amount: -287.14, description:'Costco',               category_id:'', bank_id:'', company_id:'', method:'card',     created_at:'', category:{ id:'', user_id:'', name:'Groceries',          color:'#9B7BFF', kind:'need',    monthly_budget:850  } },
];

export const STATIC_GOALS: SavingsGoal[] = [
  { id:'1', user_id:'', name:'Emergency Fund',   target:20000, current:14820, deadline:null, color:'#7C5CFC' },
  { id:'2', user_id:'', name:'Vacation · Japan', target: 6000, current: 3240, deadline:null, color:'#33C58A' },
  { id:'3', user_id:'', name:'New Car',          target:18000, current: 4100, deadline:null, color:'#F5B544' },
];

// All 86 categories pre-seeded from Excel (used for "Add entry" dropdowns)
export const ALL_CATEGORIES = {
  income: [
    'Work Income','Business Income','Side Hustle Income','Investment Income',
    'Other Income','Freelance Income','Rental Income','Dividend Income',
    'Interest Income','Tax Refund',
  ],
  needs: [
    'Mortgage/Rent','Federal Tax','Social Security/FICA','Health Insurance',
    'Medicare','State Tax','Car Purchase','Car Insurance','Car Maintenance',
    'Fuel','Groceries','Electricity','Water','Internet','Cell Phone',
    'Home Insurance','Life Insurance','Dental Insurance','Vision Insurance',
    'Medical/Doctor','Pharmacy','School Tuition','Student Loan',
    'Child Care','Pet Food','Pet Vet','Minimum Debt Payment',
    'Subscriptions (essential)','Public Transit','Parking',
  ],
  wants: [
    'Dining out','Coffee Shops','Alcohol/Bars','Shopping','Clothing',
    'Electronics','Entertainment','Streaming services','Gaming',
    'Hobbies','Sports & Fitness','Gym Membership','Beauty/Personal Care',
    'Hair & Grooming','Spa & Massage','Travel','Hotel','Flights',
    'Vacation Activities','Gifts','Donations','Books & Education',
    'Music & Podcasts','Concerts & Events','Movies & Shows','Eating out',
    'Fast Food','Bakery','Ice Cream','Snacks','Tobacco','Lottery',
    'Pet Accessories','Home Decor','Furniture','Garden',
    'Cleaning Supplies','Laundry','Car Wash','Tolls',
    'Amazon Subscriptions','Other Subscriptions',
  ],
  savings: [
    '401k','Roth IRA','HSA','Emergency Fund','Investment Account',
    'Savings Account','529 College Fund','Other Savings',
  ],
};
