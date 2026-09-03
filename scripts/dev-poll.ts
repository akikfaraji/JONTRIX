// Dev long-poll runner — VOL-08 §1: "Long-polling in dev, webhook in prod".
// Feeds getUpdates updates through the same handleUpdate pipeline the
// webhook uses, so dev and prod share one command implementation.

import { handleUpdate, type TgUpdate } from '../src/lib/bot/commands';

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
if (!TOKEN || !TOKEN.includes(':')) {
  console.error('dev-poll: TELEGRAM_BOT_TOKEN not set — the bot transport is not configured (honest state, VOL-08 §1).');
  console.error('dev-poll: command logic itself is exercised by scripts/test-bot.ts against handleUpdate directly.');
  process.exit(2);
}

async function callTelegram(method: string, payload: unknown): Promise<unknown> {
  const res = await fetch(`https://api.telegram.org/bot${TOKEN}/${method}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return res.json();
}

async function main(): Promise<never> {
  console.log('dev-poll: long polling started (Ctrl-C to stop)');
  let offset = 0;
  for (;;) {
    try {
      const res = (await callTelegram('getUpdates', { offset, timeout: 30 })) as {
        ok?: boolean;
        result?: TgUpdate[];
      };
      for (const update of res.result ?? []) {
        offset = update.update_id + 1;
        const chatId = update.message?.chat.id ?? update.callback_query?.from.id;
        const reply = await handleUpdate(update);
        if (reply && chatId !== undefined) {
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
      }
    } catch (e) {
      console.error(`dev-poll: ${(e as Error).message} — retrying in 5 s`);
      await new Promise((r) => setTimeout(r, 5000));
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(6);
});
