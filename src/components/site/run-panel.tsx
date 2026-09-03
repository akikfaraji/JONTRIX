// Run panel — the working execution surface for Jonts (VOL-07 §3 + VOL-11 §4).
// Server Jonts POST to the run route (quota-metered). Client Jonts execute
// IN THIS BROWSER through the client-engine registry — nothing is uploaded
// and no quota is consumed. Planned Jonts say so — never a stub that pretends.
// Arguments are collected through a form generated from the tool's input
// schema; a raw JSON mode stays available for power users and MCP parity.

'use client';

import { useEffect, useState } from 'react';
import { Check, Copy, Download, Loader2, PlayCircle, TriangleAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { getClientEngine } from '@/lib/jont-runtime/client-engines';
import type { JontRecord } from '@/lib/types';

interface PropSchema {
  type?: string;
  description?: string;
  enum?: Array<string | number>;
  format?: string;
  minimum?: number;
  maximum?: number;
}

interface InputSchema {
  type: string;
  properties?: Record<string, PropSchema>;
  required?: string[];
}

interface RunOutcome {
  ok: boolean;
  result?: {
    data: unknown;
    warnings: string[];
    change_log?: Array<{ at: string; note?: string }>;
    ms: number;
  };
  usage?: { ms: number; quota_remaining: { daily: number; resets_at: string } };
  error?: { code: string; message: string };
}

const LONG_TEXT_HINT = /csv|json|sql|srt|text|paste|content|paragraph/i;

function seedFromSchema(schema: InputSchema | null): Record<string, unknown> {
  const seed: Record<string, unknown> = {};
  if (!schema?.properties) return seed;
  for (const [key, prop] of Object.entries(schema.properties)) {
    if (prop.enum && prop.enum.length > 0) seed[key] = String(prop.enum[0]);
    else if (prop.type === 'number') seed[key] = prop.minimum ?? 0;
    else if (prop.type === 'boolean') seed[key] = true;
    else seed[key] = '';
  }
  return seed;
}

export function RunPanel({ tool }: { tool: JontRecord }) {
  const clientEngine = getClientEngine(tool.id);
  const [status, setStatus] = useState<string | null>(null);
  const [schema, setSchema] = useState<InputSchema | null>(null);
  const [fields, setFields] = useState<Record<string, unknown>>({});
  const [mode, setMode] = useState<'form' | 'json'>('form');
  const [raw, setRaw] = useState('{}');
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
        const seeded = seedFromSchema(jont.input_schema);
        setFields(seeded);
        setRaw(JSON.stringify(seeded, null, 2));
        setMode('form');
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [tool.id]);

  function collectArgs(): { args?: Record<string, unknown>; error?: string } {
    if (mode === 'json') {
      try {
        const parsed = JSON.parse(raw || '{}') as Record<string, unknown>;
        return { args: parsed };
      } catch {
        return { error: 'the raw JSON box is not valid JSON' };
      }
    }
    return { args: fields };
  }

  async function runLocal() {
    setRunning(true);
    setOutcome(null);
    try {
      const { args, error } = collectArgs();
      if (error || !args) {
        setOutcome({ ok: false, error: { code: 'BAD_JSON', message: error ?? 'invalid arguments' } });
        return;
      }
      const result = await (clientEngine as NonNullable<typeof clientEngine>).run(args, {});
      setOutcome({ ok: true, result });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      const sep = message.indexOf('|');
      setOutcome({
        ok: false,
        error: { code: sep > 0 ? message.slice(0, sep) : 'RUN_FAILED', message: sep > 0 ? message.slice(sep + 1) : message },
      });
    } finally {
      setRunning(false);
    }
  }

  async function runServer() {
    setRunning(true);
    setOutcome(null);
    try {
      const { args, error } = collectArgs();
      if (error || !args) {
        setOutcome({ ok: false, error: { code: 'BAD_JSON', message: error ?? 'invalid arguments' } });
        return;
      }
      const res = await fetch(`/api/jonts/${tool.id}/run`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ arguments: args }),
      });
      const j = (await res.json()) as RunOutcome;
      setOutcome(j);
    } catch {
      setOutcome({ ok: false, error: { code: 'NETWORK', message: 'the request did not reach the server' } });
    } finally {
      setRunning(false);
    }
  }

  /* ---------------- honest placeholders ---------------- */

  if (tool.context === 'client' && !clientEngine) {
    return (
      <div className="rounded-md border bg-muted/40 p-4 text-sm leading-relaxed text-muted-foreground">
        <p className="font-medium text-foreground">Runs in your browser — engine not shipped yet</p>
        <p className="mt-1.5">
          This tool&apos;s engine will execute on your device — files never leave it. The
          in-browser engine ships with this tool&apos;s build phase; this page is its
          permanent home and will contain the working tool itself, never a pretend stub.
        </p>
      </div>
    );
  }

  if (tool.context !== 'client' && status !== null && status !== 'built') {
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

  const isClient = tool.context === 'client';
  const props = schema?.properties ?? {};
  const required = new Set(schema?.required ?? []);
  const hasForm = Object.keys(props).length > 0;

  /* ---------------- shared blocks ---------------- */

  function FieldRow({ name, prop }: { name: string; prop: PropSchema }) {
    const label = (
      <span className="text-xs font-medium">
        {name}
        {required.has(name) && <span className="ml-0.5 text-destructive">*</span>}
      </span>
    );
    const desc = prop.description ? <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">{prop.description}</p> : null;

    if (prop.enum && prop.enum.length > 0) {
      return (
        <div className="space-y-1">
          {label}
          <Select
            value={String(fields[name] ?? prop.enum[0])}
            onValueChange={(v) => setFields((f) => ({ ...f, [name]: v }))}
          >
            <SelectTrigger size="sm" className="w-full max-w-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {prop.enum.map((opt) => (
                <SelectItem key={String(opt)} value={String(opt)}>
                  {String(opt)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {desc}
        </div>
      );
    }

    if (prop.type === 'boolean') {
      return (
        <div className="flex items-start gap-2">
          <Switch
            checked={fields[name] === true}
            onCheckedChange={(v) => setFields((f) => ({ ...f, [name]: v }))}
            aria-label={name}
          />
          <div>
            {label}
            {desc}
          </div>
        </div>
      );
    }

    if (prop.type === 'number') {
      return (
        <div className="space-y-1">
          {label}
          <Input
            type="number"
            value={fields[name] === undefined || fields[name] === null ? '' : String(fields[name])}
            onChange={(e) => setFields((f) => ({ ...f, [name]: e.target.value === '' ? '' : Number(e.target.value) }))}
            className="max-w-xs"
          />
          {desc}
        </div>
      );
    }

    const isLong = prop.format === 'textarea' || LONG_TEXT_HINT.test(prop.description ?? '') || LONG_TEXT_HINT.test(name);
    return (
      <div className="space-y-1">
        {label}
        {isLong ? (
          <Textarea
            value={String(fields[name] ?? '')}
            onChange={(e) => setFields((f) => ({ ...f, [name]: e.target.value }))}
            rows={9}
            className="font-mono text-xs"
            spellCheck={false}
            aria-label={name}
          />
        ) : (
          <Input
            value={String(fields[name] ?? '')}
            onChange={(e) => setFields((f) => ({ ...f, [name]: e.target.value }))}
            className="max-w-xl"
            aria-label={name}
          />
        )}
        {desc}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium">{isClient ? 'Run in your browser' : 'Run on the server'}</p>
        {hasForm && (
          <div className="flex gap-1" role="group" aria-label="Input mode">
            <Button size="sm" variant={mode === 'form' ? 'secondary' : 'ghost'} onClick={() => setMode('form')}>
              Form
            </Button>
            <Button size="sm" variant={mode === 'json' ? 'secondary' : 'ghost'} onClick={() => setMode('json')}>
              Raw JSON
            </Button>
          </div>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        {isClient
          ? 'Executed entirely on this device — nothing is uploaded, no quota is used.'
          : 'Executed on the server and uses 1 call of your daily quota.'}
      </p>

      {mode === 'form' && hasForm ? (
        <div className="space-y-4 rounded-md border bg-muted/20 p-4">
          {Object.entries(props).map(([name, prop]) => (
            <FieldRow key={name} name={name} prop={prop} />
          ))}
        </div>
      ) : (
        <Textarea
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          rows={8}
          className="font-mono text-xs"
          spellCheck={false}
          aria-label="Tool arguments as JSON"
        />
      )}

      <Button size="sm" onClick={isClient ? runLocal : runServer} disabled={running}>
        {running ? (
          <Loader2 className="mr-1.5 h-4 w-4 animate-spin" aria-hidden="true" />
        ) : (
          <PlayCircle className="mr-1.5 h-4 w-4" aria-hidden="true" />
        )}
        Run
      </Button>

      {outcome && <OutcomeView outcome={outcome} toolSlug={tool.slug} />}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Result rendering with copy / download                                */
/* ------------------------------------------------------------------ */

interface PartView { filename: string; content: string; rows?: number }

function copyText(text: string, done: () => void) {
  navigator.clipboard.writeText(text).then(done).catch(done);
}

function downloadText(filename: string, text: string) {
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function CopyButton({ text, label = 'Copy' }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      size="sm"
      variant="ghost"
      className="h-7 px-2 text-xs"
      onClick={() => copyText(text, () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      })}
    >
      {copied ? <Check className="mr-1 h-3 w-3" aria-hidden="true" /> : <Copy className="mr-1 h-3 w-3" aria-hidden="true" />}
      {copied ? 'Copied' : label}
    </Button>
  );
}

function OutcomeView({ outcome, toolSlug }: { outcome: RunOutcome; toolSlug: string }) {
  if (!outcome.ok || !outcome.result) {
    return (
      <div className="rounded-md border p-3 text-xs leading-relaxed" role="alert">
        <p className="font-medium">{outcome.error?.code ?? 'RUN_FAILED'}</p>
        <p className="mt-1 text-muted-foreground">{outcome.error?.message}</p>
      </div>
    );
  }

  const { data, warnings, change_log } = outcome.result;
  const d = (data ?? {}) as Record<string, unknown>;
  const parts = Array.isArray(d.parts) ? (d.parts as PartView[]) : null;
  const primaryOutput = typeof d.output === 'string' ? (d.output as string) : null;

  return (
    <div className="space-y-2">
      {warnings.length > 0 && (
        <div className="rounded-md border p-3 text-xs leading-relaxed text-muted-foreground">
          {warnings.map((w, i) => (
            <p key={i} className="flex items-start gap-1.5">
              <TriangleAlert className="mt-0.5 h-3 w-3 shrink-0" aria-hidden="true" />
              {w}
            </p>
          ))}
        </div>
      )}

      {parts && parts.length > 0 && (
        <div className="space-y-3">
          {parts.map((part) => (
            <div key={part.filename} className="space-y-1">
              <div className="flex items-center justify-between gap-2">
                <p className="font-mono text-xs font-medium">
                  {part.filename}
                  {typeof part.rows === 'number' ? ` · ${part.rows} rows` : ''}
                </p>
                <div className="flex gap-1">
                  <CopyButton text={part.content} />
                  <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => downloadText(part.filename, part.content)}>
                    <Download className="mr-1 h-3 w-3" aria-hidden="true" />
                    Download
                  </Button>
                </div>
              </div>
              <pre className="max-h-48 overflow-auto rounded-md border bg-muted/40 p-3 font-mono text-xs leading-relaxed">
                {part.content.length > 4000 ? `${part.content.slice(0, 4000)}\n... (preview truncated — full content in the download)` : part.content}
              </pre>
            </div>
          ))}
        </div>
      )}

      {!parts && primaryOutput !== null && (
        <div className="space-y-1">
          <div className="flex items-center justify-end gap-1">
            <CopyButton text={primaryOutput} />
            {typeof d.filename === 'string' && (
              <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => downloadText(d.filename as string, primaryOutput)}>
                <Download className="mr-1 h-3 w-3" aria-hidden="true" />
                Download
              </Button>
            )}
          </div>
          <pre className="max-h-96 overflow-auto rounded-md border bg-muted/40 p-3 font-mono text-xs leading-relaxed">
            {primaryOutput.length > 20000 ? `${primaryOutput.slice(0, 20000)}\n... (preview truncated — full content in the download)` : primaryOutput}
          </pre>
        </div>
      )}

      {!parts && primaryOutput === null && (
        <div className="space-y-1">
          <div className="flex items-center justify-end">
            <CopyButton text={JSON.stringify(data, null, 2)} />
          </div>
          <pre className="max-h-96 overflow-auto rounded-md border bg-muted/40 p-3 font-mono text-xs leading-relaxed">
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      )}

      {change_log && change_log.length > 0 && (
        <details className="text-xs text-muted-foreground">
          <summary className="cursor-pointer select-none">Change log ({change_log.length})</summary>
          <ul className="mt-1.5 space-y-1">
            {change_log.map((c, i) => (
              <li key={i}>
                <span className="font-mono">{c.at}</span>
                {c.note ? ` — ${c.note}` : ''}
              </li>
            ))}
          </ul>
        </details>
      )}

      <p className="text-xs text-muted-foreground">
        {outcome.result.ms} ms
        {outcome.usage
          ? ` · ${outcome.usage.quota_remaining.daily} server calls left today (resets ${new Date(outcome.usage.quota_remaining.resets_at).toUTCString().slice(0, 22)} UTC)`
          : ' · local run, quota untouched'}
        {typeof d.filename === 'string' ? ` · saves as ${d.filename}` : ` · ${toolSlug}`}
      </p>
    </div>
  );
}
