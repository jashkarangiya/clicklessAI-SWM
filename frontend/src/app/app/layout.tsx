'use client';
/**
 * ClickLess AI – Authenticated App Layout
 */
import { AppShellLayout } from '@/components/chat/ChatShell';

export default function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  return <AppShellLayout>{children}</AppShellLayout>;
}
