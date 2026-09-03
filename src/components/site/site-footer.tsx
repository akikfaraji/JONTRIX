'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { POLICY_DOCS, type PolicyDoc } from '@/components/site/policy-content';
import { VERSION } from '@/version';

export function SiteFooter() {
  const [doc, setDoc] = useState<PolicyDoc | null>(null);

  return (
    <footer className="mt-auto border-t bg-background">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-5 text-sm text-muted-foreground sm:flex-row sm:items-center sm:px-6">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span>Fraziym Soft</span>
          <span aria-hidden="true">·</span>
          <span className="font-mono text-xs">
            JONTRIX {VERSION} · beta
          </span>
        </div>

        <div className="flex items-center gap-1 sm:ml-auto">
          {POLICY_DOCS.map((d) => (
            <Button
              key={d.id}
              variant="ghost"
              size="sm"
              className="h-8 text-muted-foreground"
              onClick={() => setDoc(d)}
            >
              {d.title}
            </Button>
          ))}
        </div>
      </div>

      <Dialog open={doc !== null} onOpenChange={(o) => !o && setDoc(null)}>
        <DialogContent className="max-w-lg">
          {doc && (
            <>
              <DialogHeader>
                <DialogTitle>{doc.title}</DialogTitle>
                <DialogDescription>Version {doc.version}</DialogDescription>
              </DialogHeader>
              <ScrollArea className="max-h-[60vh] pr-3">
                <div className="space-y-4 text-sm">
                  {doc.sections.map((s) => (
                    <div key={s.heading} className="space-y-1">
                      <p className="font-medium text-foreground">{s.heading}</p>
                      <p className="leading-relaxed text-muted-foreground">{s.body}</p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </>
          )}
        </DialogContent>
      </Dialog>
    </footer>
  );
}
