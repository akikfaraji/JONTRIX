// GET/POST /api/mcp/login — the founder-specified front door (VOL-10 §1, §3.1).
// GET renders the HTML page: sign in OR paste an AAT; a PAT paste is answered
// with inline data-plane guidance (T10.2b); then device approval with the
// dashboard-factory actions (create / attach). POST approves a pending device:
//   - session cookie → create a new AAT (mcp_aats_max enforced) or attach one
//   - pasted AAT bearer → attach only (D-04: AATs never create tokens)
// All refusals are honest; nothing is metered anywhere on this route.

import { db } from '@/lib/db';
import { getSessionAuth, issueOtp } from '@/lib/auth';
import { resolveMcpBearer } from '@/lib/mcp/auth';
import { resolveEntitlement } from '@/lib/entitlements';
import { audit } from '@/lib/audit';
import { mintSecret, sha256 } from '@/lib/tokens';
import { ipLimit, clientIp } from '@/lib/mcp/ratelimit';
import { readJsonWithLimit } from '@/lib/validate';

export const dynamic = 'force-dynamic';

const PAGE = (opts: {
  userCode: string;
  agentName: string | null;
  clientHint: string | null;
  ipSuffix: string;
  signedIn: boolean;
  message?: string;
  messageType?: 'error' | 'info' | 'success';
  devicePending: boolean;
}): string => {
  const banner = opts.message
    ? `<div class="banner ${opts.messageType ?? 'info'}">${escapeHtml(opts.message)}</div>`
    : '';
  const deviceBlock = opts.devicePending
    ? `<section>
        <h2>Device requesting approval</h2>
        <dl>
          <dt>Agent name</dt><dd>${escapeHtml(opts.agentName ?? '(not provided)')}</dd>
          <dt>Client</dt><dd>${escapeHtml(opts.clientHint ?? '(not provided)')}</dd>
          <dt>Request IP</dt><dd>…${escapeHtml(opts.ipSuffix)} <small>check this matches the machine running the gateway</small></dd>
        </dl>
        ${
          opts.signedIn
            ? `<form method="post" action="/api/mcp/login">
                <input type="hidden" name="user_code" value="${escapeHtml(opts.userCode)}">
                <label for="agent_name">AAT name</label>
                <input id="agent_name" name="agent_name" value="${escapeHtml(opts.agentName ?? '')}" maxlength="100" placeholder="e.g. cursor-main">
                <fieldset>
                  <legend>Action</legend>
                  <label><input type="radio" name="action" value="create" checked> Create a new AAT for this device</label>
                  <label><input type="radio" name="action" value="attach"> Attach an existing AAT</label>
                </fieldset>
                <label for="aat_id">Existing AAT (attach only)</label>
                <input id="aat_id" name="aat_id" placeholder="token id from your dashboard list">
                <button type="submit">Approve</button>
              </form>`
            : `<p class="note">Sign in (top form) or paste an AAT (middle form) to continue.</p>`
        }
      </section>`
    : `<section><p>No pending device code supplied. Enter the code shown by <code>jontrix-gateway login</code> below.</p>
        <form method="get" action="/api/mcp/login">
          <label for="uc">Device code</label>
          <input id="uc" name="user_code" placeholder="JX-XXXX-XXXX" value="">
          <button type="submit">Continue</button>
        </form>
      </section>`;

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>JONTRIX — Connect your agent</title>
<style>
  :root { color-scheme: light dark; font-family: system-ui, sans-serif; }
  body { max-width: 560px; margin: 0 auto; padding: 24px 16px; line-height: 1.5; }
  h1 { font-size: 1.25rem; } h2 { font-size: 1rem; margin-top: 28px; }
  form, section { margin-top: 12px; }
  input, button { font: inherit; padding: 8px; margin: 4px 0; width: 100%; box-sizing: border-box; }
  button { cursor: pointer; }
  fieldset label { display: block; margin: 4px 0; }
  dl { display: grid; grid-template-columns: 140px 1fr; gap: 4px 8px; }
  dt { color: gray; } dd { margin: 0; overflow-wrap: anywhere; }
  .banner { padding: 10px; margin: 12px 0; }
  .banner.error { border: 1px solid currentColor; }
  .banner.success { border: 1px solid currentColor; }
  .banner.info { border: 1px dashed currentColor; }
  small { color: gray; }
  .note { color: gray; }
</style>
</head>
<body>
<h1>JONTRIX agent access</h1>
<p>Your gateway (<code>jontrix-gateway login</code>) asked to connect. Agents are driven by
<strong>AATs</strong> — Agent Access Tokens. <strong>PATs</strong> are different: they are
data-plane credentials for your own data over the API and can never drive agents.</p>
${banner}

<section>
  <h2>1. Sign in</h2>
  ${
    opts.signedIn
      ? '<p class="note">Signed in with your browser session.</p>'
      : `<form method="get" action="/api/mcp/login">
          <input type="hidden" name="user_code" value="${escapeHtml(opts.userCode)}">
          <label for="email">Email</label>
          <input id="email" name="email" type="email" required placeholder="you@example.com">
          <button type="submit">Send sign-in code</button>
        </form>
        <form method="post" action="/api/mcp/login/session">
          <input type="hidden" name="user_code" value="${escapeHtml(opts.userCode)}">
          <label for="vemail">Email</label>
          <input id="vemail" name="email" type="email" required placeholder="you@example.com">
          <label for="code">Verification code</label>
          <input id="code" name="code" inputmode="numeric" placeholder="6-digit code">
          <button type="submit">Verify &amp; continue</button>
        </form>`
  }
</section>

<section>
  <h2>2. Or paste an existing AAT</h2>
  <form method="post" action="/api/mcp/login">
    <input type="hidden" name="user_code" value="${escapeHtml(opts.userCode)}">
    <input type="hidden" name="action" value="attach">
    <input type="hidden" name="via" value="paste">
    <label for="aat">AAT (starts with jx_aat_)</label>
    <input id="aat" name="aat" placeholder="jx_aat_…" autocomplete="off">
    <button type="submit">Attach AAT to device</button>
  </form>
  <p class="note">Pasting a PAT? It will be refused here — PATs stay for the terminal
  data plane. Sign in and create an AAT instead.</p>
</section>

${deviceBlock}

<p><small>Approving this device only links it to an AAT you choose or create. Guessing a
device code grants nothing. Signing in here sets a browser session cookie; the AAT secret
itself is never displayed on this page.</small></p>
</body>
</html>`;
};

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function htmlPage(opts: Parameters<typeof PAGE>[0]): Response {
  return new Response(PAGE(opts), {
    headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' },
  });
}

type DeviceRow = NonNullable<Awaited<ReturnType<typeof db.mcpDeviceCode.findUnique>>>;

async function loadDevice(
  req: Request,
): Promise<{ device: DeviceRow; userCode: string; ipSuffix: string } | null> {
  const url = new URL(req.url);
  const userCode = (url.searchParams.get('user_code') ?? '').trim().toUpperCase();
  if (!userCode) return null;
  const device = await db.mcpDeviceCode.findUnique({ where: { userCode } });
  const ipSuffix = (device?.issuedIp ?? '').slice(-5) || 'local';
  return device ? { device, userCode, ipSuffix } : null;
}

export async function GET(req: Request) {
  const ip = clientIp(req);
  if (!ipLimit(`loginpage:${ip}`).ok) {
    return new Response('Too many requests', { status: 429 });
  }

  const session = await getSessionAuth(req);
  const loaded = await loadDevice(req);
  const email = new URL(req.url).searchParams.get('email');

  if (email && !session) {
    // Issue the OTP inline (log driver in this build, ENV-6) and render the
    // verify form; /api/mcp/login/session completes sign-in and returns.
    const issued = await issueOtp(email);
    const delivered = issued.ok === true;
    return htmlPage({
      userCode: loaded?.userCode ?? '',
      agentName: loaded?.device.agentName ?? null,
      clientHint: loaded?.device.clientHint ?? null,
      ipSuffix: loaded?.ipSuffix ?? 'local',
      signedIn: false,
      messageType: delivered ? 'info' : 'error',
      message: delivered
        ? `Verification code sent. In this build environment it appears in the server log.`
        : 'Could not send a code to that address — check it and retry.',
      devicePending: false,
    });
  }

  if (!loaded) {
    return htmlPage({
      userCode: '',
      agentName: null,
      clientHint: null,
      ipSuffix: ip.slice(-5),
      signedIn: Boolean(session),
      devicePending: false,
    });
  }

  if (loaded.device.status === 'consumed' || loaded.device.expiresAt < new Date()) {
    return htmlPage({
      userCode: loaded.userCode,
      agentName: loaded.device.agentName,
      clientHint: loaded.device.clientHint,
      ipSuffix: loaded.ipSuffix,
      signedIn: Boolean(session),
      messageType: loaded.device.status === 'consumed' ? 'success' : 'error',
      message:
        loaded.device.status === 'consumed'
          ? 'This device was already approved — return to your terminal; the gateway is connected.'
          : 'This device code has expired — run jontrix-gateway login again for a fresh one.',
      devicePending: false,
    });
  }

  return htmlPage({
    userCode: loaded.userCode,
    agentName: loaded.device.agentName,
    clientHint: loaded.device.clientHint,
    ipSuffix: loaded.ipSuffix,
    signedIn: Boolean(session),
    devicePending: true,
  });
}

export async function POST(req: Request) {
  const ip = clientIp(req);
  if (!ipLimit(`loginpost:${ip}`).ok) {
    return new Response('Too many requests', { status: 429 });
  }

  let form: Record<string, string> = {};
  const ctype = req.headers.get('content-type') ?? '';
  if (ctype.includes('application/json')) {
    try {
      const parsedBody = await readJsonWithLimit(req, 8 * 1024);
      if (!parsedBody.ok) throw new Error('BAD_BODY');
      form = parsedBody.body as Record<string, string>;
    } catch {
      form = {};
    }
  } else {
    const rawForm = await req.text();
    if (rawForm.length > 16 * 1024) {
      return new Response('Payload too large', { status: 413 });
    }
    const params = new URLSearchParams(rawForm);
    form = Object.fromEntries(params.entries());
  }

  const userCode = (form.user_code ?? '').trim().toUpperCase();
  if (!userCode) {
    return Response.json({ ok: false, error: { code: 'BAD_REQUEST', message: 'user_code required' } }, { status: 400 });
  }
  const device = await db.mcpDeviceCode.findUnique({ where: { userCode } });
  if (!device || device.expiresAt < new Date() || device.status !== 'pending') {
    return Response.json(
      { ok: false, error: { code: 'NOT_FOUND', message: 'unknown, expired, or already-processed device code' } },
      { status: 404 },
    );
  }

  // ── pasted-AAT attach path (T10.2/T10.3: valid AAT, no sign-in needed) ──
  if (form.via === 'paste' || form.aat) {
    const pasted = (form.aat ?? '').trim();
    if (pasted.startsWith('jx_pat_')) {
      // T10.2b — inline data-plane guidance; device NOT approved; nothing metered.
      return htmlPage({
        userCode,
        agentName: device.agentName,
        clientHint: device.clientHint,
        ipSuffix: (device.issuedIp ?? '').slice(-5),
        signedIn: false,
        messageType: 'error',
        message:
          'That is a PAT — PATs don\u2019t drive agents; they\u2019re for your own data over the API. Sign in and create an AAT, or paste an AAT (jx_aat_…).',
        devicePending: true,
      });
    }
    if (pasted.startsWith('jx_aat_')) {
      const resolved = await resolveMcpBearer(
        new Request(req.url, { headers: { authorization: `Bearer ${pasted}` } }),
      );
      if (resolved.outcome !== 'ok') {
        return htmlPage({
          userCode,
          agentName: device.agentName,
          clientHint: device.clientHint,
          ipSuffix: (device.issuedIp ?? '').slice(-5),
          signedIn: false,
          messageType: 'error',
          message: 'That AAT is unknown, revoked, or expired — check the dashboard token list.',
          devicePending: true,
        });
      }
      if (resolved.auth.kind !== 'aat') {
        return htmlPage({
          userCode,
          agentName: device.agentName,
          clientHint: device.clientHint,
          ipSuffix: (device.issuedIp ?? '').slice(-5),
          signedIn: false,
          messageType: 'error',
          message: 'Only AATs can be attached to a device.',
          devicePending: true,
        });
      }
      await db.mcpDeviceCode.update({
        where: { deviceHash: device.deviceHash },
        data: { status: 'approved', tokenId: resolved.auth.tokenId },
      });
      await audit({
        actorKind: 'aat',
        actorId: resolved.auth.tokenId,
        event: 'mcp.device.attached',
        subject: device.deviceHash.slice(0, 12),
        meta: { agent_name: device.agentName ?? 'unnamed' },
      });
      return htmlPage({
        userCode,
        agentName: device.agentName,
        clientHint: device.clientHint,
        ipSuffix: (device.issuedIp ?? '').slice(-5),
        signedIn: false,
        messageType: 'success',
        message: 'AAT attached — return to your terminal; the gateway will connect within a few seconds.',
        devicePending: false,
      });
    }
    return htmlPage({
      userCode,
      agentName: device.agentName,
      clientHint: device.clientHint,
      ipSuffix: (device.issuedIp ?? '').slice(-5),
      signedIn: false,
      messageType: 'error',
      message: 'Paste an AAT (jx_aat_…) or sign in to create one.',
      devicePending: true,
    });
  }

  // ── session paths: create or attach (the dashboard factory, D-04) ──
  const session = await getSessionAuth(req);
  if (!session) {
    return Response.json(
      { ok: false, error: { code: 'AUTH_REQUIRED', message: 'sign in (or paste an AAT) to approve a device' } },
      { status: 401 },
    );
  }
  const ent = await resolveEntitlement(session.userId);
  const action = form.action === 'attach' ? 'attach' : 'create';

  let aatId: string;
  if (action === 'attach') {
    const aatIdClaimed = (form.aat_id ?? '').trim();
    const existing = aatIdClaimed
      ? await db.token.findFirst({ where: { id: aatIdClaimed, userId: session.userId, kind: 'aat', status: 'active' } })
      : null;
    if (!existing) {
      return Response.json(
        { ok: false, error: { code: 'NOT_FOUND', message: 'no such active AAT for your account' } },
        { status: 404 },
      );
    }
    aatId = existing.id;
  } else {
    const activeAats = await db.token.count({
      where: { userId: session.userId, kind: 'aat', status: 'active' },
    });
    if (activeAats >= ent.limits.mcp_aats_max) {
      return Response.json(
        {
          ok: false,
          error: {
            code: 'LIMIT_REACHED',
            message: `your ${ent.tier} plan allows ${ent.limits.mcp_aats_max} agent token(s) — revoke one or upgrade`,
          },
        },
        { status: 422 },
      );
    }
    const minted = mintSecret('aat');
    const row = await db.token.create({
      data: {
        userId: session.userId,
        kind: 'aat',
        name: (form.agent_name || device.agentName || 'agent').slice(0, 100),
        hashSha256: minted.hash,
        prefix: minted.prefix,
        last4: minted.last4,
        scopesJson: JSON.stringify({ tools: 'all' }),
        status: 'active',
        expiresAt: new Date(Date.now() + 90 * 24 * 3600 * 1000), // §2: 90-day default
      },
    });
    aatId = row.id;
    await audit({
      actorKind: 'user_session',
      actorId: session.userId,
      event: 'token.created',
      subject: row.id,
      meta: { kind: 'aat', via: 'device-approval' },
    });
  }

  await db.mcpDeviceCode.update({
    where: { deviceHash: device.deviceHash },
    data: { status: 'approved', tokenId: aatId },
  });
  await audit({
    actorKind: 'user_session',
    actorId: session.userId,
    event: 'mcp.device.approved',
    subject: device.deviceHash.slice(0, 12),
    meta: { action, aat_id: aatId },
  });

  return htmlPage({
    userCode,
    agentName: device.agentName,
    clientHint: device.clientHint,
    ipSuffix: (device.issuedIp ?? '').slice(-5),
    signedIn: true,
    messageType: 'success',
    message: 'Device approved — return to your terminal; the gateway will connect within a few seconds.',
    devicePending: false,
  });
}
