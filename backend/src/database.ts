import { DataSourceOptions } from 'typeorm';
import { entities } from './entities';

export function databaseOptions(): DataSourceOptions {
  const host = process.env.DB_HOST?.trim();
  const port = Number(process.env.DB_PORT);
  const username = process.env.DB_USER?.trim();
  const password = process.env.DB_PASSWORD;
  const database = process.env.DB_NAME?.trim();

  if (!host || !username || !password || !database) {
    throw new Error('Set DB_HOST, DB_USER, DB_PASSWORD, and DB_NAME in the project .env or process environment');
  }
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('Set DB_PORT to an integer between 1 and 65535');
  }

  return {
    type: 'mysql',
    host,
    port,
    username,
    password,
    database,
    charset: 'utf8mb4',
    timezone: 'Z',
    entities,
    synchronize: false,
  };
}
