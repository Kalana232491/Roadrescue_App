import jwt from 'jsonwebtoken';
import { query } from '../config/db.js';
import { hashPassword, comparePassword } from '../utils/password.js';
import { assert, isPhone, isUsername } from '../utils/validator.js';

function sign(user) {
  return jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
}

export const register = async (req, res) => {
  const { username, phone, password, password2, role } = req.body;
  assert(username && isUsername(username), 'Valid username required');
  assert(phone && isPhone(phone), 'Valid phone required');
  assert(password && password === password2, 'Passwords must match');
  assert(['provider','recipient'].includes(role), 'Invalid role');

  const exists = await query('select 1 from users where username=$1 or phone=$2 limit 1', [username, phone]);
  assert(exists.rowCount === 0, 'Username or phone already in use', 409);

  const password_hash = await hashPassword(password);
  const { rows } = await query(
    'insert into users (username, phone, password_hash, role) values ($1,$2,$3,$4) returning id, username, role',
    [username, phone, password_hash, role]
  );
  const user = rows[0];
  const token = sign(user);
  res.status(201).json({ token, user });
};

export const login = async (req, res) => {
  const { usernameOrPhone, password } = req.body;
  assert(usernameOrPhone && password, 'usernameOrPhone and password required');
  const { rows } = await query('select * from users where username=$1 or phone=$1 limit 1', [usernameOrPhone]);
  assert(rows.length, 'Invalid credentials', 401);
  const user = rows[0];
  const ok = await comparePassword(password, user.password_hash);
  assert(ok, 'Invalid credentials', 401);
  const token = sign(user);
  res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
};

