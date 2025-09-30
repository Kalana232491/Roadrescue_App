-- For geo queries (simple btree; for high scale consider PostGIS)
create index if not exists idx_provider_profiles_lat_lng on provider_profiles (lat, lng);
create index if not exists idx_provider_types_type on provider_types (type);
create index if not exists idx_reviews_provider on reviews (provider_id);