import { query } from '../config/db.js';
import { assert } from '../utils/validator.js';

export const postReview = async (req, res) => {
  assert(req.user.role === 'recipient', 'Only recipients can review', 403);
  const providerId = parseInt(req.params.providerId, 10);
  const { rating, comment } = req.body;
  assert(Number.isInteger(rating) && rating >=1 && rating <=5, 'rating 1-5');

  // Upsert logic: one review per recipient per provider
  const existing = await query('select id from reviews where provider_id=$1 and author_id=$2', [providerId, req.user.id]);
  if (existing.rowCount) {
    const id = existing.rows[0].id;
    const { rows } = await query('update reviews set rating=$1, comment=$2 where id=$3 returning *', [rating, comment||null, id]);
    return res.json(rows[0]);
  }
  const { rows } = await query(
    'insert into reviews (provider_id, author_id, rating, comment) values ($1,$2,$3,$4) returning *',
    [providerId, req.user.id, rating, comment||null]
  );
  res.status(201).json(rows[0]);
};

export const getReviews = async (req, res) => {
  const providerId = parseInt(req.params.providerId, 10);
  const { rows } = await query(
    `select r.*, u.username as author_username
     from reviews r join users u on u.id=r.author_id
     where r.provider_id=$1
     order by r.created_at desc`,
    [providerId]
  );
  res.json(rows);
};