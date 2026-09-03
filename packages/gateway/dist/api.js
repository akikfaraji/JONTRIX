// HTTP client + caches — VOL-10 §5.4/§5.6 + §1 job (4)/(5) (LOCKED).
// Retries only on 429 (honor Retry-After exactly) and idempotent GETs on
// network errors: max 2, backoff 1 s → 4 s. Timeouts: 60 s tools/call,
// 10 s everything else. Quota cache TTL 60 s backs pre-flight; catalog
// cache TTL 1 h with ETag revalidation; protocol manifest TTL 24 h.
export class ApiError extends Error {
    status;
    code;
    retryAfter;
    constructor(status, code, message, retryAfter) {
        super(message);
        this.status = status;
        this.code = code;
        this.retryAfter = retryAfter;
    }
}
const UA = 'jontrix-gateway/0.1.0 (node)';
function timeoutFor(path) {
    return path.includes('/api/mcp/call') ? 60_000 : 10_000;
}
async function requestOnce(base, path, init, timeoutMs) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
        return await fetch(`${base.replace(/\/$/, '')}${path}`, {
            ...init,
            signal: ctrl.signal,
            headers: { 'user-agent': UA, ...init.headers },
        });
    }
    finally {
        clearTimeout(timer);
    }
}
/** POST/GET with the §5.6 network policy. Bearer optional. */
export async function request(base, path, opts = {}) {
    const method = opts.method ?? 'GET';
    const headers = {};
    if (opts.bearer)
        headers.authorization = `Bearer ${opts.bearer}`;
    if (opts.json !== undefined)
        headers['content-type'] = 'application/json';
    const init = {
        method,
        headers,
        body: opts.json !== undefined ? JSON.stringify(opts.json) : undefined,
    };
    let attempt = 0;
    let delayMs = 1000;
    for (;;) {
        let res;
        try {
            res = await requestOnce(base, path, init, timeoutFor(path));
        }
        catch (e) {
            const networkable = method === 'GET' || method === 'POST';
            const idempotent = method === 'GET' || (opts.json !== undefined && opts.json.idempotency_key !== undefined);
            if (networkable && idempotent && attempt < 2) {
                await sleep(delayMs);
                delayMs *= 4;
                attempt++;
                continue;
            }
            throw new ApiError(0, 'NETWORK', `endpoint unreachable: ${e.message}`);
        }
        if (res.status === 429 && attempt < 2) {
            const ra = Number(res.headers.get('retry-after') ?? '1');
            await sleep(Math.max(1, ra) * 1000); // honor Retry-After exactly
            attempt++;
            continue;
        }
        const text = await res.text();
        let body = null;
        try {
            body = text ? JSON.parse(text) : null;
        }
        catch {
            body = { raw: text.slice(0, 200) };
        }
        return { status: res.status, body, headers: res.headers };
    }
}
function sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
}
const quotaCache = new Map();
const catalogCache = new Map();
export const QUOTA_TTL_MS = 60_000;
export const CATALOG_TTL_MS = 3_600_000;
export async function fetchQuota(base, bearer) {
    const cached = quotaCache.get(bearer);
    if (cached && Date.now() - cached.fetchedAt < QUOTA_TTL_MS) {
        return { ...cached.value, __stale: false };
    }
    const { status, body } = await request(base, '/api/mcp/quota', { bearer });
    if (status !== 200)
        throw new ApiError(status, codeOf(body), messageOf(body));
    const value = body;
    quotaCache.set(bearer, { value, fetchedAt: Date.now(), stale: false });
    return { ...value, __stale: false };
}
export async function fetchCatalog(base, bearer, opts = {}) {
    const cached = catalogCache.get(bearer);
    if (opts.offline && cached)
        return { ...cached.value, stale: true };
    if (cached && Date.now() - cached.fetchedAt < CATALOG_TTL_MS) {
        return { ...cached.value, stale: false };
    }
    const headers = {};
    if (cached?.etag)
        headers['if-none-match'] = cached.etag;
    const { status, body, headers: resHeaders } = await request(base, '/api/mcp/tools', { bearer });
    if (status === 304 && cached) {
        catalogCache.set(bearer, { ...cached, fetchedAt: Date.now(), stale: false });
        return { ...cached.value, stale: false };
    }
    if (status !== 200) {
        if (cached)
            return { ...cached.value, stale: true }; // stale-while-error
        throw new ApiError(status, codeOf(body), messageOf(body));
    }
    const value = body;
    const etag = resHeaders.get('etag') ?? undefined;
    catalogCache.set(bearer, { value, etag, fetchedAt: Date.now(), stale: false });
    return { ...value, stale: false };
}
export function codeOf(body) {
    const e = body?.error?.code;
    return e ?? 'INTERNAL';
}
export function messageOf(body) {
    const e = body?.error?.message;
    return e ?? 'unspecified error';
}
