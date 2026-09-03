// Policy document skeletons — VOL-16 structure, rendered from one source and
// stamped with the policy version (G-36 discipline, foundation cut).

export interface PolicyDoc {
  id: 'terms' | 'privacy' | 'aup';
  title: string;
  version: string;
  sections: { heading: string; body: string }[];
}

export const POLICY_VERSION = '1 (effective 2026-09-03)';

export const POLICY_DOCS: PolicyDoc[] = [
  {
    id: 'terms',
    title: 'Terms of Service',
    version: POLICY_VERSION,
    sections: [
      {
        heading: '1. Who we are',
        body: 'JONTRIX is published by Fraziym Soft. One subscription unlocks the entire catalog of 247 tools; no tool is ever sold separately. Contact: support channel in the app and bot.',
      },
      {
        heading: '2. Accounts',
        body: 'One human per account. You are responsible for your tokens (personal access and agent tokens). Minimum age per applicable law.',
      },
      {
        heading: '3. The service',
        body: 'Features, quotas, and tiers are as rendered in-app at purchase. Catalog additions are routine; removals are announced in advance with the reason.',
      },
      {
        heading: '4. Payments',
        body: 'Telegram Stars and USDT rails. Crypto payments are final — no refunds, stated at checkout. Stars sales follow Telegram’s own subscription and refund mechanics. Nothing here removes rights that mandatory consumer law grants you.',
      },
      {
        heading: '5. Your data and AI training',
        body: 'Files processed in your browser never touch our servers unless you save them. We never train AI models on your data without your explicit, revocable, versioned permission — the default is No.',
      },
      {
        heading: '6. Liability',
        body: 'During beta stages the service is provided "as is". Liability is capped at the last 12 months of fees paid or $50, whichever is higher.',
      },
      {
        heading: '7. Governing law',
        body: 'The law of the publisher’s jurisdiction (Bangladesh) applies. Informal resolution first: contact support, 30-day good-faith window, before any formal forum.',
      },
    ],
  },
  {
    id: 'privacy',
    title: 'Privacy & Data',
    version: POLICY_VERSION,
    sections: [
      {
        heading: 'What exists and why',
        body: 'Account data (identity, tier, settings) is kept while the account lives. Usage metadata (tool, size, timing — never content) is kept for metering and abuse defense. Saved results, stored files, and presets exist only on explicit save and are retained per tier horizon, then deleted.',
      },
      {
        heading: 'Files stay in your browser',
        body: 'Client-side processing means the file never leaves your device. Server-side tools stream inputs and discard them with the request — the difference is labeled on every tool page.',
      },
      {
        heading: 'Consent and audit records',
        body: 'Your AI-training consent choice and its audit trail are kept to prove the promises. The default is No until you explicitly say yes, and you can change it anytime.',
      },
      {
        heading: 'Deletion and export',
        body: 'Account deletion (dashboard-only) tombstones the account and purges email, Telegram links, presets, results, and stored files within 24 hours. Self-service export of your data runs through your personal access token — portability is a first-class promise, not a support ticket.',
      },
    ],
  },
  {
    id: 'aup',
    title: 'Acceptable Use',
    version: POLICY_VERSION,
    sections: [
      {
        heading: 'One human, many tools — not many accounts',
        body: 'One account per person; seats follow the tier. Sybil farms, shared logins beyond seats, and quota-farm rotation are violations.',
      },
      {
        heading: 'Tokens are personal',
        body: 'Selling, renting, publishing, or sharing tokens is a violation. Rotate a leaked token promptly. We never ask for your tokens in chat — anyone who does is not us.',
      },
      {
        heading: 'No abuse of the free tier or boost',
        body: 'Automated mass-registration, ad fraud, scraping outside the documented contracts, and reselling JONTRIX output-as-a-service are prohibited.',
      },
      {
        heading: 'No illegal content or harm',
        body: 'Malware packing, targeted harassment material, and fraud kits are zero-tolerance: immediate suspension. Found vulnerabilities get thanks and credit; uncoordinated pentesting is not research.',
      },
      {
        heading: 'Enforcement',
        body: 'Graduated, documented, appealable: throttle, warning, capability suspension, account suspension with data handout, ban for zero-tolerance cases. Every limit response names its rule.',
      },
    ],
  },
];
