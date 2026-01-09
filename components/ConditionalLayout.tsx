'use client';

import { Navbar } from './web/navbar';
import { Footer } from './web/footer';
import { usePathname } from 'next/navigation';

interface ConditionalLayoutProps {
  children: React.ReactNode;
}

export default function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const pathname = usePathname();
  const isAuthPage = pathname.startsWith('/auth');

  return (
    <div className="min-h-screen flex flex-col">
      {!isAuthPage && <Navbar />}
      <main className="flex-1">
        {children}
      </main>
      {!isAuthPage && <Footer />}
    </div>
  );
}
