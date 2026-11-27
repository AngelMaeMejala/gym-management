-- Run as a database administrator. This does not overwrite an existing database.
CREATE DATABASE IF NOT EXISTS gym_management_db
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Preferred setup: start NestJS and let TypeORM apply the bundled migrations.
-- To use the sanitized export instead, select this empty database and separately
-- import database/schema.sql before starting NestJS. Do not import into live data.
-- Create a dedicated application account as documented in README.md.
