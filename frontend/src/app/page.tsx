'use client';
/**
 * ClickLess AI – Landing Page (Pearl + Juniper)
 *
 * Marketing-driven landing page: Header, Hero, ProofStrip,
 * Features, HowItWorks, Security (dark band), CTA, Footer.
 */
import { Box } from '@mantine/core';
import { MarketingHeader } from '@/components/marketing/MarketingHeader';
import { HeroSection } from '@/components/marketing/HeroSection';
import { ProofStrip } from '@/components/marketing/ProofStrip';
import { InteractiveDemoSection } from '@/components/marketing/InteractiveDemoSection';
import { FeatureCardGrid } from '@/components/marketing/FeatureCardGrid';
import { HowItWorksSection } from '@/components/marketing/HowItWorksSection';
import { SecuritySection } from '@/components/marketing/SecuritySection';
import { ClosingCTA } from '@/components/marketing/ClosingCTA';
import { MarketingFooter } from '@/components/marketing/MarketingFooter';

export default function LandingPage() {
  return (
    <Box
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--cl-bg)',
      }}
    >
      <MarketingHeader />
      <main>
        <HeroSection />
        <ProofStrip />
        <InteractiveDemoSection />
        <FeatureCardGrid />
        <HowItWorksSection />
        <SecuritySection />
        <ClosingCTA />
      </main>
      <MarketingFooter />
    </Box>
  );
}
