// Shared input validation for auth surfaces — one strict email shape,
// string-type guards that never crash on JSON type confusion.
// Pragmatic RFC-5322 subset: blocks control chars (incl. NUL), spaces,
// double @, oversized locals/domains. Length cap follows RFC 5321 (254).

export const EMAIL_RE = /^[A-Za-z0-9._%+-]{1,64}@[A-Za-z0-9.-]{1,191}\.[A-Za-z]{2,24}$/;

export function isEmail(value: unknown): value is string {
  return typeof value === 'string' && value.length <= 254 && EMAIL_RE.test(value);
}

/** Request-body size guard — rejects payloads above `max` bytes with 413. */
export async function readJsonWithLimit(
  req: Request,
  max: number,
): Promise<{ ok: true; body: unknown } | { ok: false; tooLarge: boolean }> {
  const len = Number(req.headers.get('content-length') ?? '0');
  if (len > max) return { ok: false, tooLarge: true };
  const text = await req.text();
  if (Buffer.byteLength(text, 'utf8') > max) return { ok: false, tooLarge: true };
  try {
    return { ok: true, body: JSON.parse(text) as unknown };
  } catch {
    return { ok: false, tooLarge: false };
  }
}
