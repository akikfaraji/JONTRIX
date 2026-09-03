#!/usr/bin/env node
// jontrix-gateway entry point (VOL-10 §5.2 verb table, P0 verbs in this
// build: login, logout, whoami/status, mcp, tools, quota, connect, doctor).
import { run } from '../dist/cli.js';

run(process.argv.slice(2)).then(
  (code) => process.exit(code),
  (err) => {
    // exit 6 = internal error; a trace id, never payload contents (§5.2)
    const trace = Math.random().toString(36).slice(2, 10);
    console.error(`internal error (trace ${trace})`);
    if (process.env.JONTRIX_LOG_LEVEL === 'debug') console.error(String(err?.message ?? err));
    process.exit(6);
  },
);
