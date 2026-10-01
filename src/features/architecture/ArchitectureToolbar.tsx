import type { Language } from '../i18n/language';
import { architectureCopy } from './architectureCopy';

type ArchitectureToolbarProps = {
  language: Language;
  hasSelection: boolean;
  showContracts: boolean;
  showTelemetry: boolean;
  copyState: 'idle' | 'copied' | 'failed';
  onClear: () => void;
  onFit: () => void;
  onToggleContracts: () => void;
  onToggleTelemetry: () => void;
  onCopy: () => void;
};

export function ArchitectureToolbar({
  language,
  hasSelection,
  showContracts,
  showTelemetry,
  copyState,
  onClear,
  onFit,
  onToggleContracts,
  onToggleTelemetry,
  onCopy,
}: ArchitectureToolbarProps) {
  const copy = architectureCopy[language];
  const copyMessage = copyState === 'idle' ? '' : copy.copyStatus[copyState];

  return (
    <div className="architecture-toolbar" aria-label={copy.toolbarLabel} role="region">
      <button type="button" disabled={!hasSelection} onClick={onClear}>
        {copy.controls.clear}
      </button>
      <button type="button" onClick={onFit}>
        {copy.controls.fit}
      </button>
      <button type="button" aria-pressed={showContracts} onClick={onToggleContracts}>
        {copy.controls.contracts}
      </button>
      <button type="button" aria-pressed={showTelemetry} onClick={onToggleTelemetry}>
        {copy.controls.observability}
      </button>
      <button type="button" onClick={onCopy}>
        {copy.controls.copyJson}
      </button>
      <a href="/architecture.public.json" download>
        {copy.controls.downloadJson}
      </a>
      <span className="architecture-live-region" aria-live="polite" role="status">
        {copyMessage}
      </span>
    </div>
  );
}
