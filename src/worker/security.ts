import type { D1Database } from '@cloudflare/workers-types';

export async function consumeAuthAttempt(db: D1Database, identity: string, limit: number, now = Date.now()): Promise<boolean> {
  // No raw email or IP is persisted. One atomic UPSERT prevents concurrent bypass.
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(identity));
  const key = Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, '0')).join('');
  const window = Math.floor(now / 900000);
  const row = await db.prepare(`INSERT INTO auth_attempts (key, window, attempts) VALUES (?, ?, 1)
    ON CONFLICT(key) DO UPDATE SET
      attempts = CASE WHEN window = excluded.window THEN attempts + 1 ELSE 1 END,
      window = excluded.window RETURNING attempts`).bind(key, window).first<{ attempts: number }>();
  await db.prepare('DELETE FROM auth_attempts WHERE window < ?').bind(window - 1).run();
  return !!row && row.attempts <= limit;
}
