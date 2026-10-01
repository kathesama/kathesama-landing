import { useCallback, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { publicArchitecture } from '../../content/architecture';
import type { Language } from '../i18n/language';
import { ArchitectureCanvas } from './ArchitectureCanvas';
import { ArchitectureErrorBoundary } from './ArchitectureErrorBoundary';
import { ArchitectureLegend } from './ArchitectureLegend';
import { ArchitectureToolbar } from './ArchitectureToolbar';
import { FlowPanel } from './FlowPanel';
import { LensPanel } from './LensPanel';
import { LensSelector } from './LensSelector';
import { architectureCopy } from './architectureCopy';
import { createArchitectureGraph } from './architectureGraph';
import { useReducedMotion } from './useReducedMotion';
import type { ArchitectureLensId } from './architecture.types';

type ArchitectureExplorerProps = {
  language: Language;
};

function resolveLens(lensId: string | null) {
  const defaultLens = publicArchitecture.lenses.find(({ id }) => id === 'layers');
  if (!defaultLens) {
    throw new Error('The validated public architecture is missing its default lens.');
  }

  return (
    publicArchitecture.lenses.find(({ id }) => id === lensId) ?? defaultLens
  );
}

function lensRequiresTelemetry(lens: ReturnType<typeof resolveLens>) {
  const telemetryEdgeIds = new Set(
    publicArchitecture.edges
      .filter(({ type }) => type === 'telemetry')
      .map(({ id }) => id),
  );

  return (
    lens.nodeIds.includes('observability') ||
    lens.edgeIds.some((edgeId) => telemetryEdgeIds.has(edgeId))
  );
}

export function ArchitectureExplorer({ language }: ArchitectureExplorerProps) {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const selectedLens = resolveLens(searchParams.get('lens'));
  const [selectedFlowId, setSelectedFlowId] = useState<string | null>(null);
  const [telemetryOverrides, setTelemetryOverrides] = useState<
    Partial<Record<ArchitectureLensId, boolean>>
  >({});
  const [showContracts, setShowContracts] = useState(false);
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle');
  const reducedMotion = useReducedMotion();
  const fitRequest = useRef<() => void>(() => undefined);
  const copy = architectureCopy[language];
  const showTelemetry =
    telemetryOverrides[selectedLens.id] ?? lensRequiresTelemetry(selectedLens);
  const graph = useMemo(
    () =>
      createArchitectureGraph(publicArchitecture, {
        language,
        selectedFlowId,
        selectedLensId: selectedLens.id,
        showTelemetry,
        showContracts,
        reducedMotion,
      }),
    [language, reducedMotion, selectedFlowId, selectedLens.id, showContracts, showTelemetry],
  );
  const registerFitRequest = useCallback((fit: () => void) => {
    fitRequest.current = fit;
  }, []);

  const selectFlow = (flowId: string | null) => {
    setSelectedFlowId((current) => (flowId === null || current === flowId ? null : flowId));
  };

  const selectLens = (lensId: ArchitectureLensId) => {
    const next = new URLSearchParams(searchParams);
    next.set('lens', lensId);
    void navigate(
      {
        pathname: location.pathname,
        search: `?${next.toString()}`,
        hash: location.hash,
      },
      { replace: false },
    );
  };

  const copyJson = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(publicArchitecture, null, 2));
      setCopyState('copied');
    } catch {
      setCopyState('failed');
    }
  };

  const selectedFlow = publicArchitecture.flows.find(({ id }) => id === selectedFlowId);

  return (
    <div className="architecture-explorer">
      <ArchitectureToolbar
        language={language}
        hasSelection={selectedFlowId !== null}
        showContracts={showContracts}
        showTelemetry={showTelemetry}
        copyState={copyState}
        onClear={() => setSelectedFlowId(null)}
        onFit={() => fitRequest.current()}
        onToggleContracts={() => setShowContracts((current) => !current)}
        onToggleTelemetry={() =>
          setTelemetryOverrides((current) => ({
            ...current,
            [selectedLens.id]: !showTelemetry,
          }))
        }
        onCopy={() => void copyJson()}
      />
      <div className="architecture-explorer__body">
        <div className="architecture-explorer__lens-selector">
          <LensSelector
            language={language}
            lenses={publicArchitecture.lenses}
            selectedLensId={selectedLens.id}
            onSelectLens={selectLens}
          />
        </div>
        <LensPanel
          language={language}
          lens={selectedLens}
          flows={publicArchitecture.flows}
          onSelectFlow={(flowId) => selectFlow(flowId)}
        />
        <div className="architecture-explorer__map-column">
          <ArchitectureErrorBoundary
            dataset={publicArchitecture}
            language={language}
            selectedFlowId={selectedFlowId}
            onSelectFlow={selectFlow}
          >
            <ArchitectureCanvas
              nodes={graph.nodes}
              edges={graph.edges}
              language={language}
              reducedMotion={reducedMotion}
              onFitReady={registerFitRequest}
              onClearSelection={() => setSelectedFlowId(null)}
            />
          </ArchitectureErrorBoundary>
          <p className="architecture-selection-live" aria-live="polite">
            {selectedFlow
              ? copy.selectionAnnouncement(
                  selectedFlow.title[language],
                  selectedFlow.steps.length,
                )
              : copy.noSelectionAnnouncement}
          </p>
          <ArchitectureLegend language={language} />
        </div>
        <FlowPanel
          language={language}
          flows={publicArchitecture.flows}
          nodes={publicArchitecture.nodes}
          selectedFlowId={selectedFlowId}
          onSelectFlow={selectFlow}
          highlightedFlowIds={new Set(selectedLens.flowIds)}
        />
      </div>
    </div>
  );
}
