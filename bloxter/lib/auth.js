const jwt = require('jsonwebtoken');

const COOKIE = 'bx_session';
const MAX_AGE = 60 * 60 * 24 * 30; // 30 dias

function secret() {
  const s = process.env.JWT_SECRET;
  if (!s || s.length < 16) throw new Error('JWT_SECRET não configurada (mínimo 16 caracteres)');
  return s;
}

function parseCookies(req) {
  const out = {};
  (req.headers.cookie || '').split(';').forEach((part) => {
    const i = part.indexOf('=');
    if (i > -1) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  });
  return out;
}

function getUserId(req) {
  const token = parseCookies(req)[COOKIE];
  if (!token) return null;
  try {
    const data = jwt.verify(token, secret());
    return data.uid || null;
  } catch {
    return null;
  }
}

function cookieFlags() {
  return `Path=/; HttpOnly; SameSite=Lax; ${process.env.NODE_ENV === 'development' ? '' : 'Secure; '}`;
}

function setSession(res, uid) {
  const token = jwt.sign({ uid }, secret(), { expiresIn: MAX_AGE });
  res.setHeader('Set-Cookie', `${COOKIE}=${token}; ${cookieFlags()}Max-Age=${MAX_AGE}`);
}

function clearSession(res) {
  res.setHeader('Set-Cookie', `${COOKIE}=; ${cookieFlags()}Max-Age=0`);
}

module.exports = { getUserId, setSession, clearSession };
