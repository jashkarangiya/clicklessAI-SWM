'use client';
/**
 * ClickLess AI – Authenticated App Layout
 *
 * Route guard: redirects to /login if no valid session token.
 * Uses router.replace() so the auth page is removed from history stack —
 * pressing Back from /app/chat won't return to /login.
 */
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AppShellLayout } from '@/components/chat/ChatShell';
import { useAppSelector } from '@/store/hooks';
import { ClicklessSocketProvider } from '@/providers/ClicklessSocketProvider';

export default function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const token  = useAppSelector((state) => state.session.token);

  useEffect(() => {
    if (!token) {
      router.replace('/login');
    }
  }, [token, router]);

  // Prevent content flash while redirect is pending
  if (!token) return null;

  // ClicklessSocketProvider wraps the whole shell so the WS connection persists
  // across Chat → Settings navigation (badge stays accurate, no reconnect on nav)
  return (
    <ClicklessSocketProvider>
      <AppShellLayout>{children}</AppShellLayout>
    </ClicklessSocketProvider>
  );
}
