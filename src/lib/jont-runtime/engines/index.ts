// Engine registry — the single map of built Jonts (VOL-11 §2: the manifest
// is the source; the registry row is the projection). `BUILT_JONT_IDS`
// feeds the seed so `status='built'` in the DB never disagrees with code.

import type { JontEngine } from '../types';
import { FIXER_ENGINES } from './fixers';
import { VALIDATOR_ENGINES } from './validators';
import { GENERATOR_ENGINES } from './generators';
import { CONVERTER_ENGINES } from './converters';

const ALL_ENGINES: JontEngine[] = [...FIXER_ENGINES, ...VALIDATOR_ENGINES, ...GENERATOR_ENGINES, ...CONVERTER_ENGINES];

const registry = new Map<string, JontEngine>();
for (const engine of ALL_ENGINES) {
  if (registry.has(engine.manifest.id)) {
    throw new Error(`duplicate engine id in registry: ${engine.manifest.id}`);
  }
  registry.set(engine.manifest.id, engine);
}

/** Server-side dispatch must refuse client-context Jonts (VOL-11 §4, T11.5). */
export function getServerEngine(id: string): JontEngine | null {
  const engine = registry.get(id);
  if (!engine) return null;
  if (engine.manifest.context === 'client') return null;
  return engine;
}

export function getBuiltJontIds(): string[] {
  return [...registry.keys()];
}

export const BUILT_JONT_IDS = getBuiltJontIds();
