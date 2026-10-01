/// <reference types="vite/client" />

import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { axe } from 'vitest-axe';
import { App } from '../App';
import globalStyles from '../styles/global.css?raw';

function renderLanding(language: 'en' | 'es') {
  return render(
    <MemoryRouter initialEntries={[`/?lang=${language}`]}>
      <App />
    </MemoryRouter>,
  );
}

describe('LandingPage', () => {
  it('preserves the original CTA cross-axis composition', () => {
    const heroCtaRule = globalStyles.match(/\.hero-cta\s*\{([^}]*)\}/)?.[1];

    expect(heroCtaRule).toBeDefined();
    expect(heroCtaRule).not.toMatch(/align-self\s*:/);
  });

  it('provides a narrower title scale for 320px viewports', () => {
    expect(globalStyles).toMatch(
      /@media\s*\(max-width:\s*360px\)[\s\S]*?\.hero-title\s*\{[^}]*font-size:\s*clamp\(2\.2rem,\s*12vw,\s*2\.8rem\)/,
    );
  });

  it('allows the builder columns to shrink without narrow-screen overflow', () => {
    expect(globalStyles).toMatch(
      /\.about-text\s*,\s*\.about-links\s*\{[^}]*min-width:\s*0;/,
    );
  });

  it('preserves the current English portfolio copy and structure', () => {
    renderLanding('en');

    expect(
      screen.getByRole('heading', { name: /Meet JuanaIA/i }),
    ).toBeVisible();
    expect(
      screen.getByText(
        'A fully self-hosted personal AI assistant — no cloud, no API keys, no data leakage. Running entirely on local hardware with production-grade architecture.',
      ),
    ).toBeVisible();
    expect(
      screen.getByRole('heading', { name: 'What is JuanaIA?' }),
    ).toBeVisible();
    expect(
      screen.getByRole('heading', { name: 'Katherine E. Aguirre' }),
    ).toBeVisible();
    expect(screen.getByText('Qwen3-Omni 30B')).toBeVisible();
    const techGrid = document.querySelector('.tech-grid');
    expect(techGrid).not.toBeNull();
    expect(within(techGrid as HTMLElement).getAllByRole('article')).toHaveLength(6);
    expect(
      within(screen.getByRole('list', { name: 'Technology stack' })).getAllByRole('listitem'),
    ).toHaveLength(12);

    const about = document.querySelector('#about');
    expect(about).not.toBeNull();
    expect(within(about as HTMLElement).getAllByRole('link')).toHaveLength(3);
  });

  it('renders the complete current Spanish copy', () => {
    renderLanding('es');

    expect(
      screen.getByRole('heading', { name: /Conoce a JuanaIA/i }),
    ).toBeVisible();
    expect(
      screen.getByText(
        'Un asistente de IA personal completamente auto-alojado — sin nube, sin API keys, sin filtración de datos. Corriendo íntegramente en hardware local con arquitectura de nivel productivo.',
      ),
    ).toBeVisible();
    expect(
      screen.getByRole('heading', { name: '¿Qué es JuanaIA?' }),
    ).toBeVisible();
    expect(screen.getByText('Semántica + Episódica')).toBeVisible();
    expect(screen.getByText('Planificador Autónomo')).toBeVisible();
    expect(screen.getByText('Próximamente R4–R5')).toBeVisible();
    expect(screen.getByText('Encuéntrame en')).toBeVisible();
  });

  it('keeps landing content visible without IntersectionObserver callbacks', () => {
    renderLanding('en');

    expect(screen.getByRole('heading', { name: 'What is JuanaIA?' })).toBeVisible();
    expect(screen.getByRole('heading', { name: 'Katherine E. Aguirre' })).toBeVisible();
  });

  it('places the architecture field note after the project and before the builder', () => {
    renderLanding('en');

    const project = screen.getByRole('region', { name: 'What is JuanaIA?' });
    const preview = screen.getByTestId('architecture-preview');
    const builder = screen.getByRole('region', { name: 'The Builder' });

    expect(project.compareDocumentPosition(preview)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
    expect(preview.compareDocumentPosition(builder)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
  });

  it('places the writing field notes after architecture and before the builder', () => {
    renderLanding('en');

    const architecture = screen.getByTestId('architecture-preview');
    const writing = screen.getByTestId('featured-writing');
    const builder = screen.getByRole('region', { name: 'The Builder' });

    expect(architecture.compareDocumentPosition(writing)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
    expect(writing.compareDocumentPosition(builder)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
  });

  it('has no automatically detectable accessibility violations', async () => {
    const { container } = renderLanding('en');
    expect(
      screen.getByRole('region', { name: 'The Builder' }),
    ).toHaveAttribute('id', 'about');
    const results = await axe(container);

    expect(results.violations).toHaveLength(0);
  });
});
