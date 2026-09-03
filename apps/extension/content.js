// JONTRIX extension content script — VOL-09 §2/§3 (LOCKED).
// Selection capture + shadow-DOM result overlay only. It never scrapes
// without a selection, never auto-runs on page load, never shows a promo.
// The overlay carries the same honest 402/429 copy as the PWA (§3).

(() => {
  const OVERLAY_ID = 'jontrix-overlay-host';

  function ensureHost() {
    let host = document.getElementById(OVERLAY_ID);
    if (!host) {
      host = document.createElement('div');
      host.id = OVERLAY_ID;
      document.body.appendChild(host);
    }
    return host;
  }

  function showOverlay(html) {
    const host = ensureHost();
    const shadow = host.shadowRoot || host.attachShadow({ mode: 'open' });
    shadow.innerHTML = `
      <style>
        .card {
          position: fixed; top: 16px; right: 16px; z-index: 2147483647;
          max-width: 420px; max-height: 60vh; overflow: auto;
          background: #ffffff; color: #1a1a1a; border: 1px solid #d4d4d4;
          border-radius: 8px; padding: 14px; font: 13px/1.5 system-ui, sans-serif;
          box-shadow: 0 4px 16px rgba(0,0,0,.12);
        }
        @media (prefers-color-scheme: dark) {
          .card { background: #171717; color: #ededed; border-color: #333; }
        }
        .title { font-weight: 600; margin: 0 0 6px; display: flex; gap: 8px; align-items: center; }
        .badge { font-size: 11px; border: 1px solid currentColor; border-radius: 4px; padding: 0 5px; }
        .muted { color: #737373; margin: 4px 0 0; font-size: 12px; }
        pre { white-space: pre-wrap; overflow-wrap: anywhere; margin: 8px 0 0; font-size: 12px; }
        button { margin-top: 10px; margin-right: 6px; font: inherit; padding: 4px 10px; cursor: pointer; }
      </style>
      <div class="card" role="dialog" aria-label="JONTRIX result">${html}</div>`;
    shadow.querySelector('.close').addEventListener('click', () => host.remove());
    shadow.querySelector('.copy').addEventListener('click', (e) => {
      const text = shadow.querySelector('pre')?.textContent ?? '';
      navigator.clipboard?.writeText(text);
      e.target.textContent = 'Copied';
    });
  }

  function card(title, badge, body, note) {
    return `
      <p class="title">${title} <span class="badge">${badge}</span></p>
      ${body}
      ${note ? `<p class="muted">${note}</p>` : ''}
      <button class="copy">Copy</button>
      <button class="close">Close</button>`;
  }

  chrome.runtime.onMessage.addListener((msg) => {
    switch (msg?.type) {
      case 'jontrix:result': {
        showOverlay(
          card(
            msg.tool?.title ?? 'Result',
            msg.tool?.tier_fit ?? '',
            `<pre>${JSON.stringify(msg.result?.data, null, 2).slice(0, 4000)}</pre>`,
            `${msg.usage?.ms ?? '?'} ms`,
          ),
        );
        break;
      }
      case 'jontrix:cap': {
        // Same honest copy as the PWA: cap + reset time, no retry loop (T9.2)
        showOverlay(
          card('Daily cap reached', msg.code ?? '402', `<p>${msg.message ?? ''}</p>`, msg.resets_at ? `resets ${new Date(msg.resets_at).toUTCString()}` : undefined),
        );
        break;
      }
      case 'jontrix:error': {
        showOverlay(card('Run failed', msg.code ?? '', `<p>${msg.message ?? ''}</p>`));
        break;
      }
      case 'jontrix:needlogin': {
        showOverlay(card('Sign in required', '', `<p><a href="${msg.url}" target="_blank">Open JONTRIX and sign in</a> — no token is stored here; the extension reuses your browser session (T9.3).</p>`));
        break;
      }
      case 'jontrix:deeplink': {
        // Client-side tools run in the PWA — the extension never bundles
        // client engines (T9.4, one-runtime rule).
        window.open(msg.url, '_blank');
        break;
      }
      default:
        break;
    }
  });
})();
