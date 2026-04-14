'use client';

import { use, useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useChatStore } from '@/stores/chatStore';
import { useRidesStore } from '@/stores/ridesStore';

export default function Messagerie({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const allMessages = useChatStore((s) => s.messages);
  const sendMessage = useChatStore((s) => s.sendMessage);
  const rides = useRidesStore((s) => s.rides);
  const ride = rides.find((r) => r.id === id);
  const messages = allMessages.filter((m) => m.rideId === id);

  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const autoReplies = [
    'D\'accord, pas de souci !',
    'Je suis en route, j\'arrive dans 5 minutes.',
    'Parfait, à tout de suite !',
    'Merci pour votre message. Je vous confirme que tout est en ordre.',
    'N\'hésitez pas si vous avez d\'autres questions.',
  ];

  const handleSend = () => {
    if (!input.trim()) return;
    sendMessage(id, input.trim());
    setInput('');
    setTimeout(() => {
      const reply = autoReplies[Math.floor(Math.random() * autoReplies.length)];
      sendMessage(id, reply, 'remote');
    }, 1500 + Math.random() * 1500);
  };

  const driverName = ride?.driver.name || 'Chauffeur';
  const driverAvatar = ride?.driver.avatar || '';

  return (
    <>
      {/* TopAppBar */}
      <header className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-md z-50 glass-header flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-4">
          <Link href="/messagerie" className="active:scale-95 transition-transform">
            <span className="material-symbols-outlined text-primary text-2xl">arrow_back</span>
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden bg-surface-container-highest">
              {driverAvatar ? (
                <img className="w-full h-full object-cover" src={driverAvatar} alt={driverName} />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined">person</span>
                </div>
              )}
            </div>
            <div>
              <h1 className="font-headline font-bold text-lg tracking-tight text-primary leading-tight">
                {driverName}
              </h1>
              <span className="font-label text-[10px] text-secondary font-semibold uppercase tracking-wider">
                Numéros non visibles
              </span>
            </div>
          </div>
        </div>
        <Link
          href={`/appel/${id}`}
          className="flex items-center justify-center w-12 h-12 rounded-full bg-secondary text-on-secondary active:scale-95 transition-all shadow-lg shadow-secondary/20"
        >
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>call</span>
        </Link>
      </header>

      <main className="pt-24 pb-32 px-6 flex flex-col gap-6">
        {/* Date Marker */}
        <div className="flex justify-center">
          <span className="bg-surface-container text-on-surface-variant px-4 py-1 rounded-full text-[11px] font-semibold uppercase tracking-widest">
            Aujourd&apos;hui
          </span>
        </div>

        {messages.map((msg) => {
          if (msg.sender === 'system') {
            if (msg.text.startsWith('Conversation sécurisée')) {
              return (
                <div key={msg.id} className="bg-surface-container-low p-4 rounded-xl flex items-start gap-3">
                  <span className="material-symbols-outlined text-on-primary-container text-xl">verified_user</span>
                  <div className="flex flex-col">
                    <p className="text-xs font-semibold text-on-surface leading-tight">Conversation sécurisée</p>
                    <p className="text-[11px] text-on-surface-variant mt-1 leading-normal">
                      Vos données et votre numéro de téléphone sont protégés par le système de cryptage Roulii.
                    </p>
                  </div>
                </div>
              );
            }
            return (
              <div key={msg.id} className="bg-secondary-container/20 p-4 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-secondary-container flex items-center justify-center">
                    <span className="material-symbols-outlined text-secondary text-sm">directions_car</span>
                  </div>
                  <p className="text-xs font-bold text-on-secondary-container">{msg.text}</p>
                </div>
              </div>
            );
          }

          if (msg.sender === 'remote') {
            return (
              <div key={msg.id} className="flex flex-col gap-2 max-w-[85%] self-start animate-msg">
                <div className="bg-surface-container-lowest p-4 rounded-xl rounded-tl-none message-shadow">
                  <p className="text-on-surface leading-relaxed text-sm">{msg.text}</p>
                </div>
                <span className="text-[10px] text-slate-400 font-medium px-1">{msg.time}</span>
              </div>
            );
          }

          return (
            <div key={msg.id} className="flex flex-col gap-2 max-w-[85%] self-end animate-msg">
              <div className="bg-primary p-4 rounded-xl rounded-tr-none shadow-xl shadow-primary/10">
                <p className="text-white leading-relaxed text-sm">{msg.text}</p>
              </div>
              <span className="text-[10px] text-slate-400 font-medium px-1 text-right">{msg.time}</span>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </main>

      {/* Bottom Input Area */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-50 glass-bar px-6 pb-8 pt-4">
        <div className="flex items-center gap-3">
          <button aria-label="Ajouter une pièce jointe" className="w-11 h-11 flex items-center justify-center rounded-full bg-surface-container text-on-surface-variant hover:bg-surface-container-highest transition-colors">
            <span className="material-symbols-outlined">add</span>
          </button>
          <div className="flex-1 relative">
            <input
              className="w-full bg-surface-container-highest border-none rounded-full px-5 py-3 text-sm focus:ring-2 focus:ring-secondary/40 placeholder:text-slate-400 transition-all font-body focus:outline-none"
              placeholder="Écrire un message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            />
          </div>
          <button
            aria-label="Envoyer le message"
            onClick={handleSend}
            className="w-11 h-11 flex items-center justify-center rounded-full bg-primary text-white active:scale-90 transition-all shadow-lg shadow-primary/20"
          >
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>send</span>
          </button>
        </div>
      </div>
    </>
  );
}
