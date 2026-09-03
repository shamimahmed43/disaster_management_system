import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dms_jwt_secret_2024_bangladesh';

export interface AuthPayload {
  user_id: string;
  email: string;
  role: 'admin' | 'staff' | 'volunteer' | 'medical_staff' | 'victim' | 'pending';
  name: string;
  victim_id?: string;
  person_id?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

function extractToken(req: Request): string | null {
  return req.cookies?.dms_token ||
    req.headers.authorization?.replace('Bearer ', '') ||
    null;
}

// ─────────────────────────────────────────────
// requireAnyAuth: Must be logged in (any role)
// ─────────────────────────────────────────────
export function requireAnyAuth(req: Request, res: Response, next: NextFunction) {
  const token = extractToken(req);
  if (!token) return res.status(401).json({ error: 'Authentication required.' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthPayload;
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired session.' });
  }
}

// ─────────────────────────────────────────────
// requireRole: Must have one of the allowed roles
// ─────────────────────────────────────────────
export function requireRole(allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const token = extractToken(req);
    if (!token) return res.status(401).json({ error: 'Authentication required.' });

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as AuthPayload;
      if (!allowedRoles.includes(decoded.role)) {
        return res.status(403).json({ error: 'You do not have permission to access this resource.' });
      }
      req.user = decoded;
      next();
    } catch {
      res.status(401).json({ error: 'Invalid or expired session.' });
    }
  };
}

// ─────────────────────────────────────────────
// requireAdmin: Helper for admin only
// ─────────────────────────────────────────────
export const requireAdmin = requireRole(['admin']);

// ─────────────────────────────────────────────
// requireVictimOwnership: Victims can only access their own data
// ─────────────────────────────────────────────
export function requireVictimOwnership(req: Request, res: Response, next: NextFunction) {
  const token = extractToken(req);
  if (!token) return res.status(401).json({ error: 'Authentication required.' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthPayload;
    req.user = decoded;
    
    // If the user is admin or staff, they bypass ownership checks
    if (['admin', 'staff'].includes(decoded.role)) {
      return next();
    }

    // If the user is a victim, their victim_id must match the requested resource ID
    if (decoded.role === 'victim') {
      const requestedId = req.params.id || req.params.victim_id || req.body.victim_id;
      if (decoded.victim_id !== requestedId) {
        return res.status(403).json({ error: 'Access denied. You can only access your own profile.' });
      }
      return next();
    }

    // For any other role (volunteer etc) reject if they shouldn't access victim profiles directly
    return res.status(403).json({ error: 'Permission denied.' });
  } catch {
    res.status(401).json({ error: 'Invalid or expired session.' });
  }
}
