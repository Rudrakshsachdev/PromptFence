import { Metadata } from 'next';
import { LandingNavbar } from '@/components/landing/landing-navbar';
import { LandingHero } from '@/components/landing/landing-hero';
import { ProductPreview } from '@/components/landing/product-preview';
import { FeaturesSection } from '@/components/landing/features-section';
import { WorkflowSection } from '@/components/landing/workflow-section';
import { ResearchSection } from '@/components/landing/research-section';
import { LandingCta } from '@/components/landing/landing-cta';
import { LandingFooter } from '@/components/landing/landing-footer';

export const metadata: Metadata = {
  title: 'PromptFence — AI Application Security Testing Lab',
  description:
    'Vercel-inspired security testing platform for AI applications. Dynamic session-bound canary tainting, adversarial evaluation, and provenance tracing.',
};

export default function RootLandingPage() {
  return (
    <div className="min-h-screen bg-white text-neutral-900 selection:bg-neutral-900 selection:text-white font-sans antialiased">
      <LandingNavbar />
      <main>
        <LandingHero />
        <ProductPreview />
        <FeaturesSection />
        <WorkflowSection />
        <ResearchSection />
        <LandingCta />
      </main>
      <LandingFooter />
    </div>
  );
}
