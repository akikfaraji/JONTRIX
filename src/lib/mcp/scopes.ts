// Scope engine — VOL-10 §2 scope contract (LOCKED).
// tools: 'all' | { allow?: string[]; deny?: string[] }
// max_calls_per_day: AAT-level clamp, validated ≤ tier limits at creation.

export interface TokenScopes {
  tools?: 'all' | { allow?: string[]; deny?: string[] };
  max_calls_per_day?: number;
}

export function toolAllowed(scopes: Record<string, unknown>, toolId: string): boolean {
  const tools = (scopes as TokenScopes).tools;
  if (tools === undefined || tools === 'all') return true;
  if (typeof tools !== 'object' || tools === null) return true;
  const spec = tools as { allow?: string[]; deny?: string[] };
  if (spec.deny?.includes(toolId)) return false;
  if (spec.allow) return spec.allow.includes(toolId);
  return true;
}

export function aatDailyClamp(scopes: Record<string, unknown>): number | null {
  const clamp = (scopes as TokenScopes).max_calls_per_day;
  return typeof clamp === 'number' && clamp > 0 ? Math.floor(clamp) : null;
}

/** Human-readable scope line for the session pair response (§4.3). */
export function scopeString(scopes: Record<string, unknown>): string {
  const tools = (scopes as TokenScopes).tools;
  const clamp = aatDailyClamp(scopes);
  const parts: string[] = [];
  if (tools === undefined || tools === 'all') parts.push('tools:all');
  else if (typeof tools === 'object' && tools !== null) {
    if (tools.allow) parts.push(`tools:allow:${tools.allow.join('|')}`);
    if (tools.deny) parts.push(`tools:deny:${tools.deny.join('|')}`);
  }
  if (clamp) parts.push(`clamp:${clamp}/day`);
  return parts.join(' ') || 'mcp';
}
