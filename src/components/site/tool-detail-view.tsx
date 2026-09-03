// Tool detail view — the Jont page template (VOL-07 §3), single-route delta.
// Sections: title + evidence-cited subtitle, the honest execution label
// (generated from context, never hand-written — C6/C8), tier badge, run
// panel placeholder until the tool's engine lands, FAQ, related tools in
// family. MAX-fit previews follow the first-N-rows rule when engines land.

'use client';

import { ArrowLeft, ArrowRight, Monitor, Server } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import type { JontRecord } from '@/lib/types';

const TIER_COPY: Record<string, string> = {
  FREE: 'Free to run',
  PRO: 'Pro and above',
  MAX: 'Max only',
};

function ExecutionLabel({ context }: { context: JontRecord['context'] }) {
  const [icon, text] =
    context === 'server'
      ? [Server, 'Runs on our server — the input is processed there and discarded with the request.']
      : [Monitor, 'Runs in your browser — files never leave your device.'];
  const Icon = icon;
  return (
    <p className="flex items-start gap-2 rounded-md border bg-muted/40 p-3 text-sm leading-relaxed text-muted-foreground">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
      <span>{text}</span>
    </p>
  );
}

export function ToolDetailView({
  tool,
  related,
  onBack,
  onOpenTool,
}: {
  tool: JontRecord;
  related: JontRecord[];
  onBack: () => void;
  onOpenTool: (j: JontRecord) => void;
}) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <Button variant="ghost" size="sm" className="mb-4 text-muted-foreground" onClick={onBack}>
        <ArrowLeft className="mr-1.5 h-4 w-4" />
        Catalog
      </Button>

      <div className="flex flex-wrap items-center gap-2">
        <h1 className="text-2xl font-bold tracking-tight">{tool.title}</h1>
        <Badge
          variant="outline"
          className={tool.tier_fit === 'FREE' ? '' : 'border-primary/40 text-primary'}
        >
          {TIER_COPY[tool.tier_fit]}
        </Badge>
        <Badge variant="secondary" className="capitalize">
          {tool.pattern}
        </Badge>
      </div>
      {tool.description && (
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          {tool.description}
        </p>
      )}

      <div className="mt-6 space-y-4">
        <ExecutionLabel context={tool.context} />

        <Card className="border">
          <CardContent className="p-5">
            <p className="text-sm font-medium">Run panel</p>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
              The input form, engine, and export buttons for this tool land in
              its build phase — this page is the permanent home of the tool,
              and it will contain the working tool itself, never a stub page.
            </p>
            <Separator className="my-4" />
            <div className="grid gap-2 text-sm">
              <div className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground">Execution context</span>
                <span className="font-medium capitalize">{tool.context === 'client' ? 'In-browser' : tool.context === 'server' ? 'Server-side' : 'Hybrid'}</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground">Pattern</span>
                <span className="font-medium capitalize">{tool.pattern}</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground">Evidence score</span>
                <span className="font-mono">{tool.score.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground">Agent access (MCP)</span>
                <span className="font-medium">{tool.mcp_exposed ? 'Yes — via jontrix-gateway' : 'No'}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {related.length > 0 && (
        <div className="mt-8">
          <h2 className="text-base font-semibold tracking-tight">More in this family</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {related.map((j) => (
              <Card
                key={j.id}
                className="cursor-pointer border transition-colors hover:border-input"
                onClick={() => onOpenTool(j)}
              >
                <CardContent className="flex items-center justify-between gap-3 p-4">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{j.title}</p>
                    <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                      {j.description}
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
