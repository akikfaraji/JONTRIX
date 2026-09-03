# jontrix-gateway

One local process between your MCP host (Claude Desktop, Cursor, Cline, Windsurf, VS Code, Gemini CLI) and the JONTRIX tool catalog. Zero telemetry.

## Install

```
npm i -g jontrix-gateway
```

Also distributed as a PyPI package and standalone binaries (see VOL-10 §5.1 for the parity contract).

## Use

```
jontrix-gateway login                 # opens the approval page, creates/attaches an AAT
jontrix-gateway connect claude-desktop
```

Your host config contains only `jontrix-gateway mcp` — never a secret. Credentials live in the OS keyring, with a 0600-file fallback (`~/.jontrix/secrets.json`) that warns on `status` until the keyring works.

## Verbs

login · logout · status/whoami · mcp · tools [list|call] · quota [--watch] · connect · doctor · update

Exit codes: 0 ok · 2 auth · 3 network · 4 quota · 5 usage · 6 internal.

## Behavior contracts

- The gateway is untrusted by design: every authorization decision is re-made server-side on every call (VOL-10 §1.1).
- Pre-flight quota checks only short-circuit calls the server would refuse — never the reverse (§7).
- Retries only on 429 (Retry-After honored exactly) and idempotent GETs; TLS errors are fatal (§5.6).
- No user content ever touches disk; caches are catalog/quota/manifest metadata only (§5.4).
- `mcp` serves stdio JSON-RPC 2.0: initialize, ping, tools/list, tools/call; lazy auth; starts cold in < 300 ms (§5.5).

## Headless CI

```
JONTRIX_TOKEN=jx_aat_… jontrix-gateway mcp --non-interactive
```

The env token is used in-memory only and never logged (§3.3).
