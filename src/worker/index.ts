import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { D1Database } from '@cloudflare/workers-types';

import {
  hashPassword,
  verifyPassword,
  generateToken,
  getUserFromRequest,
  generateId,
  type JWTPayload
} from './auth';

import {
  createUser,
  getUserByEmail,
  getUserById,
  getMission,
  upsertMission,
  getExpenses,
  createExpense,
  deleteExpense,
  updateExpense,
  updateUserPassword,
  setSecurityQuestion,
  getSecurityQuestion,
  verifySecurityAnswer
} from './db';

interface Env {
  DB: D1Database;
  JWT_SECRET: string;
  MINDEE_API_KEY: string;
}

interface Variables {
  user: JWTPayload | null;
}

const app = new Hono<{ Bindings: Env; Variables: Variables }>();

// CORS pour permettre les requêtes depuis le frontend
app.use('/api/*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  exposeHeaders: ['Content-Length'],
  maxAge: 86400,
  credentials: true
}));

// Middleware d'authentification pour les routes protégées
app.use('/api/*', async (c, next) => {
  // Routes publiques
  const publicRoutes = ['/api/auth/register', '/api/auth/login', '/api/auth/forgot-password', '/api/auth/reset-password', '/api/health'];
  if (publicRoutes.some(route => c.req.path === route)) {
    return next();
  }

  // Route semi-publique (auth optionnelle pour définir la question de sécurité)
  if (c.req.path === '/api/auth/security-question') {
    const user = await getUserFromRequest(c, c.env.JWT_SECRET);
    if (user) c.set('user', user);
    return next();
  }

  const user = await getUserFromRequest(c, c.env.JWT_SECRET);
  if (!user) {
    return c.json({ error: 'Non authentifié' }, 401);
  }

  c.set('user', user);
  return next();
});

// ==================== AUTH ====================

// Inscription
app.post('/api/auth/register', async (c) => {
  try {
    const { email, password, displayName } = await c.req.json<{
      email: string;
      password: string;
      displayName: string;
    }>();

    if (!email || !password || !displayName) {
      return c.json({ error: 'Email, mot de passe et nom requis' }, 400);
    }

    if (password.length < 6) {
      return c.json({ error: 'Le mot de passe doit faire au moins 6 caractères' }, 400);
    }

    // Vérifie si l'email existe déjà
    const existing = await getUserByEmail(c.env.DB, email);
    if (existing) {
      return c.json({ error: 'Cet email est déjà utilisé' }, 409);
    }

    const id = generateId();
    const passwordHash = await hashPassword(password);
    const user = await createUser(c.env.DB, id, email, passwordHash, displayName);
    const token = await generateToken(user, c.env.JWT_SECRET);

    return c.json({ user, token });
  } catch (error) {
    console.error('Register error:', error);
    return c.json({ error: 'Erreur lors de l\'inscription' }, 500);
  }
});

// Connexion
app.post('/api/auth/login', async (c) => {
  try {
    const { email, password } = await c.req.json<{
      email: string;
      password: string;
    }>();

    if (!email || !password) {
      return c.json({ error: 'Email et mot de passe requis' }, 400);
    }

    const user = await getUserByEmail(c.env.DB, email);
    if (!user) {
      return c.json({ error: 'Email ou mot de passe incorrect' }, 401);
    }

    const valid = await verifyPassword(password, user.password_hash);
    if (!valid) {
      return c.json({ error: 'Email ou mot de passe incorrect' }, 401);
    }

    const { password_hash, ...userWithoutPassword } = user;
    const token = await generateToken(userWithoutPassword, c.env.JWT_SECRET);

    return c.json({ user: userWithoutPassword, token });
  } catch (error) {
    console.error('Login error:', error);
    return c.json({ error: 'Erreur lors de la connexion' }, 500);
  }
});

// Infos utilisateur courant
app.get('/api/auth/me', async (c) => {
  const payload = c.get('user');
  if (!payload) {
    return c.json({ error: 'Non authentifié' }, 401);
  }

  const user = await getUserById(c.env.DB, payload.sub);
  if (!user) {
    return c.json({ error: 'Utilisateur non trouvé' }, 404);
  }

  return c.json({ user });
});

// Définir la question de sécurité
app.post('/api/auth/security-question', async (c) => {
  try {
    const user = c.get('user');
    if (!user) {
      return c.json({ error: 'Non authentifié' }, 401);
    }

    const { question, answer } = await c.req.json<{ question: string; answer: string }>();

    if (!question || !answer) {
      return c.json({ error: 'Question et réponse requises' }, 400);
    }

    const answerHash = await hashPassword(answer.toLowerCase().trim());
    await setSecurityQuestion(c.env.DB, user.sub, question, answerHash);

    return c.json({ success: true });
  } catch (error) {
    console.error('Security question error:', error);
    return c.json({ error: 'Erreur serveur' }, 500);
  }
});

// Récupérer la question de sécurité (pour reset)
app.post('/api/auth/forgot-password', async (c) => {
  try {
    const { email } = await c.req.json<{ email: string }>();

    if (!email) {
      return c.json({ error: 'Email requis' }, 400);
    }

    const data = await getSecurityQuestion(c.env.DB, email);

    if (!data) {
      return c.json({ error: 'Aucune question de sécurité configurée pour ce compte' }, 404);
    }

    return c.json({ userId: data.userId, question: data.question });
  } catch (error) {
    console.error('Forgot password error:', error);
    return c.json({ error: 'Erreur serveur' }, 500);
  }
});

// Réinitialiser le mot de passe avec la réponse secrète
app.post('/api/auth/reset-password', async (c) => {
  try {
    const { userId, answer, newPassword } = await c.req.json<{
      userId: string;
      answer: string;
      newPassword: string;
    }>();

    if (!userId || !answer || !newPassword) {
      return c.json({ error: 'Tous les champs sont requis' }, 400);
    }

    if (newPassword.length < 6) {
      return c.json({ error: 'Le mot de passe doit faire au moins 6 caractères' }, 400);
    }

    const storedHash = await verifySecurityAnswer(c.env.DB, userId);

    if (!storedHash) {
      return c.json({ error: 'Utilisateur non trouvé' }, 404);
    }

    const valid = await verifyPassword(answer.toLowerCase().trim(), storedHash);

    if (!valid) {
      return c.json({ error: 'Réponse incorrecte' }, 401);
    }

    const passwordHash = await hashPassword(newPassword);
    await updateUserPassword(c.env.DB, userId, passwordHash);

    return c.json({ success: true, message: 'Mot de passe réinitialisé avec succès' });
  } catch (error) {
    console.error('Reset password error:', error);
    return c.json({ error: 'Erreur serveur' }, 500);
  }
});

// ==================== MISSION ====================

// Récupérer la mission
app.get('/api/mission', async (c) => {
  const user = c.get('user')!;
  const mission = await getMission(c.env.DB, user.sub);

  return c.json({ mission: mission || { objet: '', periode: '' } });
});

// Mettre à jour la mission
app.put('/api/mission', async (c) => {
  const user = c.get('user')!;
  const { objet, periode } = await c.req.json<{
    objet?: string;
    periode?: string;
  }>();

  const mission = await upsertMission(c.env.DB, user.sub, objet || null, periode || null);

  return c.json({ mission });
});

// ==================== EXPENSES ====================

// Liste des dépenses
app.get('/api/expenses', async (c) => {
  const user = c.get('user')!;
  const expenses = await getExpenses(c.env.DB, user.sub);

  return c.json({ expenses });
});

// Créer une dépense
app.post('/api/expenses', async (c) => {
  try {
    const user = c.get('user')!;
    const body = await c.req.json<{
      date: string;
      time?: string;
      category: string;
      amount: number;
      description?: string;
      photo?: string; // base64 data URL
      module?: string; // Module 1, Module 2, etc.
    }>();

    if (!body.date || !body.category || typeof body.amount !== 'number') {
      return c.json({ error: 'Date, catégorie et montant requis' }, 400);
    }

    const id = generateId();

    // Récupère la mission courante
    const mission = await getMission(c.env.DB, user.sub);

    const expense = await createExpense(c.env.DB, {
      id,
      user_id: user.sub,
      mission_id: mission?.id || null,
      module: body.module || null,
      date: body.date,
      time: body.time || null,
      category: body.category,
      amount: body.amount,
      description: body.description || null,
      photo_data: body.photo || null
    });

    return c.json({ expense }, 201);
  } catch (error) {
    console.error('Create expense error:', error);
    return c.json({ error: 'Erreur lors de la création de la dépense' }, 500);
  }
});

// Modifier une dépense
app.put('/api/expenses/:id', async (c) => {
  try {
    const user = c.get('user')!;
    const id = c.req.param('id');
    const body = await c.req.json<{
      date?: string;
      time?: string;
      category?: string;
      amount?: number;
      description?: string;
      photo?: string;
      module?: string;
    }>();

    const updated = await updateExpense(c.env.DB, id, user.sub, {
      date: body.date,
      time: body.time,
      category: body.category,
      amount: body.amount,
      description: body.description,
      photo_data: body.photo,
      module: body.module
    });

    if (!updated) {
      return c.json({ error: 'Dépense non trouvée' }, 404);
    }

    return c.json({ expense: updated });
  } catch (error) {
    console.error('Update expense error:', error);
    return c.json({ error: 'Erreur lors de la modification' }, 500);
  }
});

// Supprimer une dépense
app.delete('/api/expenses/:id', async (c) => {
  const user = c.get('user')!;
  const id = c.req.param('id');

  const deleted = await deleteExpense(c.env.DB, id, user.sub);

  if (!deleted) {
    return c.json({ error: 'Dépense non trouvée' }, 404);
  }

  return c.json({ success: true });
});

// ==================== OCR MINDEE ====================

app.post('/api/ocr', async (c) => {
  try {
    const { image } = await c.req.json<{ image: string }>();

    if (!image) {
      return c.json({ error: 'Image requise' }, 400);
    }

    // Extract base64 data from data URL
    const base64Match = image.match(/^data:([^;]+);base64,(.+)$/);
    if (!base64Match) {
      return c.json({ error: 'Format image invalide' }, 400);
    }

    const base64Data = base64Match[2];
    const MODEL_ID = 'ac958a08-2d1b-4b43-8e25-6dc9354c5940'; // Receipt pre-built model

    // Step 1: Enqueue the extraction job (Mindee v2 API)
    const enqueueResponse = await fetch('https://api-v2.mindee.net/v2/products/extraction/enqueue', {
      method: 'POST',
      headers: {
        'Authorization': c.env.MINDEE_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model_id: MODEL_ID,
        file_base64: base64Data
      })
    });

    const enqueueText = await enqueueResponse.text();

    if (!enqueueResponse.ok) {
      console.error('Mindee enqueue error:', enqueueResponse.status, enqueueText);
      return c.json({
        error: `Mindee (${enqueueResponse.status}): ${enqueueText.slice(0, 300)}`
      }, 500);
    }

    let enqueueData;
    try {
      enqueueData = JSON.parse(enqueueText);
    } catch {
      return c.json({ error: 'Réponse invalide', debug: enqueueText.slice(0, 500) }, 500);
    }

    const jobId = enqueueData.job?.id || enqueueData.id;
    if (!jobId) {
      return c.json({ error: 'Pas de job_id', debug: enqueueData }, 500);
    }

    // Step 2: Poll for results (max 30 seconds)
    const maxAttempts = 15;
    const pollInterval = 2000;
    let result = null;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      await new Promise(resolve => setTimeout(resolve, pollInterval));

      const pollResponse = await fetch(`https://api-v2.mindee.net/v2/jobs/${jobId}`, {
        headers: { 'Authorization': c.env.MINDEE_API_KEY }
      });

      // Handle redirect (302) - job complete
      if (pollResponse.status === 302) {
        const redirectUrl = pollResponse.headers.get('Location');
        if (redirectUrl) {
          const docResponse = await fetch(redirectUrl, {
            headers: { 'Authorization': c.env.MINDEE_API_KEY }
          });
          result = await docResponse.json();
          break;
        }
      }

      const pollData = await pollResponse.json().catch(() => null);
      if (!pollData) continue;

      const status = pollData.job?.status || pollData.status;
      if (status === 'completed' || status === 'succeeded') {
        result = pollData;
        break;
      } else if (status === 'failed' || status === 'error') {
        return c.json({ error: 'Extraction échouée', debug: pollData }, 500);
      }
    }

    if (!result) {
      return c.json({ error: 'Timeout - traitement trop long', jobId }, 504);
    }

    // Step 3: Extract fields from result
    const inference = result.inference || result.document?.inference || {};
    const fields = inference.fields || inference.prediction || result.fields || {};

    const getValue = (field: any) => {
      if (!field) return null;
      if (typeof field === 'object' && 'value' in field) return field.value;
      if (typeof field === 'object' && 'content' in field) return field.content;
      return field;
    };

    const ocrResult = {
      supplierName: getValue(fields.supplier_name) || getValue(fields.merchant_name) || getValue(fields.store_name),
      date: getValue(fields.date) || getValue(fields.purchase_date),
      time: getValue(fields.time) || getValue(fields.purchase_time),
      totalAmount: getValue(fields.total_amount) || getValue(fields.total) || getValue(fields.total_incl),
      totalTax: getValue(fields.total_tax) || getValue(fields.taxes),
      currency: getValue(fields.currency) || getValue(fields.locale?.currency) || 'EUR',
      category: getValue(fields.category),
      subcategory: getValue(fields.subcategory),
      _debug: result
    };

    return c.json(ocrResult);
  } catch (error) {
    console.error('OCR error:', error);
    return c.json({ error: 'Erreur lors de l\'analyse OCR' }, 500);
  }
});

// Route de santé
app.get('/api/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Servir les fichiers statiques (index.html)
app.get('*', async (c) => {
  return c.notFound();
});

export default app;
