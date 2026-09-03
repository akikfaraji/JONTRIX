// Token factory UI — the D-04 ceremony, exactly (VOL-07 §6):
// creation shows the secret once with a copy button and an "I stored it"
// acknowledgment; PAT rotation requires typing ROTATE; revoking the PAT
// warns that the account is left PAT-less. The browser is the only token
// factory — agents can never mint tokens (VOL-05 §6).

'use client';

import { useCallback, useEffect, useState } from 'react';
import { Copy, KeyRound, Loader2, Plus, RefreshCcw, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';

interface TokenRow {
  id: string;
  kind: 'pat' | 'aat';
  name: string | null;
  prefix: string;
  last4: string;
  status: string;
  scopes: Record<string, unknown>;
  expires_at: string | null;
  last_used_at: string | null;
  created_at: string;
}

type Creation =
  | { kind: 'pat' | 'aat'; open: boolean }
  | null;

export function TokenFactoryView({ onBack }: { onBack: () => void }) {
  const [rows, setRows] = useState<TokenRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [creation, setCreation] = useState<Creation>(null);
  const [newName, setNewName] = useState('');
  const [minting, setMinting] = useState(false);
  const [secret, setSecret] = useState<string | null>(null);
  const [stored, setStored] = useState(false);
  const [rotateOpen, setRotateOpen] = useState(false);
  const [rotateText, setRotateText] = useState('');
  const [revoking, setRevoking] = useState<TokenRow | null>(null);
  const [busy, setBusy] = useState(false);
  const { toast } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/tokens');
      const body = await res.json();
      if (body.ok) setRows(body.data.items as TokenRow[]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function resetCreation() {
    setCreation(null);
    setNewName('');
    setSecret(null);
    setStored(false);
  }

  async function mint(kind: 'pat' | 'aat') {
    setMinting(true);
    try {
      const res = await fetch('/api/v1/tokens', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ kind, name: newName || undefined }),
      });
      const body = await res.json();
      if (body.ok) {
        setSecret(body.data.secret as string);
        await load();
      } else {
        toast({ title: 'Could not create token', description: body.error?.message });
        resetCreation();
      }
    } finally {
      setMinting(false);
    }
  }

  async function rotate() {
    setBusy(true);
    try {
      const res = await fetch('/api/v1/tokens/pat/rotate', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ confirm: rotateText }),
      });
      const body = await res.json();
      if (body.ok) {
        setRotateOpen(false);
        setRotateText('');
        setSecret(body.data.secret as string);
        setStored(false);
        setCreation({ kind: 'pat', open: true });
        await load();
      } else {
        toast({ title: 'Rotation refused', description: body.error?.message });
      }
    } finally {
      setBusy(false);
    }
  }

  async function revoke(row: TokenRow) {
    setBusy(true);
    try {
      const res = await fetch(`/api/v1/tokens/${row.id}`, { method: 'DELETE' });
      const body = await res.json();
      if (body.ok) {
        toast({
          title: row.kind === 'pat' ? 'PAT revoked' : 'Agent token revoked',
          description:
            row.kind === 'pat'
              ? 'You now have no PAT — create a new one anytime.'
              : 'Agents using it will stop working immediately.',
        });
        await load();
      } else {
        toast({ title: 'Could not revoke', description: body.error?.message });
      }
    } finally {
      setRevoking(null);
      setBusy(false);
    }
  }

  const activePat = rows.find((r) => r.kind === 'pat' && r.status === 'active');

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={onBack}>
          Dashboard
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">Tokens</h1>
        <div className="ml-auto flex gap-2">
          {!activePat && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setSecret(null);
                setStored(false);
                setCreation({ kind: 'pat', open: true });
              }}
            >
              <Plus className="mr-1.5 h-4 w-4" />
              Create PAT
            </Button>
          )}
          {activePat && (
            <Button size="sm" variant="outline" onClick={() => setRotateOpen(true)}>
              <RefreshCcw className="mr-1.5 h-4 w-4" />
              Rotate PAT
            </Button>
          )}
          <Button
            size="sm"
            onClick={() => {
              setSecret(null);
              setStored(false);
              setCreation({ kind: 'aat', open: true });
            }}
          >
            <Plus className="mr-1.5 h-4 w-4" />
            New agent token
          </Button>
        </div>
      </div>
      <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">
        The dashboard is the only token factory. Personal Access Tokens (PAT)
        read and write your own data on the /api/v1 plane; agent tokens (AAT)
        are the only credentials AI agents can use on MCP.
      </p>

      <div className="mt-6 space-y-3">
        {loading ? (
          Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-lg" />)
        ) : rows.length === 0 ? (
          <Card className="border">
            <CardContent className="flex items-center gap-3 p-6 text-sm text-muted-foreground">
              <KeyRound className="h-4 w-4 shrink-0" aria-hidden="true" />
              No tokens yet. Create a PAT for terminal access or an agent
              token for MCP clients.
            </CardContent>
          </Card>
        ) : (
          rows.map((r) => (
            <Card key={r.id} className="border">
              <CardContent className="flex flex-wrap items-center gap-x-4 gap-y-2 p-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-medium">
                      {r.name ?? (r.kind === 'pat' ? 'Personal access token' : 'Agent token')}
                    </p>
                    <Badge variant="outline" className="uppercase">
                      {r.kind}
                    </Badge>
                    {r.status !== 'active' && (
                      <Badge variant="secondary" className="capitalize">
                        {r.status}
                      </Badge>
                    )}
                  </div>
                  <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                    {r.prefix}…{r.last4}
                    {r.last_used_at &&
                      ` · last used ${new Date(r.last_used_at).toLocaleDateString('en-GB', { timeZone: 'UTC' })}`}
                  </p>
                </div>
                <div className="ml-auto flex gap-2">
                  {r.status === 'active' && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      disabled={busy}
                      onClick={() => setRevoking(r)}
                    >
                      <Trash2 className="mr-1.5 h-4 w-4" />
                      Revoke
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Creation / rotation result — the shown-once ceremony */}
      <Dialog open={creation !== null} onOpenChange={(o) => !o && resetCreation()}>
        <DialogContent className="max-w-md">
          {secret ? (
            <>
              <DialogHeader>
                <DialogTitle>Store this secret now</DialogTitle>
                <DialogDescription>
                  It is shown once and cannot be recovered. This is the only
                  time the full secret will ever be displayed.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <code className="min-w-0 flex-1 break-all rounded-md border bg-muted/50 p-2.5 font-mono text-xs">
                    {secret}
                  </code>
                  <Button
                    size="icon"
                    variant="outline"
                    aria-label="Copy secret"
                    onClick={() => {
                      void navigator.clipboard.writeText(secret);
                      toast({ title: 'Copied to clipboard' });
                    }}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <label className="flex items-start gap-2 text-sm leading-relaxed text-muted-foreground">
                  <Checkbox
                    checked={stored}
                    onCheckedChange={(v) => setStored(v === true)}
                    aria-label="I stored the secret"
                    className="mt-0.5"
                  />
                  <span>I saved this secret somewhere safe — I understand it will never be shown again.</span>
                </label>
                <Button className="w-full" disabled={!stored} onClick={resetCreation}>
                  I stored it
                </Button>
              </div>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>
                  {creation?.kind === 'pat' ? 'Create a Personal Access Token' : 'Create an agent token'}
                </DialogTitle>
                <DialogDescription>
                  {creation?.kind === 'pat'
                    ? 'One PAT per account on every tier. Full read and write to your own data — never accepted on MCP.'
                    : 'Agent tokens are for MCP clients. Your tier sets how many you can hold.'}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="token-name">Name (optional)</Label>
                  <Input
                    id="token-name"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder={creation?.kind === 'pat' ? 'laptop terminal' : 'claude, cursor…'}
                    maxLength={100}
                  />
                </div>
                <Button className="w-full" disabled={minting} onClick={() => void mint(creation!.kind)}>
                  {minting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create token
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Rotation gate — typing ROTATE makes old-secret death explicit */}
      <Dialog open={rotateOpen} onOpenChange={(o) => !o && setRotateOpen(false)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Rotate your PAT</DialogTitle>
            <DialogDescription>
              A new secret is issued and shown once. The old secret dies
              immediately — anything using it stops working.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="rotate-confirm">Type ROTATE to confirm</Label>
              <Input
                id="rotate-confirm"
                value={rotateText}
                onChange={(e) => setRotateText(e.target.value)}
                placeholder="ROTATE"
                className="font-mono"
              />
            </div>
            <Button
              className="w-full"
              disabled={busy || rotateText !== 'ROTATE'}
              onClick={() => void rotate()}
            >
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Rotate now
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Revocation confirm */}
      <Dialog open={revoking !== null} onOpenChange={(o) => !o && setRevoking(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              Revoke {revoking?.kind === 'pat' ? 'your PAT' : 'this agent token'}?
            </DialogTitle>
            <DialogDescription>
              {revoking?.kind === 'pat'
                ? 'You will have no PAT until you create a new one. Scripts using the current secret stop immediately.'
                : 'Agents using this token stop working immediately.'}
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setRevoking(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              disabled={busy}
              onClick={() => revoking && void revoke(revoking)}
            >
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Revoke
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
