import type { D1Database } from '@cloudflare/workers-types';
import type { User } from './auth';

export interface Mission {
  id: string;
  user_id: string;
  objet: string | null;
  periode: string | null;
  created_at: string;
  updated_at: string;
}

export interface Expense {
  id: string;
  user_id: string;
  mission_id: string | null;
  module: string | null;  // Module 1, Module 2, etc.
  date: string;
  time: string | null;
  category: string;
  amount: number;
  description: string | null;
  photo_data: string | null;  // Base64 image data
  created_at: string;
}

// ==================== USERS ====================

export async function createUser(
  db: D1Database,
  id: string,
  email: string,
  passwordHash: string,
  displayName: string
): Promise<User> {
  const result = await db
    .prepare(
      'INSERT INTO users (id, email, password_hash, display_name) VALUES (?, ?, ?, ?) RETURNING id, email, display_name, created_at'
    )
    .bind(id, email.toLowerCase(), passwordHash, displayName)
    .first<User>();

  if (!result) {
    throw new Error('Failed to create user');
  }
  return result;
}

export async function getUserByEmail(db: D1Database, email: string): Promise<(User & { password_hash: string }) | null> {
  return db
    .prepare('SELECT id, email, password_hash, display_name, created_at FROM users WHERE email = ?')
    .bind(email.toLowerCase())
    .first<User & { password_hash: string }>();
}

export async function getUserById(db: D1Database, id: string): Promise<User | null> {
  return db
    .prepare('SELECT id, email, display_name, created_at FROM users WHERE id = ?')
    .bind(id)
    .first<User>();
}

// ==================== MISSIONS ====================

export async function getMission(db: D1Database, userId: string): Promise<Mission | null> {
  return db
    .prepare('SELECT * FROM missions WHERE user_id = ? ORDER BY created_at DESC LIMIT 1')
    .bind(userId)
    .first<Mission>();
}

export async function upsertMission(
  db: D1Database,
  userId: string,
  objet: string | null,
  periode: string | null
): Promise<Mission> {
  const existing = await getMission(db, userId);

  if (existing) {
    await db
      .prepare('UPDATE missions SET objet = ?, periode = ?, updated_at = datetime(\'now\') WHERE id = ?')
      .bind(objet, periode, existing.id)
      .run();
    return { ...existing, objet, periode, updated_at: new Date().toISOString() };
  } else {
    const id = crypto.randomUUID();
    await db
      .prepare('INSERT INTO missions (id, user_id, objet, periode) VALUES (?, ?, ?, ?)')
      .bind(id, userId, objet, periode)
      .run();
    return {
      id,
      user_id: userId,
      objet,
      periode,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }
}

// ==================== EXPENSES ====================

export async function getExpenses(db: D1Database, userId: string): Promise<Expense[]> {
  const result = await db
    .prepare('SELECT * FROM expenses WHERE user_id = ? ORDER BY date ASC, time ASC')
    .bind(userId)
    .all<Expense>();

  return result.results || [];
}

export async function getExpenseById(db: D1Database, id: string, userId: string): Promise<Expense | null> {
  return db
    .prepare('SELECT * FROM expenses WHERE id = ? AND user_id = ?')
    .bind(id, userId)
    .first<Expense>();
}

export async function createExpense(
  db: D1Database,
  expense: Omit<Expense, 'created_at'>
): Promise<Expense> {
  await db
    .prepare(
      'INSERT INTO expenses (id, user_id, mission_id, module, date, time, category, amount, description, photo_data) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    )
    .bind(
      expense.id,
      expense.user_id,
      expense.mission_id,
      expense.module,
      expense.date,
      expense.time,
      expense.category,
      expense.amount,
      expense.description,
      expense.photo_data
    )
    .run();

  return {
    ...expense,
    created_at: new Date().toISOString()
  };
}

export async function deleteExpense(db: D1Database, id: string, userId: string): Promise<boolean> {
  const expense = await getExpenseById(db, id, userId);
  if (!expense) return false;

  await db
    .prepare('DELETE FROM expenses WHERE id = ? AND user_id = ?')
    .bind(id, userId)
    .run();

  return true;
}

export async function updateExpense(
  db: D1Database,
  id: string,
  userId: string,
  updates: Partial<Omit<Expense, 'id' | 'user_id' | 'created_at'>>
): Promise<Expense | null> {
  const existing = await getExpenseById(db, id, userId);
  if (!existing) return null;

  const updated = { ...existing, ...updates };

  await db
    .prepare(
      'UPDATE expenses SET module = ?, date = ?, time = ?, category = ?, amount = ?, description = ?, photo_data = ? WHERE id = ? AND user_id = ?'
    )
    .bind(
      updated.module,
      updated.date,
      updated.time,
      updated.category,
      updated.amount,
      updated.description,
      updated.photo_data,
      id,
      userId
    )
    .run();

  return updated;
}

// ==================== PASSWORD RESET ====================

export async function updateUserPassword(db: D1Database, userId: string, passwordHash: string): Promise<void> {
  await db
    .prepare('UPDATE users SET password_hash = ? WHERE id = ?')
    .bind(passwordHash, userId)
    .run();
}

export async function setSecurityQuestion(
  db: D1Database,
  userId: string,
  question: string,
  answerHash: string
): Promise<void> {
  await db
    .prepare('UPDATE users SET security_question = ?, security_answer = ? WHERE id = ?')
    .bind(question, answerHash, userId)
    .run();
}

export async function getSecurityQuestion(db: D1Database, email: string): Promise<{ userId: string; question: string } | null> {
  const user = await db
    .prepare('SELECT id, security_question FROM users WHERE email = ?')
    .bind(email.toLowerCase())
    .first<{ id: string; security_question: string | null }>();

  if (!user || !user.security_question) return null;
  return { userId: user.id, question: user.security_question };
}

export async function verifySecurityAnswer(db: D1Database, userId: string): Promise<string | null> {
  const user = await db
    .prepare('SELECT security_answer FROM users WHERE id = ?')
    .bind(userId)
    .first<{ security_answer: string | null }>();

  return user?.security_answer || null;
}
