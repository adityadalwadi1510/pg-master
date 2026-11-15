'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Grid3X3,
  Receipt,
  MessageSquareWarning,
  Clock,
  Building2,
  ChevronDown,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const NAV_ITEMS = [
  {
    href: '/dashboard/rooms',
    label: 'Room Matrix',
    icon: Grid3X3,
  },
  {
    href: '/dashboard/overview',
    label: 'Overview',
    icon: LayoutDashboard,
  },
  {
    href: '/dashboard/billing',
    label: 'Billing & UPI',
    icon: Receipt,
  },
  {
    href: '/dashboard/complaints',
    label: 'Complaints',
    icon: MessageSquareWarning,
    badge: '2',
  },
  {
    href: '/dashboard/notices',
    label: 'Notice Pipeline',
    icon: Clock,
  },
];

export function DashboardNav() {
  const pathname = usePathname();

  return (
    <>
      {/* Top Header */}
      <header className="sticky top-0 z-30 h-14 border-b border-border bg-background/95 backdrop-blur-xs flex items-center justify-between px-3 sm:px-6">
        <div className="flex items-center gap-2 sm:gap-3">
          <Link href="/dashboard/rooms" className="flex items-center gap-2 font-bold text-base tracking-tight">
            <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-black text-sm">
              PG
            </div>
            <span className="text-sm sm:text-base font-black">PG Master</span>
          </Link>

          <span className="hidden sm:inline-block text-muted-foreground/40 font-light">|</span>

          {/* Property Switcher Pill */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted/60 text-xs font-medium text-foreground cursor-pointer hover:bg-muted transition-colors">
            <Building2 className="w-3.5 h-3.5 text-primary" />
            <span className="truncate max-w-[200px]">GreenNest Men&apos;s PG</span>
            <ChevronDown className="w-3 h-3 text-muted-foreground" />
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <Badge variant="outline" className="text-[10px] sm:text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/40">
            Pilot Active
          </Badge>

          <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs select-none">
            RK
          </div>
        </div>
      </header>

      {/* Desktop Sub-Nav Header */}
      <nav className="hidden md:flex border-b border-border bg-muted/10 px-6 h-11 items-center gap-1">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                isActive
                  ? 'bg-background text-foreground shadow-2xs border border-border/80'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{item.label}</span>
              {item.badge && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 font-bold">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Mobile Bottom Bar (Optimized for thumb tap & safe-areas) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-xs border-t border-border flex items-center justify-around px-1 pt-1.5 pb-[max(env(safe-area-inset-bottom,0px),0.5rem)] shadow-lg">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center flex-1 py-1 min-h-[44px] text-[10px] font-medium transition-colors ${
                isActive ? 'text-primary font-bold' : 'text-muted-foreground active:scale-95'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 mb-0.5 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
                {item.badge && (
                  <span className="absolute -top-1 -right-2 w-3.5 h-3.5 rounded-full bg-amber-500 text-white text-[9px] flex items-center justify-center font-bold">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="leading-tight">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
