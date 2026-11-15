import React from 'react';
import { DashboardNav } from '@/components/dashboard/dashboard-nav';
import { Toaster } from '@/components/ui/sonner';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background flex flex-col pb-16 md:pb-6">
      <DashboardNav />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        {children}
      </main>
      <Toaster position="top-right" />
    </div>
  );
}

