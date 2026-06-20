// Script temporaire pour générer un hash de mot de passe
const crypto = require('crypto');

async function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const derivedKey = crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256');
  const combined = Buffer.concat([salt, derivedKey]);
  return combined.toString('base64');
}

async function main() {
  const newPassword = 'Temp123!';  // Mot de passe temporaire
  const hash = await hashPassword(newPassword);

  console.log('\n=== RESET MOT DE PASSE ===');
  console.log('Nouveau mot de passe temporaire:', newPassword);
  console.log('\nExécutez cette commande:\n');
  console.log(`npx wrangler d1 execute notedefrais-db --remote --command="UPDATE users SET password_hash='${hash}' WHERE email='allan.banas1@gmail.com';"`);
  console.log('\nPuis connectez-vous avec le mot de passe:', newPassword);
  console.log('Et changez-le ensuite si vous voulez.\n');
}

main();
