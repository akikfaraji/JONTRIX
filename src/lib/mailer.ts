// Transactional mail — real SMTP delivery via nodemailer (the mature
// open-source MTA client). Any free-tier SMTP works: Gmail app-password,
// Resend SMTP, Brevo, Mailgun, or a self-hosted Postfix. $0 at dev scale.
//
// Drivers:
//   smtp — SMTP_HOST/SMTP_PORT/SMTP_USER/SMTP_PASS set → real delivery.
//   log  — no SMTP configured → the mail body lands in the server log and
//          the call reports driver:'log'. Honest fallback, never a fake
//          success: every caller surfaces which driver ran.
//
// Templates are neutral text+HTML (no emoji, no gradients) per the design
// constraints. All sends are fire-and-safe: a mail failure must never take
// an auth flow down — callers receive { delivered:false, error } and decide.

import nodemailer, { type Transporter } from 'nodemailer';

export type MailDriver = 'smtp' | 'log';

export interface MailMessage {
  to: string;
  subject: string;
  text: string;
  html: string;
}

export interface MailResult {
  driver: MailDriver;
  delivered: boolean;
  error?: string;
}

let cached: Transporter | null = null;

function smtpConfigured(): boolean {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_PORT);
}

function transporter(): Transporter {
  if (!cached) {
    cached = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT ?? 587),
      secure: process.env.SMTP_SECURE === 'true' || Number(process.env.SMTP_PORT) === 465,
      auth:
        process.env.SMTP_USER && process.env.SMTP_PASS
          ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
          : undefined,
    });
  }
  return cached;
}

function fromAddress(): string {
  return process.env.SMTP_FROM ?? 'JONTRIX <no-reply@jontrix.local>';
}

export async function sendMail(msg: MailMessage): Promise<MailResult> {
  if (!smtpConfigured()) {
    console.log(
      `[mail:log] to=${msg.to} subject="${msg.subject}"\n${msg.text}`,
    );
    return { driver: 'log', delivered: false };
  }
  try {
    await transporter().sendMail({
      from: fromAddress(),
      to: msg.to,
      subject: msg.subject,
      text: msg.text,
      html: msg.html,
    });
    return { driver: 'smtp', delivered: true };
  } catch (err) {
    const error = err instanceof Error ? err.message : 'smtp failure';
    console.error(`[mail] send failed: ${error}`);
    return { driver: 'smtp', delivered: false, error };
  }
}

// ── shared shell ─────────────────────────────────────────────────────────────

function shell(title: string, bodyHtml: string): string {
  return `<!doctype html>
<html><body style="margin:0;background:#f6f6f6;font-family:Helvetica,Arial,sans-serif;color:#1a1a1a;">
  <div style="max-width:520px;margin:0 auto;padding:32px 24px;">
    <p style="font-size:15px;font-weight:700;letter-spacing:0.08em;margin:0 0 24px;">JONTRIX</p>
    <div style="background:#ffffff;border:1px solid #e4e4e4;border-radius:8px;padding:28px;">
      <h1 style="font-size:18px;margin:0 0 16px;">${title}</h1>
      ${bodyHtml}
    </div>
    <p style="font-size:12px;color:#8a8a8a;margin:16px 0 0;">
      You received this message because of activity on your JONTRIX account.
      If this was not you, ignore this email — your account is untouched.
    </p>
  </div>
</body></html>`;
}

export function codeEmail(code: string): { subject: string; text: string; html: string } {
  return {
    subject: 'Your JONTRIX sign-in code',
    text: `Your verification code is ${code}\n\nIt expires in 10 minutes. If you did not request it, ignore this email.`,
    html: shell(
      'Sign-in code',
      `<p style="font-size:14px;line-height:1.6;margin:0 0 16px;">Use this code to finish signing in. It expires in 10 minutes.</p>
       <p style="font-size:30px;font-weight:700;letter-spacing:0.3em;margin:0 0 16px;">${code}</p>
       <p style="font-size:13px;color:#666666;margin:0;">Never share this code — JONTRIX staff will never ask for it.</p>`,
    ),
  };
}

export function verifyEmailEmail(link: string): { subject: string; text: string; html: string } {
  return {
    subject: 'Verify your JONTRIX email address',
    text: `Confirm your email address: ${link}\n\nThe link is valid for 24 hours. If you did not create an account, ignore this email.`,
    html: shell(
      'Verify your email address',
      `<p style="font-size:14px;line-height:1.6;margin:0 0 20px;">Welcome to JONTRIX. Confirm this address to finish setting up your account.</p>
       <p style="margin:0 0 12px;"><a href="${link}" style="display:inline-block;background:#1a1a1a;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:10px 22px;border-radius:6px;">Verify email address</a></p>
       <p style="font-size:12px;color:#666666;margin:0;">Or paste this link into your browser:<br>${link}</p>`,
    ),
  };
}

export function welcomeEmail(handle: string): { subject: string; text: string; html: string } {
  return {
    subject: 'Welcome to JONTRIX',
    text: `Your account ${handle} is ready. 247 tools are in the catalog — the built ones run right now in your browser or on our server.`,
    html: shell(
      'Your account is ready',
      `<p style="font-size:14px;line-height:1.6;margin:0 0 12px;">Welcome, ${handle}. Your JONTRIX account is active.</p>
       <p style="font-size:14px;line-height:1.6;margin:0;">The catalog carries 247 tools; every one marked <strong>ready</strong> runs immediately — in your browser or on our server. The rest are labelled planned and appear the moment their engines ship.</p>`,
    ),
  };
}

export function passwordResetEmail(link: string): { subject: string; text: string; html: string } {
  return {
    subject: 'Reset your JONTRIX password',
    text: `Reset your password: ${link}\n\nThe link is valid for 1 hour and can be used once. If you did not request a reset, ignore this email — your password stays unchanged.`,
    html: shell(
      'Reset your password',
      `<p style="font-size:14px;line-height:1.6;margin:0 0 20px;">A password reset was requested for your account. This link works once and expires in 1 hour.</p>
       <p style="margin:0 0 12px;"><a href="${link}" style="display:inline-block;background:#1a1a1a;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:10px 22px;border-radius:6px;">Choose a new password</a></p>
       <p style="font-size:12px;color:#666666;margin:0;">Or paste this link into your browser:<br>${link}</p>`,
    ),
  };
}

export function passwordChangedEmail(): { subject: string; text: string; html: string } {
  return {
    subject: 'Your JONTRIX password was changed',
    text: 'Your password was just changed. If this was not you, reset your password immediately and contact support.',
    html: shell(
      'Password changed',
      `<p style="font-size:14px;line-height:1.6;margin:0;">Your password was just changed and all other sessions were signed out. If this was not you, reset your password immediately.</p>`,
    ),
  };
}

export function newSignInEmail(ip: string | null, agent: string | null): {
  subject: string;
  text: string;
  html: string;
} {
  const device = agent ? agent.slice(0, 120) : 'an unknown device';
  const where = ip ? ` from ${ip}` : '';
  return {
    subject: 'New sign-in to your JONTRIX account',
    text: `A new session was started for your account${where} on ${device}. If this was not you, sign out everywhere from your dashboard and change your password.`,
    html: shell(
      'New sign-in',
      `<p style="font-size:14px;line-height:1.6;margin:0 0 12px;">A new session was just started for your account.</p>
       <p style="font-size:13px;color:#555555;line-height:1.6;margin:0 0 12px;">Device: ${device}<br>IP: ${ip ?? 'unknown'}<br>Time: ${new Date().toISOString().replace('T', ' ').slice(0, 16)} UTC</p>
       <p style="font-size:14px;line-height:1.6;margin:0;">If this was not you, open your dashboard and use "Sign out everywhere else", then change your password.</p>`,
    ),
  };
}

export function accountDeletedEmail(): { subject: string; text: string; html: string } {
  return {
    subject: 'Your JONTRIX account was deleted',
    text: 'Your account was just deleted. Personal data was removed and all sessions and tokens were revoked. This is the last message you will receive from us.',
    html: shell(
      'Account deleted',
      `<p style="font-size:14px;line-height:1.6;margin:0;">Your account was just deleted: personal data was removed, sessions and tokens were revoked. This is the last message you will receive from JONTRIX.</p>`,
    ),
  };
}
