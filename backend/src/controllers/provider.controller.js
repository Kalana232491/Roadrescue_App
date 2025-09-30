import { query } from '../config/db.js';
import { assert, clampImages, isPhone } from '../utils/validator.js';

const VALID_TYPES = ['INDUSTRIALIST', 'ACCESSORY_SELLER', 'CARRIER'];

async function buildProfile(profileId) {
  const { rows } = await query('select * from provider_profiles where id=$1', [profileId]);
  if (!rows.length) {
    return null;
  }

  const profile = rows[0];
  const typesResult = await query('select type from provider_types where profile_id=$1 order by type', [profileId]);
  const imagesResult = await query('select url from provider_images where profile_id=$1 order by id', [profileId]);

  return {
    ...profile,
    types: typesResult.rows.map((row) => row.type),
    images: imagesResult.rows.map((row) => row.url),
  };
}

function normalizeCoordinate(value) {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  const num = Number(value);
  assert(Number.isFinite(num), 'Coordinates must be numeric');
  return num;
}

export const upsertProfile = async (req, res) => {
  assert(req.user.role === 'provider', 'Only providers can edit profiles', 403);

  const {
    display_name,
    about,
    phone_public,
    lat,
    lng,
    address_text,
    types,
    image_urls,
  } = req.body;

  assert(display_name, 'display_name required');
  assert(phone_public && isPhone(phone_public), 'Valid phone_public required');
  assert(Array.isArray(types) && types.length, 'At least one type required');

  const latValue = normalizeCoordinate(lat);
  const lngValue = normalizeCoordinate(lng);

  // upsert base profile
  const existing = await query('select id from provider_profiles where user_id=$1', [req.user.id]);
  let profileId;

  if (existing.rowCount) {
    profileId = existing.rows[0].id;
    await query(
      `update provider_profiles
         set display_name=$1,
             about=$2,
             phone_public=$3,
             lat=$4,
             lng=$5,
             address_text=$6,
             status='pending',
             updated_at=now()
       where id=$7`,
      [display_name, about || null, phone_public, latValue, lngValue, address_text || null, profileId]
    );
    await query('delete from provider_types where profile_id=$1', [profileId]);
  } else {
    const insertResult = await query(
      `insert into provider_profiles (user_id, display_name, about, phone_public, lat, lng, address_text)
       values ($1,$2,$3,$4,$5,$6,$7)
       returning id`,
      [req.user.id, display_name, about || null, phone_public, latValue, lngValue, address_text || null]
    );
    profileId = insertResult.rows[0].id;
  }

  // set types
  for (const type of types) {
    assert(VALID_TYPES.includes(type), 'Invalid type');
    await query(
      'insert into provider_types (profile_id, type) values ($1,$2) on conflict do nothing',
      [profileId, type]
    );
  }

  // images (max 5)
  if (image_urls) {
    const imgs = clampImages(image_urls, 5);
    await query('delete from provider_images where profile_id=$1', [profileId]);
    for (const url of imgs) {
      await query('insert into provider_images (profile_id, url) values ($1,$2)', [profileId, url]);
    }
  }

  const profile = await buildProfile(profileId);
  res.json(profile);
};

export const getMyProfile = async (req, res) => {
  assert(req.user.role === 'provider', 'Only providers', 403);
  const existing = await query('select id from provider_profiles where user_id=$1', [req.user.id]);
  if (!existing.rowCount) {
    return res.json(null);
  }

  const profile = await buildProfile(existing.rows[0].id);
  res.json(profile);
};

export const addAccessory = async (req, res) => {
  assert(req.user.role === 'provider', 'Only providers', 403);
  const { profile_id, title, description, price_cents, image_url } = req.body;
  assert(title && title.length <= 25, 'title <= 25 chars');
  assert(Number.isInteger(price_cents) && price_cents >= 0, 'price_cents >= 0');

  const { rows: profiles } = await query(
    'select id from provider_profiles where id=$1 and user_id=$2',
    [profile_id, req.user.id]
  );
  assert(profiles.length, 'Profile not found', 404);

  // Ensure provider has ACCESSORY_SELLER type
  const { rows: t } = await query(
    'select 1 from provider_types where profile_id=$1 and type=$2',
    [profile_id, 'ACCESSORY_SELLER']
  );
  assert(t.length, 'Profile is not ACCESSORY_SELLER', 400);

  const { rows } = await query(
    'insert into accessories (profile_id, title, description, price_cents, image_url) values ($1,$2,$3,$4,$5) returning *',
    [profile_id, title, description || null, price_cents, image_url || null]
  );
  res.status(201).json(rows[0]);
};

export const listAccessories = async (req, res) => {
  const profileId = req.params.profileId;
  const { rows } = await query('select * from accessories where profile_id=$1 order by id desc', [profileId]);
  res.json(rows);
};
