import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET || 'milan-jwt-secret-2026';

export function signToken(payload) {
  return jwt.sign(payload, SECRET, { expiresIn: '30d' });
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, SECRET);
  } catch {
    return null;
  }
}

// Extract token from Authorization header: "Bearer <token>"
export function getTokenFromRequest(req) {
  const auth = req.headers.get('authorization') || '';
  if (auth.startsWith('Bearer ')) return auth.slice(7);
  return null;
}
