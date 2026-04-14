import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { UserProfile } from './types';
import { mockUser } from './mockData';

interface UserState {
  user: UserProfile;
  incrementTrips: () => void;
  updateCancellationRate: () => void;
  updateUser: (updates: Partial<UserProfile>) => void;
  resetUser: () => void;
}

export const useUserStore = create<UserState>()(persist((set) => ({
  user: mockUser,
  incrementTrips: () =>
    set((state) => ({
      user: { ...state.user, totalTrips: state.user.totalTrips + 1 },
    })),
  updateCancellationRate: () =>
    set((state) => {
      const newRate = Math.min(
        100,
        Number(((state.user.cancellationRate * state.user.totalTrips + 1) / (state.user.totalTrips + 1)).toFixed(1))
      );
      return { user: { ...state.user, cancellationRate: newRate } };
    }),
  updateUser: (updates) =>
    set((state) => ({ user: { ...state.user, ...updates } })),
  resetUser: () => set({ user: mockUser }),
}), { name: 'roulii-user', version: 2 }));
