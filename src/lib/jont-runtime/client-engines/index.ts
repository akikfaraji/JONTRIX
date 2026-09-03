// Client engine registry — Jonts whose engines run IN THE USER'S BROWSER
// (VOL-11 §2/§4: server dispatch refuses client-context Jonts, T11.5; the
// browser is their only execution surface and files never leave the device).
//
// Conventions every client engine follows:
//   data.output    — the primary string artifact (csv / json / sql / srt / ts)
//   data.filename  — suggested download name for that artifact
//   data.parts     — multi-artifact tools instead ship [{ filename, content, rows? }]
//   warnings       — honest notes; change_log records every rewrite made
// Everything is deterministic (C5): no AI, no network, no quota.

import type { JontEngine } from '../types';
import { CLIENT_CONVERTER_ENGINES } from './converters';
import { CLIENT_VALIDATOR_ENGINES } from './validators';
import { CLIENT_FIXER_ENGINES } from './fixers';

const ALL_CLIENT_ENGINES: JontEngine[] = [
  ...CLIENT_CONVERTER_ENGINES,
  ...CLIENT_VALIDATOR_ENGINES,
  ...CLIENT_FIXER_ENGINES,
];

const registry = new Map<string, JontEngine>();
for (const engine of ALL_CLIENT_ENGINES) {
  if (registry.has(engine.manifest.id)) {
    throw new Error(`duplicate client engine id in registry: ${engine.manifest.id}`);
  }
  registry.set(engine.manifest.id, engine);
}

/** Browser-side lookup for the run panel; never used by server dispatch. */
export function getClientEngine(id: string): JontEngine | null {
  return registry.get(id) ?? null;
}

export function getBuiltClientJontIds(): string[] {
  return [...registry.keys()];
}

export const CLIENT_BUILT_JONT_IDS = getBuiltClientJontIds();
