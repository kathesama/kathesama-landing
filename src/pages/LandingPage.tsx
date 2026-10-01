import { BuilderSection } from '../features/landing/BuilderSection';
import { ArchitecturePreview } from '../features/landing/ArchitecturePreview';
import { HeroSection } from '../features/landing/HeroSection';
import { ProjectOverview } from '../features/landing/ProjectOverview';
import { FeaturedWriting } from '../features/blog/FeaturedWriting';

export function LandingPage() {
  return (
    <>
      <HeroSection />
      <ProjectOverview />
      <ArchitecturePreview />
      <FeaturedWriting />
      <BuilderSection />
    </>
  );
}
