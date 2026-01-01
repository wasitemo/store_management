'use client';

import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';
import Sidebar from './components/Sidebar';

export default function RootLayoutClient({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/login';

  if (isLoginPage) {
    return (
      <main className="min-h-screen bg-background text-text-primary font-sans antialiased">
        {children}
      </main>
    );
  }

  return (
    <main className="flex min-h-screen bg-background text-text-primary font-sans antialiased">
      <Sidebar />
      <div className="flex-1 p-container-padding transition-all duration-300">
        {children}
      </div>
    </main>
  );
}