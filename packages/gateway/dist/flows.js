// Login flows — VOL-10 §3 (LOCKED): device flow (primary), paste-the-token,
// headless env (§3.3). On success the gateway holds a credential under the
// active profile and whoami prints identity, tier, and remaining MCP quota.
import { exec as openBrowserMaybe } from 'node:child_process';
import { request, ApiError, fetchQuota } from './api.js';
import { writeProfile, writeSecret, deleteSecret, readSecrets, readProfiles, last4, keyringAvailable } from './store.js';
function openBrowser(url) {
    if (process.env.JONTRIX_NO_BROWSER === '1')
        return;
    try {
        const platform = process.platform;
        const cmd = platform === 'darwin' ? 'open' : platform === 'win32' ? 'start' : 'xdg-open';
        openBrowserMaybe(cmd + ' ' + JSON.stringify(url), () => undefined);
    }
    catch {
        /* opening is best-effort; the URL is printed regardless */
    }
}
async function deviceFlow(base, opts, agentName) {
    const { status, body } = await request(base, '/api/mcp/login/device', {
        method: 'POST',
        json: { agent_name: agentName ?? 'gateway' },
        okStatuses: [201],
    });
    if (status !== 201) {
        console.error(`could not start the device flow: ${describe(body)}`);
        return 3;
    }
    const d = body;
    console.log(`\n  Open:  ${d.verify_url}`);
    console.log(`  Code:  ${d.user_code}\n`);
    openBrowser(d.verify_url);
    const deadline = Date.now() + d.expires_in * 1000;
    let interval = Math.max(1, d.interval);
    while (Date.now() < deadline) {
        await new Promise((r) => setTimeout(r, interval * 1000));
        const poll = await request(base, '/api/mcp/login/device/poll', {
            method: 'POST',
            json: { device_code: d.device_code },
        });
        // §4.3: pending and slow_down are 200s too — success is a 200 carrying
        // the session pair (no `status` field). Distinguish on the payload.
        const b = poll.body;
        if (poll.status === 200 && b.access_token) {
            const pair = poll.body;
            writeSecret(opts.profile, {
                access_token: pair.access_token,
                refresh_token: pair.refresh_token,
                endpoint: base,
                kind: 'session',
                last4: last4(pair.access_token),
                scope: pair.scope,
            });
            writeProfile(opts.profile, { endpoint: base, agent_name: agentName });
            console.log('Connected. The gateway holds a session pair; your AAT stays in the dashboard.');
            return 0;
        }
        if (b.status === 'slow_down') {
            interval = b.interval ?? interval + 5; // server bumps interval +5 s (§3.1 step 5)
        }
        else if (poll.status === 403 || b.error === 'denied') {
            console.error('The device request was denied in the browser.');
            return 2;
        }
        else if (poll.status === 410 || b.error === 'expired') {
            console.error('The device code expired — run login again.');
            return 2;
        }
    }
    console.error('Timed out waiting for approval.');
    return 2;
}
async function pasteFlow(base, opts, token, isPat) {
    const path = isPat ? '/api/v1/me' : '/api/mcp/quota';
    try {
        const { status } = await request(base, path, { bearer: token });
        if (status !== 200) {
            console.error(isPat ? 'That PAT was not accepted.' : 'That AAT was not accepted.');
            return 2;
        }
    }
    catch (e) {
        console.error(`endpoint unreachable: ${e.message}`);
        return 3;
    }
    const entry = isPat
        ? { pat: token, kind: 'pat' }
        : { aat: token, kind: 'aat' };
    writeSecret(opts.profile, {
        ...entry,
        endpoint: base,
        last4: last4(token),
    });
    writeProfile(opts.profile, { endpoint: base });
    console.log(`Stored ${isPat ? 'PAT (data plane: me/export)' : 'AAT (MCP: tools/call)'} for profile ${opts.profile}.`);
    return 0;
}
export function describe(body) {
    const e = body?.error;
    return e?.message ?? e?.code ?? 'unknown error';
}
export async function login(opts, flags) {
    const base = opts.endpoint ?? readProfilesEndpoint(opts.profile);
    const agentName = typeof flags.agent === 'string' ? flags.agent : undefined;
    const tokenFlag = ['token', 'token-stdin', 'pat'].find((f) => flags[f] === true || typeof flags[f] === 'string');
    if (tokenFlag) {
        let token = typeof flags[tokenFlag] === 'string' ? flags[tokenFlag] : '';
        if (tokenFlag === 'token-stdin') {
            token = (await readStdin()).trim();
        }
        const isPat = tokenFlag === 'pat' || token.startsWith('jx_pat_');
        if (!token.startsWith('jx_')) {
            console.error('Tokens start with jx_aat_ (agents) or jx_pat_ (data plane).');
            return 5;
        }
        return pasteFlow(base, opts, token, isPat);
    }
    return deviceFlow(base, opts, agentName);
}
function readProfilesEndpoint(profile) {
    return readProfiles()[profile]?.endpoint ?? 'https://mcp.jontrix.app';
}
function readStdin() {
    return new Promise((resolve) => {
        let data = '';
        process.stdin.setEncoding('utf8');
        process.stdin.on('data', (c) => (data += c));
        process.stdin.on('end', () => resolve(data));
    });
}
export async function logout(opts) {
    const secrets = readSecrets();
    const entry = secrets[opts.profile];
    if (entry?.kind === 'session' && entry.refresh_token) {
        // Revoke server-side when possible; a missing network still deletes locally.
        try {
            await request(entry.endpoint, '/api/auth/signout', { method: 'POST', bearer: entry.access_token });
        }
        catch {
            /* local delete wins; the refresh TTL bounds any residue */
        }
    }
    deleteSecret(opts.profile);
    console.log(`Logged out profile ${opts.profile}. Client configs untouched (remove entries with your host's editor).`);
    return 0;
}
export async function whoami(opts, json) {
    const secrets = readSecrets();
    const entry = secrets[opts.profile];
    if (!entry) {
        if (json)
            console.log(JSON.stringify({ logged_in: false }));
        else
            console.log('Not logged in — run: jontrix-gateway login');
        return 2;
    }
    if (entry.kind === 'pat') {
        const out = { profile: opts.profile, kind: 'pat', last4: entry.last4, endpoint: entry.endpoint, note: 'data-plane only (me/export)' };
        console.log(json ? JSON.stringify(out) : `profile ${out.profile} · PAT …${out.last4} · data-plane only`);
        if (!keyringAvailable())
            console.error('warning: secrets stored in a 0600 file — OS keyring unavailable');
        return 0;
    }
    const bearer = entry.aat ?? entry.access_token;
    try {
        const q = await fetchQuota(entry.endpoint, bearer);
        const mcp = q.mcp;
        const out = {
            profile: opts.profile,
            kind: entry.kind,
            last4: entry.last4,
            endpoint: entry.endpoint,
            tier: q.tier,
            mcp_used_month: mcp.calls_made_month,
            mcp_limit_month: mcp.calls_limit_month,
            mcp_resets_at: mcp.resets_at,
        };
        if (json)
            console.log(JSON.stringify(out));
        else {
            console.log(`profile ${out.profile} · ${out.kind} …${out.last4} · tier ${out.tier}`);
            console.log(`MCP quota: ${mcp.calls_limit_month - mcp.calls_made_month}/${mcp.calls_limit_month} left (resets ${mcp.resets_at})`);
            if (!keyringAvailable())
                console.error('warning: secrets stored in a 0600 file — OS keyring unavailable');
        }
        return 0;
    }
    catch (e) {
        if (e instanceof ApiError && (e.status === 401 || e.status === 403)) {
            deleteSecret(opts.profile);
            console.error('Token is dead — keyring entry cleared. Run: jontrix-gateway login');
            return 2;
        }
        console.error(`could not reach ${entry.endpoint}: ${e.message}`);
        return 3;
    }
}
export { last4 };
