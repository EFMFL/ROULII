'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useNotificationsStore, selectUnreadCount } from '@/stores/notificationsStore';

interface TopAppBarProps {
  title: string;
  showBack?: boolean;
  showBrand?: boolean;
}

export default function TopAppBar({ title, showBack = true, showBrand = true }: TopAppBarProps) {
  const router = useRouter();
  const unreadCount = useNotificationsStore(selectUnreadCount);

  return (
    <header className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-md z-50 glass-header flex items-center justify-between px-6 py-4">
      <div className="flex items-center gap-4">
        {showBack && (
          <button
            onClick={() => router.back()}
            className="active:scale-95 transition-transform"
          >
            <span className="material-symbols-outlined text-primary">arrow_back</span>
          </button>
        )}
        <h1 className="font-headline font-bold text-lg tracking-tight text-primary">{title}</h1>
      </div>
      <div className="flex items-center gap-3">
        <Link href="/" className="relative active:scale-90 transition-transform">
          <span className="material-symbols-outlined text-primary">notifications</span>
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] bg-error text-white text-[8px] font-bold rounded-full flex items-center justify-center px-0.5">
              {unreadCount}
            </span>
          )}
        </Link>
        {showBrand && (
          <span className="font-headline font-extrabold text-primary italic">Roulii</span>
        )}
      </div>
    </header>
  );
}
