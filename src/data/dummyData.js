import { getTodayISO } from '../utils/helpers';

export const DUMMY_USER = {
  id: 999,
  name: 'Developer (Debug Mode)',
  email: 'dev@localhost',
  avatar: null
};

export const DUMMY_SUMMARY = {
  pemasukan: 15000000, 
  pengeluaran: 4500000, 
  saldo: 10500000
};

export const DUMMY_CHART = {
  pemasukan: [
    { month: 'Jan', amount: 5000000 },
    { month: 'Feb', amount: 4000000 },
    { month: 'Mar', amount: 6000000 }
  ],
  pengeluaran: [
    { month: 'Jan', amount: 1500000 },
    { month: 'Feb', amount: 2000000 },
    { month: 'Mar', amount: 1000000 }
  ]
};

export const DUMMY_WISHLIST = [
  { id: 1, name: 'MacBook Pro M3', target_amount: 25000000, saved_amount: 10000000 },
  { id: 2, name: 'Liburan Jepang', target_amount: 15000000, saved_amount: 5000000 },
  { id: 3, name: 'Dana Darurat', target_amount: 50000000, saved_amount: 10500000 }
];

export const DUMMY_PEMASUKAN = [
  { id: 1, transaction_date: getTodayISO(), amount: 5000000, description: 'Gaji Bulanan', type: 'pemasukan' },
  { id: 2, transaction_date: '2026-05-01', amount: 10000000, description: 'Bonus Project', type: 'pemasukan' }
];

export const DUMMY_PENGELUARAN = [
  { id: 3, transaction_date: getTodayISO(), amount: 1500000, description: 'Beli Kebutuhan Bulanan', type: 'pengeluaran' },
  { id: 4, transaction_date: '2026-05-05', amount: 3000000, description: 'Bayar Kos', type: 'pengeluaran' }
];

export const DUMMY_ALL_TRANSACTIONS = [...DUMMY_PEMASUKAN, ...DUMMY_PENGELUARAN];
