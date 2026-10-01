import type { ChangeEvent } from 'react';
import type { Language } from '../i18n/language';
import type {
  ArchitectureLensId,
  PublicArchitectureLens,
} from './architecture.types';

type LensSelectorProps = {
  language: Language;
  lenses: PublicArchitectureLens[];
  selectedLensId: ArchitectureLensId;
  onSelectLens: (lensId: ArchitectureLensId) => void;
};

const copy = {
  en: {
    eyebrow: 'READING MODE · 01—09',
    label: 'Architecture lens',
  },
  es: {
    eyebrow: 'MODO DE LECTURA · 01—09',
    label: 'Lente de arquitectura',
  },
} as const;

export function LensSelector({
  language,
  lenses,
  selectedLensId,
  onSelectLens,
}: LensSelectorProps) {
  const text = copy[language];

  const selectLens = (event: ChangeEvent<HTMLSelectElement>) => {
    const lens = lenses.find(({ id }) => id === event.target.value);
    if (lens) onSelectLens(lens.id);
  };

  return (
    <div className="architecture-lens-selector">
      <p>{text.eyebrow}</p>
      <label htmlFor="architecture-lens-select">{text.label}</label>
      <select
        id="architecture-lens-select"
        aria-controls="architecture-lens-panel"
        value={selectedLensId}
        onChange={selectLens}
      >
        {lenses.map((lens) => (
          <option key={lens.id} value={lens.id}>
            {lens.title[language]}
          </option>
        ))}
      </select>
    </div>
  );
}
