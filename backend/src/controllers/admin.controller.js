import { query } from '../config/db.js';
import { assert, isPhone, isUsername } from '../utils/validator.js';
import { hashPassword } from '../utils/password.js';

const PROVIDER_STATUSES = ['pending', 'approved', 'rejected'];

const PROVIDER_SUMMARY_SELECT = `
  select
    p.id,
    p.user_id,
    p.display_name,
    p.about,
    p.phone_public,
    p.lat,
    p.lng,
    p.address_text,
    p.status,
    p.created_at,
    p.updated_at,
    u.username,
    u.phone,
    coalesce(array_agg(distinct pt.type) filter (where pt.type is not null), ARRAY[]::varchar[]) as types,
    coalesce(array_agg(distinct pi.url) filter (where pi.url is not null), ARRAY[]::text[]) as images
  from provider_profiles p
  join users u on u.id = p.user_id
  left join provider_types pt on pt.profile_id = p.id
  left join provider_images pi on pi.profile_id = p.id
`;

function normalizeProviderRow(row) {
  return {
    ...row,
    types: Array.isArray(row.types) ? row.types : [],
    images: Array.isArray(row.images) ? row.images : [],
  };
}

async function fetchProviderSummaries(whereClause, params) {
  const { rows } = await query(
    `${PROVIDER_SUMMARY_SELECT} ${whereClause}
     group by p.id, u.id, u.username, u.phone
     order by p.updated_at desc`,
    params
  );
  return rows.map(normalizeProviderRow);
}

export const listUsers = async (_req, res) => {
  const { rows } = await query('select id, username, phone, role, created_at from users order by id desc');
  res.json(rows);
};


export const createAdminUser = async (req, res) => {
  const { username, phone, password, password2 } = req.body ?? {};
  assert(username && isUsername(username), 'Valid username required');
  assert(phone && isPhone(phone), 'Valid phone required');
  assert(password && password.length >= 8, 'Password must be at least 8 characters');
  assert(password === password2, 'Passwords must match');

  const exists = await query('select 1 from users where username=$1 or phone=$2 limit 1', [username, phone]);
  assert(exists.rowCount === 0, 'Username or phone already in use', 409);

  const password_hash = await hashPassword(password);
  const { rows } = await query(
    "insert into users (username, phone, password_hash, role) values ($1,$2,$3,'admin') returning id, username, phone, role, created_at",
    [username, phone, password_hash]
  );

  res.status(201).json(rows[0]);
};
export const listProviderProfiles = async (req, res) => {
  const { status } = req.query;
  let whereClause = '';
  const params = [];

  if (status) {
    assert(PROVIDER_STATUSES.includes(status), 'Invalid status');
    whereClause = 'where p.status = $1';
    params.push(status);
  }

  const profiles = await fetchProviderSummaries(whereClause, params);
  res.json(profiles);
};

export const setProviderStatus = async (req, res) => {
  const { profile_id, status } = req.body;
  assert(PROVIDER_STATUSES.includes(status), 'Invalid status');

  const updated = await query(
    'update provider_profiles set status=$1, updated_at=now() where id=$2 returning id',
    [status, profile_id]
  );
  assert(updated.rowCount, 'Profile not found', 404);

  const [profile] = await fetchProviderSummaries('where p.id = $1', [profile_id]);
  res.json(profile);
};

export const deleteUser = async (req, res) => {
  const id = parseInt(req.params.userId, 10);
  await query('delete from users where id=$1', [id]);
  res.status(204).end();
};
