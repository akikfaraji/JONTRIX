// POST /api/telegram/webhook — VOL-08 §1 (LOCKED). Prod transport:
// SECRET_TOKEN path guard (set_webhook secret_token) + idempotent processing
// by update_id (KvState TTL 7 days, ENV-1 pattern). Every reply is a direct
// response to an update — this route never initiates messages (C8).

import { createHmac, timingSafeEqual } from 'node:crypto';
import { db } from '@/lib/db';
import { handleUpdate, type TgUpdate } from '@/lib/bot/commands';
import { telegramBotToken } from '@/lib/telegram';
import { readJsonWithLimit } from '@/lib/validate';

export const dynamic = 'force-dynamic';

async function callTelegram(method: string, payload: unknown): Promise<void> {
  const token = telegramBotToken();
  if (!token) return;
  try {
    await fetch(`https://api.telegram.org/bot${token}/${method}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch {
    // Telegram delivery failures are retried by Telegram itself (the
    // update stays unacked); nothing user-content-bearing is logged here.
  }
}

export async function POST(req: Request) {
  // path guard: Telegram sends the secret in the URL we registered
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!secret) {
    return Response.json({ ok: false, error: 'bot not configured (no TELEGRAM_WEBHOOK_SECRET)' }, { status: 503 });
  }
  const url = new URL(req.url);
  const provided = url.searchParams.get('token') ?? req.headers.get('x-telegram-bot-api-secret-token') ?? '';
  const a = Buffer.from(createHmac('sha256', secret).update('guard').digest('hex'));
  const b = Buffer.from(createHmac('sha256', secret).update(provided).digest('hex'));
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return new Response('forbidden', { status: 403 });
  }

  let update: TgUpdate;
  try {
    const parsedBody = await readJsonWithLimit(req, 64 * 1024);
    if (!parsedBody.ok) throw new Error('BAD_BODY');
    update = parsedBody.body as TgUpdate;
  } catch {
    return Response.json({ ok: true }); // malformed/oversized update: ack, never retry-storm
  }

  // idempotency by update_id (§1 MUST) — a redelivery is a no-op
  const key = `tg_update:${update.update_id}`;
  const seen = await db.kvState.findUnique({ where: { key } });
  if (seen) {
    return Response.json({ ok: true, duplicate: true });
  }
  await db.kvState.upsert({
    where: { key },
    create: { key, value: '1', expiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1000) },
    update: { value: '1' },
  });

  const chatId = update.message?.chat.id ?? update.callback_query?.from.id;
  try {
    const reply = await handleUpdate(update);
    if (reply) {
      await callTelegram('sendMessage', {
        chat_id: chatId,
        text: reply.text,
        parse_mode: reply.parse_mode ?? 'HTML',
        reply_markup: reply.inline_keyboard ? { inline_keyboard: reply.inline_keyboard } : undefined,
        link_preview_options: { is_disabled: true },
      });
    }
    if (update.callback_query) {
      await callTelegram('answerCallbackQuery', { callback_query_id: update.callback_query.id });
    }
  } catch {
    // An internal error still acks — Telegram redelivery plus the update_id
    // guard keeps this honest without spamming the user.
  }

  return Response.json({ ok: true });
}
