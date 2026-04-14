import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ChatMessage } from './types';
import { mockMessages } from './mockData';

interface ChatState {
  messages: ChatMessage[];
  getMessagesForRide: (rideId: string) => ChatMessage[];
  sendMessage: (rideId: string, text: string, sender?: 'user' | 'remote') => void;
}

export const useChatStore = create<ChatState>()(persist((set, get) => ({
  messages: mockMessages,
  getMessagesForRide: (rideId) =>
    get().messages.filter((m) => m.rideId === rideId),
  sendMessage: (rideId, text, sender = 'user') => {
    const now = new Date();
    const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    set((state) => ({
      messages: [
        ...state.messages,
        {
          id: `m${Date.now()}`,
          rideId,
          sender: sender as 'user' | 'remote',
          text,
          time,
        },
      ],
    }));
  },
}), { name: 'roulii-chat', version: 2 }));
