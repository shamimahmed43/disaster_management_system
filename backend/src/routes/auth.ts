import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../config/db';
import { sendOTPEmail, generateOTP } from '../utils/mailer';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'dms_jwt_secret_2024_bangladesh';
const OTP_EXPIRY_MINUTES = 10;

// Helper: add minutes to current date
function addMinutes(mins: number): Date {
  return new Date(Date.now() + mins * 60 * 1000);
}

// ─────────────────────────────────────────────
// INTERNAL REGISTER (Staff, Volunteer, Admin)
// ─────────────────────────────────────────────
router.post('/internal/register', async (req: Request, res: Response) => {
  const { full_name, email, password, phone, role } = req.body;
  if (!full_name || !email || !password || !role) {
    return res.status(422).json({ error: 'Name, email, password, and role are required.' });
  }

  const validRoles = ['admin', 'staff', 'volunteer', 'medical_staff'];
  if (!validRoles.includes(role)) {
    return res.status(422).json({ error: 'Invalid role selected.' });
  }

  try {
    const existing = await query<any>(`SELECT user_id, is_verified FROM APP_USER WHERE email = :email`, [email]);
    if (existing.length > 0) {
      if (existing[0].IS_VERIFIED === 'Y') {
        return res.status(409).json({ error: 'An account with this email already exists and is verified. Please log in.' });
      }
    }

    const password_hash = await bcrypt.hash(password, 12);
    const otp = generateOTP();
    let user_id = existing.length > 0 ? existing[0].USER_ID : `USR-${Date.now()}`;
    let person_id = null;

    if (role === 'volunteer' || role === 'medical_staff') {
      person_id = `P-${Date.now()}`;
      const pType = role === 'volunteer' ? 'Volunteer' : 'Medical Staff';
      await query(
        `INSERT INTO PERSONNEL (person_id, name, personnel_type, phone, availability_status)
         VALUES (:person_id, :full_name, :pType, :phone, 'Available')`,
        [person_id, full_name, pType, phone || null]
      );
    }

    if (existing.length > 0) {
      await query(
        `UPDATE APP_USER 
         SET password_hash = :password_hash, full_name = :full_name, phone = :phone, role = :role, 
             otp_code = :otp_code, otp_expiry = SYSDATE + (:expiry_mins / 1440), created_at = SYSDATE,
             person_id = NVL(person_id, :person_id)
         WHERE email = :email`,
        [password_hash, full_name, phone || null, role, otp, OTP_EXPIRY_MINUTES, person_id, email]
      );
    } else {
      await query(
        `INSERT INTO APP_USER (user_id, email, password_hash, full_name, phone, role, is_verified, otp_code, otp_expiry, created_at, person_id)
         VALUES (:user_id, :email, :password_hash, :full_name, :phone, :role, 'N', :otp_code,
           SYSDATE + (:expiry_mins / 1440), SYSDATE, :person_id)`,
        [user_id, email, password_hash, full_name, phone || null, role, otp, OTP_EXPIRY_MINUTES, person_id]
      );
    }

    try {
      await sendOTPEmail(email, otp, full_name);
    } catch (mailErr) {
      console.error('[Mailer] OTP email failed:', mailErr);
    }

    res.status(201).json({ message: 'Registration successful. Check your email for the OTP.', email });
  } catch (err: any) {
    console.error('[Auth] Internal register error:', err);
    res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
});

// ─────────────────────────────────────────────
// INTERNAL VERIFY OTP
// ─────────────────────────────────────────────
router.post('/internal/verify', async (req: Request, res: Response) => {
  const { email, otp } = req.body;
  if (!email || !otp) return res.status(422).json({ error: 'Email and OTP are required.' });

  try {
    const users = await query<any>(
      `SELECT user_id, otp_code, CASE WHEN otp_expiry < SYSDATE THEN 1 ELSE 0 END AS is_expired, is_verified 
       FROM APP_USER WHERE email = :email AND role NOT IN ('victim', 'pending')`,
      [email]
    );
    if (users.length === 0) return res.status(404).json({ error: 'Account not found.' });

    const user = users[0];
    if (user.IS_VERIFIED === 'Y') return res.status(400).json({ error: 'Account already verified.' });
    if (user.OTP_CODE !== otp.trim()) return res.status(400).json({ error: 'Invalid OTP code.' });
    if (user.IS_EXPIRED === 1) {
      return res.status(400).json({ error: 'OTP has expired. Please register again to get a new code.' });
    }

    await query(
      `UPDATE APP_USER SET is_verified = 'Y', otp_code = NULL, otp_expiry = NULL WHERE email = :email`,
      [email]
    );

    res.json({ message: 'Email verified successfully. You can now log in.' });
  } catch (err) {
    console.error('[Auth] Internal verify error:', err);
    res.status(500).json({ error: 'Verification failed.' });
  }
});

// ─────────────────────────────────────────────
// INTERNAL LOGIN
// ─────────────────────────────────────────────
router.post('/internal/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(422).json({ error: 'Email and password are required.' });

  try {
    const users = await query<any>(
      `SELECT user_id, email, password_hash, full_name, role, is_verified, person_id 
       FROM APP_USER WHERE email = :email AND role NOT IN ('victim', 'pending')`,
      [email]
    );
    if (users.length === 0) return res.status(401).json({ error: 'Invalid email or password.' });

    const user = users[0];
    if (user.IS_VERIFIED !== 'Y') {
      return res.status(403).json({ error: 'Account not verified. Please check your email for the OTP.' });
    }

    const passwordMatch = await bcrypt.compare(password, user.PASSWORD_HASH);
    if (!passwordMatch) return res.status(401).json({ error: 'Invalid email or password.' });

    const token = jwt.sign(
      { user_id: user.USER_ID, email: user.EMAIL, role: user.ROLE, name: user.FULL_NAME, person_id: user.PERSON_ID },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.cookie('dms_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      data: { user_id: user.USER_ID, email: user.EMAIL, role: user.ROLE, name: user.FULL_NAME, person_id: user.PERSON_ID, token }
    });
  } catch (err) {
    console.error('[Auth] Internal login error:', err);
    res.status(500).json({ error: 'Login failed.' });
  }
});

// ─────────────────────────────────────────────
// ME (verify current session)
// ─────────────────────────────────────────────
router.get('/me', (req: Request, res: Response) => {
  const token = req.cookies?.dms_token || req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Not authenticated.' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    res.json({ data: { 
      user_id: decoded.user_id, 
      email: decoded.email, 
      role: decoded.role, 
      name: decoded.name, 
      person_id: decoded.person_id
    } });
  } catch {
    res.status(401).json({ error: 'Session expired. Please log in again.' });
  }
});

// Logout endpoint
router.post('/logout', (req: Request, res: Response) => {
  res.clearCookie('dms_token');
  res.json({ message: 'Logged out successfully' });
});

// ─────────────────────────────────────────────
// VICTIM REGISTER
// ─────────────────────────────────────────────
router.post('/victim/register', async (req: Request, res: Response) => {
  const { name, full_name, email, password, phone, nid, nid_number, gender, presentAddress, dob, disaster_name } = req.body;
  const victimName = (full_name || name || '').trim();
  const victimEmail = (email || '').trim();
  const victimPhone = (phone || '').trim();
  const victimNid = (nid_number || nid || '').trim();

  if (!victimName || !victimEmail || !password) {
    return res.status(422).json({ error: 'Name, email, and password are required.' });
  }

  try {
    const existing = await query<any>(`SELECT user_id, is_verified, victim_id FROM APP_USER WHERE email = :email`, [victimEmail]);
    if (existing.length > 0 && existing[0].IS_VERIFIED === 'Y') {
      return res.status(409).json({ error: 'An account with this email already exists and is verified. Please log in.' });
    }

    const password_hash = await bcrypt.hash(password, 12);
    const otp = generateOTP();
    let user_id = existing.length > 0 ? existing[0].USER_ID : `USR-${Date.now()}`;
    let victim_id = existing.length > 0 ? existing[0].VICTIM_ID : null;

    if (!victim_id && victimNid) {
      const existingVictim = await query<any>(`SELECT victim_id FROM VICTIM WHERE nid_number = :nid`, [victimNid]);
      if (existingVictim.length > 0) {
        victim_id = existingVictim[0].VICTIM_ID;
      }
    }

    if (!victim_id) {
      victim_id = `VIC-${Date.now()}`;
      let selectedDisaster = disaster_name;
      if (!selectedDisaster) {
        const activeDisasters = await query<any>(
          `SELECT disaster_name FROM DISASTER_EVENT WHERE end_date IS NULL ORDER BY start_date DESC`
        );
        if (activeDisasters.length > 0) {
          selectedDisaster = activeDisasters[0].DISASTER_NAME;
        } else {
          const anyDisasters = await query<any>(`SELECT disaster_name FROM DISASTER_EVENT ORDER BY start_date DESC`);
          selectedDisaster = anyDisasters.length > 0 ? anyDisasters[0].DISASTER_NAME : 'General Relief';
        }
      }

      await query(
        `INSERT INTO VICTIM (victim_id, household_head_name, gender, nid_number, reported_date, last_known_location, missing_person, disaster_name)
         VALUES (:victim_id, :household_head_name, :gender, :nid_number, SYSDATE, :last_known_location, 'N', :disaster_name)`,
        {
          victim_id,
          household_head_name: victimName,
          gender: gender || null,
          nid_number: victimNid || null,
          last_known_location: presentAddress || null,
          disaster_name: selectedDisaster
        }
      );

      if (victimPhone) {
        try {
          await query(
            `INSERT INTO VICTIM_PHONE (victim_id, phone_number) VALUES (:victim_id, :phone)`,
            [victim_id, victimPhone]
          );
        } catch (phoneErr) {}
      }
    }

    if (existing.length > 0) {
      await query(
        `UPDATE APP_USER 
         SET password_hash = :password_hash, full_name = :full_name, phone = :phone, role = 'victim', 
             otp_code = :otp_code, otp_expiry = SYSDATE + (:expiry_mins / 1440), created_at = SYSDATE,
             victim_id = :victim_id
         WHERE email = :email`,
        [password_hash, victimName, victimPhone || null, otp, OTP_EXPIRY_MINUTES, victim_id, victimEmail]
      );
    } else {
      await query(
        `INSERT INTO APP_USER (user_id, email, password_hash, full_name, phone, role, is_verified, otp_code, otp_expiry, created_at, victim_id)
         VALUES (:user_id, :email, :password_hash, :full_name, :phone, 'victim', 'N', :otp_code,
           SYSDATE + (:expiry_mins / 1440), SYSDATE, :victim_id)`,
        [user_id, victimEmail, password_hash, victimName, victimPhone || null, otp, OTP_EXPIRY_MINUTES, victim_id]
      );
    }

    try {
      await sendOTPEmail(victimEmail, otp, victimName);
    } catch (mailErr) {
      console.error('[Mailer] OTP email failed:', mailErr);
    }

    res.status(201).json({ message: 'Registration successful. Check your email for the OTP.', email: victimEmail });
  } catch (err: any) {
    console.error('[Auth] Victim register error:', err);
    res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
});

// ─────────────────────────────────────────────
// VICTIM VERIFY OTP
// ─────────────────────────────────────────────
router.post('/victim/verify', async (req: Request, res: Response) => {
  const { email, otp } = req.body;
  if (!email || !otp) return res.status(422).json({ error: 'Email and OTP are required.' });

  try {
    const users = await query<any>(
      `SELECT user_id, otp_code, CASE WHEN otp_expiry < SYSDATE THEN 1 ELSE 0 END AS is_expired, is_verified 
       FROM APP_USER WHERE email = :email AND role = 'victim'`,
      [email.trim()]
    );
    if (users.length === 0) return res.status(404).json({ error: 'Account not found.' });

    const user = users[0];
    if (user.IS_VERIFIED === 'Y') return res.status(400).json({ error: 'Account already verified.' });
    if (user.OTP_CODE !== otp.trim()) return res.status(400).json({ error: 'Invalid OTP code.' });
    if (user.IS_EXPIRED === 1) {
      return res.status(400).json({ error: 'OTP has expired. Please register again to get a new code.' });
    }

    await query(
      `UPDATE APP_USER SET is_verified = 'Y', otp_code = NULL, otp_expiry = NULL WHERE email = :email`,
      [email.trim()]
    );

    res.json({ message: 'Email verified successfully. You can now log in.' });
  } catch (err) {
    console.error('[Auth] Victim verify error:', err);
    res.status(500).json({ error: 'Verification failed.' });
  }
});

// ─────────────────────────────────────────────
// VICTIM LOGIN
// ─────────────────────────────────────────────
router.post('/victim/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(422).json({ error: 'Email and password are required.' });

  try {
    const users = await query<any>(
      `SELECT user_id, email, password_hash, full_name, role, is_verified, victim_id 
       FROM APP_USER WHERE email = :email AND role = 'victim'`,
      [email.trim()]
    );
    if (users.length === 0) return res.status(401).json({ error: 'Invalid email or password.' });

    const user = users[0];
    if (user.IS_VERIFIED !== 'Y') {
      return res.status(403).json({ error: 'Account not verified. Please check your email for the OTP.' });
    }

    const passwordMatch = await bcrypt.compare(password, user.PASSWORD_HASH);
    if (!passwordMatch) return res.status(401).json({ error: 'Invalid email or password.' });

    const token = jwt.sign(
      { user_id: user.USER_ID, email: user.EMAIL, role: user.ROLE, name: user.FULL_NAME, victim_id: user.VICTIM_ID },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.cookie('dms_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      data: {
        user_id: user.USER_ID,
        email: user.EMAIL,
        role: user.ROLE,
        name: user.FULL_NAME,
        victim_id: user.VICTIM_ID,
        token
      }
    });
  } catch (err) {
    console.error('[Auth] Victim login error:', err);
    res.status(500).json({ error: 'Login failed.' });
  }
});

export default router;
