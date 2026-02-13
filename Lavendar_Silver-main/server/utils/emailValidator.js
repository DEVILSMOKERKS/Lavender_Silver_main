const validator = require('validator');
const disposableDomains = require('disposable-email-domains');

// 🔁 Convert to Set for fast lookup
const disposableSet = new Set(disposableDomains);

// ✅ Whitelisted public domains (optional use)
const allowedPublicDomains = new Set([
  'gmail.com',
  'yahoo.com',
  'outlook.com',
  'hotmail.com',
  'icloud.com',
  'rediffmail.com'
]);

/**
 * Extract domain from email
 */
function getDomain(email) {
  return email.split('@')[1]?.toLowerCase();
}

/**
 * Check if email is from a disposable domain
 */
function isDisposableEmail(email) {
  return disposableSet.has(getDomain(email));
}

/**
 * Check if username is gibberish
 */
function isGibberishEmail(email) {
  const username = email.split('@')[0];

  // Too short
  if (username.length < 4) return true;

  // Repeated characters (aaaaa, zzzzz, etc.)
  if (/([a-zA-Z0-9])\1{3,}/.test(username)) return true;

  // No vowels (aeiou) — likely gibberish
  if (!/[aeiou]/i.test(username)) return true;

  // Random junk patterns
  if (/^[a-z]{6,}$/.test(username) && !/[a-z]{2,}/i.test(username)) return true;

  return false;
}

/**
 * Check if email is from allowed public domains (if enforced)
 */
function isAllowedPublicDomain(email) {
  return allowedPublicDomains.has(getDomain(email));
}

/**
 * Master validator function
 */
function validateEmail(email, options = { allowOnlyPublic: false }) {
  if (!validator.isEmail(email)) {
    return { valid: false, reason: 'Invalid email format' };
  }

  if (isDisposableEmail(email)) {
    return { valid: false, reason: 'Disposable emails are not allowed' };
  }

  if (isGibberishEmail(email)) {
    return { valid: false, reason: 'Email username looks suspicious or gibberish' };
  }

  if (options.allowOnlyPublic && !isAllowedPublicDomain(email)) {
    return { valid: false, reason: 'Only public email providers are allowed' };
  }

  return { valid: true };
}

module.exports = {
  validateEmail
};
