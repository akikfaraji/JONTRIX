// Jont runtime types — VOL-11 §2/§3 (LOCKED shapes).
// Every Jont's core transformation is deterministic (C5); AI is a capped
// fallback declared in the manifest, never a silent quality drop.

export type JontPattern = 'converter' | 'validator' | 'generator' | 'extractor' | 'fixer';

/** Uniform result envelope for every pattern — VOL-11 §3 MUST. */
export interface JontResult {
  data: unknown;
  warnings: string[];
  change_log?: Array<{ at: string; from?: string; to?: string; note?: string }>;
  ms: number;
}

export interface JsonSchema {
  type: 'object' | 'string' | 'number' | 'boolean' | 'array';
  properties?: Record<string, JsonSchema>;
  required?: string[];
  items?: JsonSchema;
  enum?: Array<string | number>;
  minLength?: number;
  maxLength?: number;
  minimum?: number;
  maximum?: number;
  description?: string;
  additionalProperties?: boolean;
  /** Standard JSON Schema annotation; the run panel renders `textarea` for long text. */
  format?: string;
}

/**
 * Build-time manifest (VOL-11 §2). In this build environment the manifest is
 * the source of truth living beside the engine; the `jonts` registry row is
 * its projection (status, display fields). Never the other way around.
 */
export interface JontManifest {
  id: string; // jont_j007_json-repair
  pattern: JontPattern;
  context: 'client' | 'server' | 'hybrid';
  io: {
    input: JsonSchema;
    output: JsonSchema;
    preview_rows?: number;
  };
  tier_fit: 'FREE' | 'PRO' | 'MAX';
  mcp_exposed: boolean;
  ai_steps?: string[]; // fuzzy steps only; deterministic path declared first
  evidence: { problem_row: string; score: number };
}

export interface JontEngine {
  manifest: JontManifest;
  run: (input: Record<string, unknown>, options: Record<string, unknown>) => Promise<JontResult> | JontResult;
}
