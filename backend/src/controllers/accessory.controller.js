import { query } from '../config/db.js';
import { assert } from '../utils/validator.js';

export const create = async (req, res) => {
  assert(req.user.role === 'provider', 'Only providers can add accessories', 403);

  const { profile_id: rawProfileId, title, description, price_cents: priceCents, image_url: imageUrl } = req.body;
  const profileId = Number.parseInt(rawProfileId, 10);
  const trimmedTitle = typeof title === 'string' ? title.trim() : '';
  const price = Number(priceCents);
  const normalizedDescription =
    typeof description === 'string' && description.trim() ? description.trim() : null;
  const normalizedImageUrl =
    typeof imageUrl === 'string' && imageUrl.trim() ? imageUrl.trim() : null;

  assert(Number.isInteger(profileId), 'Valid profile_id required');
  assert(trimmedTitle && trimmedTitle.length <= 25, 'title (<=25 chars) required');
  assert(Number.isInteger(price) && price >= 0, 'price_cents must be >=0');

  const { rows: profiles } = await query(
    'select id from provider_profiles where id=$1 and user_id=$2',
    [profileId, req.user.id]
  );
  assert(profiles.length, 'Profile not found', 404);

  const { rows: types } = await query(
    'select 1 from provider_types where profile_id=$1 and type=$2',
    [profileId, 'ACCESSORY_SELLER']
  );
  assert(types.length, 'Profile is not ACCESSORY_SELLER', 400);

  const { rows } = await query(
    'insert into accessories (profile_id, title, description, price_cents, image_url) values ($1,$2,$3,$4,$5) returning *',
    [profileId, trimmedTitle, normalizedDescription, price, normalizedImageUrl]
  );

  res.status(201).json(rows[0]);
};

export const listByProfile = async (req, res) => {
  const profileId = Number.parseInt(req.params.profileId, 10);
  assert(Number.isInteger(profileId), 'Invalid profile id');

  const { rows } = await query(
    'select * from accessories where profile_id=$1 order by id desc',
    [profileId]
  );
  res.json(rows);
};

export const remove = async (req, res) => {
  assert(req.user.role === 'provider', 'Only providers can delete accessories', 403);
  const accessoryId = Number.parseInt(req.params.id, 10);
  assert(Number.isInteger(accessoryId), 'Invalid accessory id');

  const { rows } = await query(
    `delete from accessories a
      using provider_profiles p
      where a.id=$1
        and p.id = a.profile_id
        and p.user_id=$2
      returning a.*`,
    [accessoryId, req.user.id]
  );

  assert(rows.length, 'Accessory not found', 404);
  res.json(rows[0]);
};
