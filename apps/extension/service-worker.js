// JONTRIX extension service worker — VOL-09 §2/§3/§4 (LOCKED).
// All API calls live here with the SAME session cookie as the PWA
// (credentials: include; no token kind is stored, T9.3). Quota cache honors
// envelope version bumps within 60 s. No grace invention — the honesty rule
// of VOL-10 §7 applies verbatim. Zero telemetry (C8).

const API_BASE = self.API_BASE || 'http://localhost:3000';
const QUOTA_TTL_MS = 60_000;
const PINNED_FALLBACK = [
  'jont_j246_natural-language-to-cron',
  'jont_j007_json-repair',
  'jont_j224_jwt-decoder-verifier',
  'jont_j211_ai-slop-text-linter',
  'jont_j048_ai-text-de-slopper',
  'jont_j236_changelog-generator-from-git-log',
  'jont_j193_mcp-server-config-validator',
  'jont_j113_citation-formatter',
  'jont_j009_exam-question-bank-builder',
  'jont_j203_sql-query-explainer',
];

let quotaCache = null; // { value, version, fetchedAt }
let catalogCache = null; // { tools, fetchedAt }

async function api(path, opts = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...opts,
    credentials: 'include',
    headers: { 'content-type': 'application/json', ...(opts.headers ?? {}) },
  });
  let body = null;
  try {
    body = await res.json();
  } catch {
    body = { ok: false, error: { code: 'BAD_RESPONSE' } };
  }
  return { status: res.status, body };
}

async function getQuota(force = false) {
  if (!force && quotaCache && Date.now() - quotaCache.fetchedAt < QUOTA_TTL_MS) {
    return quotaCache.value;
  }
  const { body } = await api('/api/quota');
  if (body?.ok) {
    quotaCache = { value: body.data, version: body.meta?.version, fetchedAt: Date.now() };
    return body.data;
  }
  return null; // logged out or unreachable — honest null, never invented
}

async function getServerTools() {
  if (catalogCache && Date.now() - catalogCache.fetchedAt < 3_600_000) {
    return catalogCache.tools;
  }
  const { body } = await api('/api/jonts?context=server&sort=score&limit=50');
  if (!body?.ok) return [];
  const tools = body.data.items.filter((t) => t.status === 'built');
  catalogCache = { tools, fetchedAt: Date.now() };
  return tools;
}

// ── context menu: 10 pinned quick tools + "More…" (§3) ─────────────────────

async function rebuildMenus() {
  await chrome.contextMenus.removeAll();
  chrome.contextMenus.create({
    id: 'jontrix-root',
    title: 'JONTRIX',
    contexts: ['selection'],
  });
  const tools = (await getServerTools()).slice(0, 10);
  const pinned = tools.length > 0 ? tools : PINNED_FALLBACK.map((id) => ({ id, title: id }));
  for (const t of pinned) {
    chrome.contextMenus.create({
      id: `run:${t.id}`,
      parentId: 'jontrix-root',
      title: t.title ?? t.id,
      contexts: ['selection'],
    });
  }
  chrome.contextMenus.create({
    id: 'more',
    parentId: 'jontrix-root',
    title: 'More JONTRIX tools…',
    contexts: ['selection'],
  });
}

chrome.runtime.onInstalled.addListener(() => {
  rebuildMenus();
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'more') {
    chrome.tabs.sendMessage(tab.id, { type: 'jontrix:more' });
    return;
  }
  if (!String(info.menuItemId).startsWith('run:')) return;
  const toolId = String(info.menuItemId).slice(4);
  const selection = (info.selectionText ?? '').slice(0, 8000);
  await runTool(toolId, { text: selection }, tab);
});

// ── run routing: server tools execute here; client tools deep-link (T9.4) ──

async function runTool(toolId, args, tab) {
  const { body } = await api(`/api/jonts/${toolId}`);
  const jont = body?.data?.jont;
  if (jont && jont.context === 'client') {
    chrome.tabs.sendMessage(tab.id, {
      type: 'jontrix:deeplink',
      url: `${API_BASE}/?view=tools&tool=${toolId}`,
    });
    return;
  }

  const { status, body: runBody } = await api(`/api/jonts/${toolId}/run`, {
    method: 'POST',
    body: JSON.stringify({ arguments: args }),
  });

  if (status === 401) {
    chrome.tabs.sendMessage(tab.id, {
      type: 'jontrix:needlogin',
      url: `${API_BASE}/?view=dashboard`,
    });
    return;
  }

  const payload =
    status === 200
      ? { type: 'jontrix:result', tool: jont ?? { title: toolId }, result: runBody.result, usage: runBody.usage }
      : status === 402
        ? { type: 'jontrix:cap', code: runBody?.error?.code, message: runBody?.error?.message, resets_at: runBody?.error?.resets_at }
        : status === 429
          ? { type: 'jontrix:cap', code: 'RATE_LIMITED', message: runBody?.error?.message }
          : { type: 'jontrix:error', code: runBody?.error?.code ?? 'ERROR', message: runBody?.error?.message ?? 'the run failed' };

  chrome.tabs.sendMessage(tab.id, payload);
  void getQuota(true); // refresh cache for the popup chip
}

// ── messages from popup/content ────────────────────────────────────────────

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.type === 'jontrix:getQuota') {
    getQuota().then((q) => sendResponse({ quota: q, conservative: self.__brake === 'conservative', readOnly: self.__brake === 'read-only' }));
    return true;
  }
  if (msg?.type === 'jontrix:run') {
    runTool(msg.toolId, msg.args ?? {}, msg.tab ?? { id: undefined });
    sendResponse({ started: true });
    return true;
  }
  if (msg?.type === 'jontrix:search') {
    api(`/api/jonts?q=${encodeURIComponent(msg.q ?? '')}&sort=score&limit=8`).then(({ body }) => sendResponse(body));
    return true;
  }
  return false;
});

// Brake modes (§4): conservative halves polling; read-only queues nothing
// and says so. The platform's mode.brake signal drives these.
chrome.storage.onChanged.addListener((changes) => {
  if (changes.jontrix_brake) {
    self.__brake = changes.jontrix_brake.newValue ?? 'normal';
  }
});
