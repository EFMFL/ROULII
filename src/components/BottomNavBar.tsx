'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useNotificationsStore, selectUnreadCount } from '@/stores/notificationsStore';

const navItems = [
  { href: '/', icon: 'home', label: 'Accueil' },
  { href: '/recherche', icon: 'search', label: 'Recherche' },
  { href: '/mes-trajets', icon: 'directions_car', label: 'Trajets' },
  { href: '/messagerie', icon: 'chat_bubble', label: 'Messages' },
  { href: '/profil', icon: 'person', label: 'Profil' },
];

export default function BottomNavBar() {
  const pathname = usePathname();
  const unreadCount = useNotificationsStore(selectUnreadCount);

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    if (href === '/mes-trajets') return pathname.startsWith('/mes-trajets') || pathname.startsWith('/trajet') || pathname.startsWith('/annulation') || pathname.startsWith('/creer-trajet');
    if (href === '/messagerie') return pathname.startsWith('/messagerie') || pathname.startsWith('/appel');
    if (href === '/recherche') return pathname.startsWith('/recherche');
    return pathname.startsWith(href);
  };

  return (
    <nav aria-label="Navigation principale" className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-50 flex justify-around items-center px-4 pb-6 pt-3 pb-safe glass-bar rounded-t-3xl shadow-[0_-4px_40px_rgba(25,28,29,0.04)]">
      {navItems.map((item) => {
        const active = isActive(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`relative flex flex-col items-center justify-center px-4 py-2 active:scale-90 transition-all duration-300 ease-out ${
              active
                ? 'bg-primary-container text-white rounded-2xl'
                : 'text-slate-400 hover:text-primary-container'
            }`}
          >
            <span
              className="material-symbols-outlined mb-1"
              style={active ? { fontVariationSettings: "'FILL' 1" } : undefined}
            >
              {item.icon}
            </span>
            {item.href === '/messagerie' && unreadCount > 0 && (
              <span className="absolute -top-0.5 right-1 min-w-[18px] h-[18px] bg-error text-white text-[9px] font-bold rounded-full flex items-center justify-center px-1">
                {unreadCount}
              </span>
            )}
            <span className="font-headline text-[10px] uppercase tracking-widest font-semibold">
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
