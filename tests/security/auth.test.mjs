import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import app from '../../src/worker/index.ts';
import { consumeAuthAttempt } from '../../src/worker/security.ts';
import { hashPassword, generateToken } from '../../src/worker/auth.ts';
function database() {
  const sql = new DatabaseSync(':memory:');
  sql.exec(readFileSync(new URL('../../migrations/0001_auth_attempts.sql', import.meta.url), 'utf8'));
  sql.exec('CREATE TABLE users(id TEXT, email TEXT, display_name TEXT, password_hash TEXT, created_at TEXT)');
  return { sql, prepare(query) { return { bind(...values) { return { async first() { return sql.prepare(query).get(...values) ?? null; }, async run() { return sql.prepare(query).run(...values); } }; } }; } };
}
const request = (path, body, env, headers = {}) => app.request('https://app.example' + path, { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(body) }, env);
test('D1 limiter counts concurrent attempts and expires its window', async () => {
  const db = database();
  const results = await Promise.all(Array.from({ length: 8 }, () => consumeAuthAttempt(db, 'account:test', 5, 1000)));
  assert.equal(results.filter(Boolean).length, 5);
  assert.equal(await consumeAuthAttempt(db, 'account:test', 5, 901000), true);
  assert.equal(db.sql.prepare('SELECT key FROM auth_attempts').get().key.includes('test'), false);
});
test('recovery disabled, registration requires 12 characters, attempts limited', async () => {
  const env = { DB: database(), JWT_SECRET: 'test-secret-for-tests-only' };
  assert.equal((await request('/api/auth/reset-password', {userId:'x', answer:'guess', newPassword:'long-password'}, env)).status, 403);
  assert.equal((await request('/api/auth/forgot-password', {email:'test@example.invalid'}, env)).status, 403);
  assert.equal((await request('/api/auth/register', {email:'new@example.invalid', password:'short', displayName:'Test'}, env)).status, 400);
  for (let i = 0; i < 5; i++) assert.equal((await request('/api/auth/login', {email:'missing@example.invalid', password:'wrong'}, env)).status, 401);
  const limited = await request('/api/auth/login', {email:'missing@example.invalid', password:'wrong'}, env);
  assert.equal(limited.status, 429);
  assert.equal(limited.headers.get('Retry-After'), '900');
});
test('malformed requests rejected and missing limiter fails closed', async () => {
  assert.equal((await request('/api/auth/login', {email:123}, {DB:database()})).status, 400);
  assert.equal((await request('/api/auth/login', {email:'x',password:'x'}, {DB:{}})).status, 503);
});
test('CORS permits app origin only', async () => {
  for (const origin of ['https://app.example', 'https://evil.example']) {
    const response = await app.request('https://app.example/api/health', {headers:{Origin:origin}});
    assert.equal(response.headers.get('Access-Control-Allow-Origin'), origin === 'https://app.example' ? origin : null);
    assert.equal(response.headers.get('Access-Control-Allow-Credentials'), null);
  }
});
test('password replacement invalidates an existing session', async () => {
  const db = database(); const secret = 'test-secret-for-tests-only';
  const hash = await hashPassword('a-long-test-password');
  const user = {id:'user1', email:'test@example.invalid',display_name:'Test',created_at:'2026-01-01'};
  db.sql.prepare('INSERT INTO users VALUES(?,?,?,?,?)').run(user.id,user.email,user.display_name,hash,user.created_at);
  const token = await generateToken(user,secret,hash);
  const get = () => app.request('https://app.example/api/auth/me', {headers:{Authorization:`Bearer ${token}`}}, {DB:db,JWT_SECRET:secret});
  assert.equal((await get()).status, 200);
  db.sql.prepare('UPDATE users SET password_hash = ?').run(await hashPassword('another-long-password'));
  assert.equal((await get()).status, 401);
});
