'use client';
/**
 * ClickLess AI – App Providers
 *
 * Wraps the entire app with:
 * - MantineProvider (theme + color scheme)
 * - Notifications
 * - ModalsProvider
 */
import React from 'react';
import { MantineProvider, ColorSchemeScript } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { ModalsProvider } from '@mantine/modals';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { mantineTheme } from '@/theme/mantineTheme';

// Import Mantine core CSS
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';

interface AppProvidersProps {
  children: React.ReactNode;
}

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || 'placeholder-google-client-id';

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <MantineProvider theme={mantineTheme} defaultColorScheme="dark">
        <Notifications position="top-right" zIndex={9999} />
        <ModalsProvider>
          {children}
        </ModalsProvider>
      </MantineProvider>
    </GoogleOAuthProvider>
  );
}

// Re-export ColorSchemeScript for root layout use (prevents flicker)
export { ColorSchemeScript };
