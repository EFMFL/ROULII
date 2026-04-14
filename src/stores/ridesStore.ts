import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Ride } from './types';
import { mockRides } from './mockData';

interface RidesState {
  rides: Ride[];
  addRide: (ride: Omit<Ride, 'id' | 'createdAt'>) => void;
  cancelRide: (id: string) => void;
  getRide: (id: string) => Ride | undefined;
  getUpcoming: () => Ride[];
  getCompleted: () => Ride[];
}

export const useRidesStore = create<RidesState>()(persist((set, get) => ({
  rides: mockRides,
  addRide: (ride) =>
    set((state) => ({
      rides: [
        {
          ...ride,
          id: String(Date.now()),
          createdAt: Date.now(),
        },
        ...state.rides,
      ],
    })),
  cancelRide: (id) =>
    set((state) => ({
      rides: state.rides.map((r) =>
        r.id === id ? { ...r, status: 'cancelled' as const } : r
      ),
    })),
  getRide: (id) => get().rides.find((r) => r.id === id),
  getUpcoming: () =>
    get().rides.filter((r) => r.status === 'confirmed' || r.status === 'pending'),
  getCompleted: () =>
    get().rides.filter((r) => r.status === 'completed' || r.status === 'cancelled'),
}), { name: 'roulii-rides', version: 2 }));
