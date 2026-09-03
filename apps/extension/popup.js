// JONTRIX extension popup — VOL-09 §3 (LOCKED): quota chip (base/boost/
// effective + reset), catalog search with deep links, quick-run of the
// last-used tool (local, device-only history). No ads, no telemetry (C8).

const API_BASE = 'http://localhost:3000';

function renderQuota(q) {
  const tier = document.getElementById('tier');
  const quota = document.getElementById('quota');
  if (!q) {
    tier.textContent = 'signed out';
    quota.textContent = 'Sign in from the app — the extension uses your browser session, never a token (T9.3).';
    return;
  }
  const srv = q.server_calls;
  tier.textContent = q.tier ?? 'free';
  quota.textContent = `${srv.remaining} of ${srv.effective} server calls left (base ${srv.base}${srv.boost ? ` + boost ${srv.boost}` : ''}) · resets ${new Date(srv.resets_at).toISOString().slice(11, 16)} UTC`;
}

function renderTools(items) {
  const ul = document.getElementById('results');
  ul.textContent = '';
  for (const t of items) {
    const li = document.createElement('li');
    const main = document.createElement('span');
    main.textContent = t.title;
    const sub = document.createElement('small');
    sub.textContent = `${t.pattern} · ${t.context === 'client' ? 'in-browser (opens app)' : 'server-side'}`;
    li.append(main, sub);
    li.addEventListener('click', () => {
      if (t.context === 'client') {
        chrome.tabs.create({ url: `${API_BASE}/?view=tools` });
        return;
      }
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.runtime.sendMessage({ type: 'jontrix:run', toolId: t.id, args: { text: '' }, tab: tabs[0] });
      });
      const last = JSON.parse(localStorage.getItem('jontrix_last') ?? 'null');
      if (!last) {
        localStorage.setItem('jontrix_last', JSON.stringify(t));
      }
    });
    ul.appendChild(li);
  }
}

chrome.runtime.sendMessage({ type: 'jontrix:getQuota' }, (res) => {
  renderQuota(res?.quota ?? null);
});

document.getElementById('q').addEventListener('input', (e) => {
  const q = e.target.value.trim();
  chrome.runtime.sendMessage({ type: 'jontrix:search', q }, (body) => {
    if (body?.ok) renderTools(body.data.items);
  });
});

const last = JSON.parse(localStorage.getItem('jontrix_last') ?? 'null');
if (last) {
  document.getElementById('last').textContent = `Last used: ${last.title}`;
}
