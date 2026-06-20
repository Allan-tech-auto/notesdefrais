-- Schéma de base de données pour Notes de Frais
-- Cloudflare D1 (SQLite)

-- Table des utilisateurs
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  display_name TEXT NOT NULL,
  security_question TEXT,
  security_answer TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Index pour les recherches par email
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Table des missions (informations contextuelles)
CREATE TABLE IF NOT EXISTS missions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  objet TEXT,
  periode TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Index pour les recherches par utilisateur
CREATE INDEX IF NOT EXISTS idx_missions_user ON missions(user_id);

-- Table des dépenses
CREATE TABLE IF NOT EXISTS expenses (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  mission_id TEXT,
  module TEXT,  -- Module 1, Module 2, etc.
  date TEXT NOT NULL,
  time TEXT,
  category TEXT NOT NULL,
  amount REAL NOT NULL,
  description TEXT,
  photo_data TEXT,  -- Image en base64
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (mission_id) REFERENCES missions(id) ON DELETE SET NULL
);

-- Index pour les recherches par utilisateur et par date
CREATE INDEX IF NOT EXISTS idx_expenses_user ON expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(user_id, date);

