import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Review } from './types';
import { mockReviews } from './mockData';

interface ReviewsState {
  reviews: Review[];
  getReviewsForRide: (rideId: string) => Review[];
  addReview: (review: Omit<Review, 'id'>) => void;
}

export const useReviewsStore = create<ReviewsState>()(persist((set, get) => ({
  reviews: mockReviews,
  getReviewsForRide: (rideId) => get().reviews.filter((r) => r.rideId === rideId),
  addReview: (review) =>
    set((state) => ({
      reviews: [{ ...review, id: `r${Date.now()}` }, ...state.reviews],
    })),
}), { name: 'roulii-reviews', version: 2 }));
