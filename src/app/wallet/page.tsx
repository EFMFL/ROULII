'use client';

import { useState } from 'react';
import { useWalletStore } from '@/stores/walletStore';
import TopAppBar from '@/components/TopAppBar';
import BottomNavBar from '@/components/BottomNavBar';
import AnimatedCounter from '@/components/AnimatedCounter';

export default function Wallet() {
  const balance = useWalletStore((s) => s.balance);
  const pendingEarnings = useWalletStore((s) => s.pendingEarnings);
  const transactions = useWalletStore((s) => s.transactions);
  const [showToast, setShowToast] = useState(false);

  const handleVirement = () => {
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  return (
    <>
      <TopAppBar title="Wallet" />
      <main className="pt-24 pb-48 px-6 space-y-8">
        {/* Bento Wallet Overview */}
        <section className="grid grid-cols-2 gap-4">
          {/* Balance Card */}
          <div className="col-span-2 bg-gradient-to-br from-primary to-primary-container rounded-3xl p-8 relative overflow-hidden text-on-primary">
            <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: 'radial-gradient(circle at 20% 80%, var(--color-surface-tint) 1px, transparent 1px), radial-gradient(circle at 80% 20%, var(--color-surface-tint) 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
            <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -mr-16 -mt-16 blur-3xl"></div>
            <div className="relative z-10">
              <p className="font-label text-sm text-on-primary-container tracking-wider uppercase mb-2">
                Solde disponible
              </p>
              <h2 className="font-headline font-extrabold text-4xl mb-8 tracking-tighter">
                <AnimatedCounter value={balance} suffix=" €" />
              </h2>
              <div className="flex items-center gap-2 bg-white/10 w-fit px-3 py-1 rounded-full backdrop-blur-md">
                <span className="material-symbols-outlined text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>
                  verified_user
                </span>
                <span className="text-[10px] font-bold uppercase tracking-widest">Fonds sécurisés</span>
              </div>
            </div>
          </div>

          {/* Pending Earnings */}
          <div className="bg-surface-container-low rounded-3xl p-6 flex flex-col justify-between">
            <p className="font-label text-xs text-on-surface-variant font-medium">Gains en attente</p>
            <div className="mt-4">
              <AnimatedCounter value={pendingEarnings} suffix=" €" className="font-headline font-bold text-2xl text-primary" />
              <p className="text-[10px] text-on-surface-variant mt-1 italic">Vérification en cours (2-3j)</p>
            </div>
          </div>

          {/* Growth Card */}
          <div className="bg-secondary-container/10 rounded-3xl p-6 flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <span className="material-symbols-outlined text-secondary">trending_up</span>
              <span className="text-[10px] font-bold text-secondary uppercase">+12%</span>
            </div>
            <div className="mt-4">
              <p className="font-label text-xs text-on-surface-variant font-medium">Croissance mensuelle</p>
              <p className="font-headline font-bold text-lg text-secondary">Trajets Premium</p>
            </div>
          </div>
        </section>

        {/* Transaction History */}
        <section className="space-y-6">
          <div className="flex justify-between items-end">
            <h3 className="font-headline font-extrabold text-2xl tracking-tight">Historique transactions</h3>
            <span className="text-xs font-bold text-primary-container underline underline-offset-4 cursor-pointer">
              Tout voir
            </span>
          </div>
          <div className="space-y-4">
            {transactions.map((tx) => (
              <div
                key={tx.id}
                className="bg-surface-container-lowest hover:bg-surface-container transition-colors p-4 rounded-xl flex items-center justify-between group"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      tx.amount > 0
                        ? 'bg-secondary-container/20 text-secondary'
                        : tx.type === 'penalty_received'
                        ? 'bg-error-container/20 text-error'
                        : 'bg-surface-container-high text-primary'
                    }`}
                  >
                    <span className="material-symbols-outlined">{tx.icon}</span>
                  </div>
                  <div>
                    <p className="font-headline font-bold text-sm text-primary">{tx.label}</p>
                    <p className="text-xs text-on-surface-variant">{tx.date}</p>
                  </div>
                </div>
                <span
                  className={`font-headline font-bold ${
                    tx.amount > 0 ? 'text-secondary' : tx.type === 'penalty_received' ? 'text-error' : 'text-primary'
                  }`}
                >
                  {tx.amount > 0 ? '+' : ''}
                  {tx.amount.toFixed(2)} €
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Decorative Card */}
        <div className="relative rounded-3xl h-32 overflow-hidden flex items-center px-8 bg-primary">
          <div className="absolute inset-0 bg-primary/60 backdrop-blur-[2px]"></div>
          <div className="relative z-10">
            <p className="font-headline font-bold text-white text-lg leading-tight">
              Optimisez vos gains<br />
              <span className="text-secondary-fixed text-sm font-medium">Découvrez nos conseils Premium</span>
            </p>
          </div>
        </div>
      </main>

      {/* Sticky Bottom */}
      <div className="fixed bottom-24 left-1/2 -translate-x-1/2 w-full max-w-md z-40 px-6">
        <button
          onClick={handleVirement}
          className="w-full bg-secondary text-on-secondary font-headline font-bold py-5 px-8 rounded-xl shadow-[0_4px_40px_rgba(0,109,55,0.15)] flex items-center justify-center gap-3 active:scale-95 transition-all"
        >
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
            account_balance_wallet
          </span>
          Demander un virement
        </button>
      </div>

      {/* Toast */}
      {showToast && (
        <div className="fixed top-20 left-1/2 z-[100] bg-secondary-container text-on-secondary-container px-6 py-3 rounded-full font-bold text-sm shadow-[0_4px_40px_rgba(25,28,29,0.1)] animate-toast flex items-center gap-2">
          <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
          Demande de virement envoyée
        </div>
      )}

      <BottomNavBar />
    </>
  );
}
