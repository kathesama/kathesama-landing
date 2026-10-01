import { useRef } from 'react';
import { Outlet } from 'react-router-dom';
import { AnimatedGrid } from './AnimatedGrid';
import { NavigationManager } from './NavigationManager';
import { SiteFooter } from './SiteFooter';
import { SiteNav } from './SiteNav';
import { SkipLink } from './SkipLink';

export function AppShell() {
  const mainRef = useRef<HTMLElement>(null);

  return (
    <>
      <NavigationManager mainRef={mainRef} />
      <SkipLink />
      <AnimatedGrid />
      <SiteNav />
      <main id="main-content" ref={mainRef} tabIndex={-1}>
        <Outlet />
      </main>
      <SiteFooter />
    </>
  );
}
