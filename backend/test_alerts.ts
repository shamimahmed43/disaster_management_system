import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

async function test() {
  const secret = process.env.JWT_SECRET || 'amar_dms_project_2026_super_secret_key';
  const token = jwt.sign({ user_id: 'U999', role: 'admin' }, secret, { expiresIn: '1h' });
  const res = await fetch('http://localhost:5000/api/shelters/alerts', {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await res.json();
  console.log(JSON.stringify(data, null, 2));
}

test();
