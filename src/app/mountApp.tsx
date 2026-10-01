import { StrictMode } from 'react';
import { createRoot, hydrateRoot, type Root } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { App } from '../App';
import type { AppRouteOverrides } from './routes';
import { getHydrationRouteOverrides, preloadAppRoute } from './routeLoaders';

function application(initialLanguage?: 'en', routeOverrides?: AppRouteOverrides) {
  return (
    <StrictMode>
      <BrowserRouter>
        <App initialLanguage={initialLanguage} routeOverrides={routeOverrides} />
      </BrowserRouter>
    </StrictMode>
  );
}

type HydrationOptions = Parameters<typeof hydrateRoot>[2];

export async function mountApp(root: HTMLElement, options?: HydrationOptions): Promise<Root> {
  if (root.hasChildNodes()) {
    await preloadAppRoute(window.location.href);
    return hydrateRoot(root, application('en', getHydrationRouteOverrides()), options);
  }

  const clientRoot = createRoot(root);
  clientRoot.render(application());
  return clientRoot;
}
