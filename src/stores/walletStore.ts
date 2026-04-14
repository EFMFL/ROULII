import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Transaction } from './types';
import { mockTransactions } from './mockData';

interface WalletState {
  balance: number;
  pendingEarnings: number;
  transactions: Transaction[];
  debit: (amount: number, label: string) => void;
  credit: (amount: number, label: string) => void;
}

export const useWalletStore = create<WalletState>()(persist((set) => ({
  balance: 1240.50,
  pendingEarnings: 342.00,
  transactions: mockTransactions,
  debit: (amount, label) =>
    set((state) => ({
      balance: state.balance - amount,
      transactions: [
        {
          id: `t${Date.now()}`,
          type: 'penalty_paid' as const,
          label,
          amount: -amount,
          date: 'Maintenant',
          icon: 'payments',
        },
        ...state.transactions,
      ],
    })),
  credit: (amount, label) =>
    set((state) => ({
      balance: state.balance + amount,
      transactions: [
        {
          id: `t${Date.now()}`,
          type: 'payment' as const,
          label,
          amount,
          date: 'Maintenant',
          icon: 'directions_car',
        },
        ...state.transactions,
      ],
    })),
}), { name: 'roulii-wallet', version: 2 }));
