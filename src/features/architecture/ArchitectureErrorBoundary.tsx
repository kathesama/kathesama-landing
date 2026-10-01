import { Component, type ReactNode } from 'react';
import type { Language } from '../i18n/language';
import { ArchitectureFallback } from './ArchitectureFallback';
import type { PublicArchitectureDataset } from './architecture.types';

type ArchitectureErrorBoundaryProps = {
  children: ReactNode;
  dataset: PublicArchitectureDataset;
  language: Language;
  selectedFlowId: string | null;
  onSelectFlow: (flowId: string | null) => void;
};

type ArchitectureErrorBoundaryState = {
  hasError: boolean;
};

export class ArchitectureErrorBoundary extends Component<
  ArchitectureErrorBoundaryProps,
  ArchitectureErrorBoundaryState
> {
  state: ArchitectureErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ArchitectureErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch() {
    // The public fallback intentionally omits exception and implementation details.
  }

  render() {
    if (this.state.hasError) {
      return (
        <ArchitectureFallback
          dataset={this.props.dataset}
          language={this.props.language}
          selectedFlowId={this.props.selectedFlowId}
          onSelectFlow={this.props.onSelectFlow}
          onRetry={() => this.setState({ hasError: false })}
        />
      );
    }

    return this.props.children;
  }
}
