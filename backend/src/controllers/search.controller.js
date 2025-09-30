import { query } from '../config/db.js';
import { assert } from '../utils/validator.js';

// Haversine distance (km) computed in SQL
const DIST_SQL = `
  ( 6371 * acos(
      least(1, greatest(-1,
        cos(radians($1)) * cos(radians(p.lat)) * cos(radians(p.lng) - radians($2)) +
        sin(radians($1)) * sin(radians(p.lat))
      ))
    )
  )`;

export const nearby = async (req, res) => {
  const { type, lat, lng, radius_km: radiusQuery } = req.query;
  assert(['INDUSTRIALIST', 'ACCESSORY_SELLER', 'CARRIER'].includes(type), 'Invalid type');

  const latNum = Number(lat);
  const lngNum = Number(lng);
  const radius = radiusQuery === undefined ? 25 : Number(radiusQuery);

  assert(Number.isFinite(latNum) && Math.abs(latNum) <= 90, 'Valid latitude required');
  assert(Number.isFinite(lngNum) && Math.abs(lngNum) <= 180, 'Valid longitude required');
  assert(Number.isFinite(radius) && radius > 0 && radius <= 200, 'radius_km must be between 0 and 200');

  const sql = `
    select p.*, array_agg(distinct pt.type) as types,
      (${DIST_SQL}) as distance_km,
      coalesce(avg(r.rating), 0) as avg_rating,
      count(r.id) as reviews_count
    from provider_profiles p
    join provider_types pt on pt.profile_id = p.id
    left join reviews r on r.provider_id = p.id
    where pt.type=$3 and p.status='approved' and p.lat is not null and p.lng is not null
    group by p.id
    having (${DIST_SQL}) <= $4
    order by distance_km asc
    limit 100
  `;

  const { rows } = await query(sql, [latNum, lngNum, type, radius]);

  const ids = rows.map((row) => row.id);
  const imagesById = new Map();
  if (ids.length) {
    const { rows: imgs } = await query(
      'select profile_id, url from provider_images where profile_id = any($1)',
      [ids]
    );

    for (const image of imgs) {
      if (!imagesById.has(image.profile_id)) {
        imagesById.set(image.profile_id, []);
      }
      imagesById.get(image.profile_id).push(image.url);
    }
  }

  const enriched = rows.map((row) => ({
    ...row,
    images: imagesById.get(row.id) || [],
  }));

  res.json(enriched);
};
