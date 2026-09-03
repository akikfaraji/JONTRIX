// Connect-your-agent view — the VOL-10 §9 onboarding copy (LOCKED): three
// steps, three sentences. No step may reference the advanced remote path —
// that link lives once, in small print, from the docs (About) footer only.

'use client';

import { Bot, KeyRound, Plug } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const HOSTS = ['claude-desktop', 'cursor', 'vscode', 'cline', 'windsurf', 'gemini-cli'];

function Step({
  icon: Icon,
  n,
  title,
  children,
}: {
  icon: typeof Bot;
  n: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="border">
      <CardContent className="flex items-start gap-4 p-5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border" aria-hidden="true">
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium">
            <span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground">
              {n}
            </span>
            {title}
          </p>
          <div className="mt-2 space-y-2 text-sm leading-relaxed text-muted-foreground">{children}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function Cmd({ children }: { children: string }) {
  return (
    <pre className="overflow-x-auto rounded-md border bg-muted/40 p-2.5 font-mono text-xs leading-relaxed">
      {children}
    </pre>
  );
}

export function ConnectView() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold tracking-tight">Connect your agent</h1>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
        Run JONTRIX tools from Claude Desktop, Cursor, Cline, or any MCP host. The
        gateway does all the talking to MCP — your host config never contains a secret.
      </p>

      <div className="mt-6 space-y-3">
        <Step icon={Plug} n={1} title="Install the gateway">
          <Cmd>npm i -g jontrix-gateway</Cmd>
          <p>
            Also available as <span className="font-mono text-xs">pip install jontrix-gateway</span> and
            as standalone binaries on the releases page.
          </p>
        </Step>

        <Step icon={KeyRound} n={2} title="Log in once">
          <Cmd>jontrix-gateway login</Cmd>
          <p>
            This opens the approval page, signs you in, and creates or attaches an AAT for
            your agent. Your PAT stays for the terminal data plane — agents are driven by AATs.
          </p>
        </Step>

        <Step icon={Bot} n={3} title="Connect your host">
          <Cmd>jontrix-gateway connect claude-desktop</Cmd>
          <p>
            Supported hosts: {HOSTS.map((h) => (
              <span key={h} className="mr-1.5 inline-block rounded border px-1.5 py-0.5 font-mono text-[11px]">
                {h}
              </span>
            ))}
          </p>
        </Step>
      </div>

      <p className="mt-6 text-xs leading-relaxed text-muted-foreground">
        The gateway stores credentials in your OS keyring, caches your quota for 60 seconds,
        and sends nothing you did not ask it to send. It works everywhere MCP hosts speak
        stdio, and it never charges a call that the server would refuse.
      </p>
    </div>
  );
}
