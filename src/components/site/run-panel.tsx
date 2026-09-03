// Run panel — the working execution surface for server-context Jonts
// (VOL-07 §3 run panel + VOL-11 §4 dispatch). Client-context Jonts honestly
// state that they run in the browser (engine arrives with their build phase);
// planned Jonts say so — never a stub that pretends.

'use client';

import { useEffect, useState } from 'react';
import { Loader2, PlayCircle, TriangleAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import type { JontRecord } from '@/lib/types';

interface InputSchema {
  type: string;
  properties?: Record<string, { type?: string; description?: string }>;
  required?: string[];
}

interface RunOutcome {
  ok: boolean;
  result?: { data: unknown; warnings: string[]; change_log?: Array<{ at: string; note?: string }>; ms: number };
  usage?: { ms: number; quota_remaining: { daily: number; resets_at: string } };
  error?: { code: string; message: string };
}

function seedArgs(schema: InputSchema | null): string {
  if (!schema?.properties) return '{}';
  const seed: Record<string, unknown> = {};
  for (const [key, prop] of Object.entries(schema.properties)) {
    seed[key] = prop.type === 'array' ? [] : prop.type === 'number' ? 0 : '';
  }
  return JSON.stringify(seed, null, 2);
}

export function RunPanel({ tool }: { tool: JontRecord }) {
  const [status, setStatus] = useState<string | null>(null);
  const [schema, setSchema] = useState<InputSchema | null>(null);
  const [args, setArgs] = useState('{}');
  const [running, setRunning] = useState(false);
  const [outcome, setOutcome] = useState<RunOutcome | null>(null);

  useEffect(() => {
    let cancelled = false;
    setOutcome(null);
    setStatus(null);
    fetch(`/api/jonts/${tool.id}`)
      .then((r) => r.json())
      .then((j) => {
        if (cancelled || !j.ok) return;
        const jont = j.data.jont as { status: string; input_schema: InputSchema | null };
        setStatus(jont.status);
        setSchema(jont.input_schema);
        setArgs(seedArgs(jont.input_schema));
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [tool.id]);

  async function run() {
    setRunning(true);
    setOutcome(null);
    try {
      let parsed: unknown;
      try {
        parsed = JSON.parse(args || '{}');
      } catch {
        setOutcome({ ok: false, error: { code: 'BAD_JSON', message: 'the arguments box is not valid JSON' } });
        return;
      }
      const res = await fetch(`/api/jonts/${tool.id}/run`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ arguments: parsed }),
      });
      const j = (await res.json()) as RunOutcome;
      setOutcome(j);
    } catch {
      setOutcome({ ok: false, error: { code: 'NETWORK', message: 'the request did not reach the server' } });
    } finally {
      setRunning(false);
    }
  }

  if (tool.context === 'client') {
    return (
      <div className="rounded-md border bg-muted/40 p-4 text-sm leading-relaxed text-muted-foreground">
        <p className="font-medium text-foreground">Runs in your browser</p>
        <p className="mt-1.5">
          This tool&apos;s engine will execute on your device — files never leave it. The
          in-browser engine ships with this tool&apos;s build phase; this page is its
          permanent home and will contain the working tool itself.
        </p>
      </div>
    );
  }

  if (status !== 'built') {
    return (
      <div className="rounded-md border bg-muted/40 p-4 text-sm leading-relaxed text-muted-foreground">
        <p className="font-medium text-foreground">Planned — not built yet</p>
        <p className="mt-1.5">
          This tool is in the catalog and its status is honest: the engine has not shipped.
          It appears here exactly when it can run — never as a stub that pretends to work.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium">Run on the server</p>
        {schema?.required && schema.required.length > 0 && (
          <p className="text-xs text-muted-foreground">
            required: <span className="font-mono">{schema.required.join(', ')}</span>
          </p>
        )}
      </div>
      <Textarea
        value={args}
        onChange={(e) => setArgs(e.target.value)}
        rows={8}
        className="font-mono text-xs"
        spellCheck={false}
        aria-label="Tool arguments as JSON"
      />
      <Button size="sm" onClick={run} disabled={running}>
        {running ? (
          <Loader2 className="mr-1.5 h-4 w-4 animate-spin" aria-hidden="true" />
        ) : (
          <PlayCircle className="mr-1.5 h-4 w-4" aria-hidden="true" />
        )}
        Run
      </Button>

      {outcome && (
        <div className="space-y-2">
          {outcome.ok && outcome.result ? (
            <>
              {outcome.result.warnings.length > 0 && (
                <div className="rounded-md border p-3 text-xs leading-relaxed text-muted-foreground">
                  {outcome.result.warnings.map((w, i) => (
                    <p key={i} className="flex items-start gap-1.5">
                      <TriangleAlert className="mt-0.5 h-3 w-3 shrink-0" aria-hidden="true" />
                      {w}
                    </p>
                  ))}
                </div>
              )}
              <pre className="max-h-96 overflow-auto rounded-md border bg-muted/40 p-3 font-mono text-xs leading-relaxed">
                {JSON.stringify(outcome.result.data, null, 2)}
              </pre>
              {outcome.result.change_log && outcome.result.change_log.length > 0 && (
                <details className="text-xs text-muted-foreground">
                  <summary className="cursor-pointer select-none">Change log ({outcome.result.change_log.length})</summary>
                  <ul className="mt-1.5 space-y-1">
                    {outcome.result.change_log.map((c, i) => (
                      <li key={i}>
                        <span className="font-mono">{c.at}</span>
                        {c.note ? ` — ${c.note}` : ''}
                      </li>
                    ))}
                  </ul>
                </details>
              )}
              {outcome.usage && (
                <p className="text-xs text-muted-foreground">
                  {outcome.usage.ms} ms · {outcome.usage.quota_remaining.daily} server calls left today
                  (resets {new Date(outcome.usage.quota_remaining.resets_at).toUTCString().slice(0, 22)} UTC)
                </p>
              )}
            </>
          ) : (
            <div className="rounded-md border p-3 text-xs leading-relaxed">
              <p className="font-medium">{outcome.error?.code}</p>
              <p className="mt-1 text-muted-foreground">{outcome.error?.message}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
