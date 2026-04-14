'use client';

import Link from 'next/link';
import { useRidesStore } from '@/stores/ridesStore';
import { useChatStore } from '@/stores/chatStore';
import TopAppBar from '@/components/TopAppBar';
import BottomNavBar from '@/components/BottomNavBar';

export default function MessagerieIndex() {
  const rides = useRidesStore((s) => s.rides);
  const messages = useChatStore((s) => s.messages);

  const conversations = rides
    .filter((r) => r.status !== 'cancelled')
    .map((ride) => {
      const rideMessages = messages.filter((m) => m.rideId === ride.id);
      const lastMessage = rideMessages.filter((m) => m.sender !== 'system').at(-1);
      return { ride, lastMessage, messageCount: rideMessages.length };
    })
    .filter((c) => c.messageCount > 0 || c.ride.status === 'confirmed' || c.ride.status === 'pending');

  return (
    <>
      <TopAppBar title="Messages" showBack={false} />
      <main className="pt-24 pb-32 px-6">
        <h2 className="font-headline font-extrabold text-3xl text-primary tracking-tight mb-8">
          Conversations
        </h2>

        {conversations.length === 0 ? (
          <div className="py-20 flex flex-col items-center opacity-40">
            <span className="material-symbols-outlined text-6xl mb-4">chat_bubble_outline</span>
            <p className="text-sm font-medium text-center">Aucune conversation active</p>
            <p className="text-xs text-on-surface-variant mt-1">Réservez un trajet pour démarrer</p>
          </div>
        ) : (
          <div className="space-y-3">
            {conversations.map(({ ride, lastMessage }) => (
              <Link
                key={ride.id}
                href={`/messagerie/${ride.id}`}
                className="flex items-center gap-4 p-4 bg-surface-container-lowest rounded-xl hover:bg-surface-container transition-colors active:scale-[0.98] transition-all"
              >
                <div className="relative shrink-0">
                  <div className="w-14 h-14 rounded-full overflow-hidden bg-surface-container-highest">
                    {ride.driver.avatar ? (
                      <img className="w-full h-full object-cover" src={ride.driver.avatar} alt={ride.driver.name} />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-primary">
                        <span className="material-symbols-outlined text-2xl">person</span>
                      </div>
                    )}
                  </div>
                  {(ride.status === 'confirmed' || ride.status === 'pending') && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-secondary rounded-full ring-2 ring-surface"></div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline">
                    <h3 className="font-headline font-bold text-sm text-primary truncate">{ride.driver.name}</h3>
                    <span className="text-[10px] text-on-surface-variant shrink-0 ml-2">
                      {lastMessage?.time || ''}
                    </span>
                  </div>
                  <p className="text-xs text-on-surface-variant truncate mt-0.5">
                    {lastMessage
                      ? `${lastMessage.sender === 'user' ? 'Vous : ' : ''}${lastMessage.text}`
                      : `${ride.departure} → ${ride.destination}`}
                  </p>
                  <span className="text-[10px] text-secondary font-semibold mt-1 inline-block">
                    {ride.date} • {ride.time}
                  </span>
                </div>
                <span className="material-symbols-outlined text-outline-variant text-lg">chevron_right</span>
              </Link>
            ))}
          </div>
        )}
      </main>
      <BottomNavBar />
    </>
  );
}
