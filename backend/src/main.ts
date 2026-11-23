import 'reflect-metadata';
import 'dotenv/config';
import { Logger, Module, ValidationPipe } from '@nestjs/common';
import { APP_GUARD, NestFactory } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { NestExpressApplication } from '@nestjs/platform-express';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { isEmail } from 'class-validator';
import { hash } from 'bcrypt';
import { AccessGuard, Auth } from './auth';
import { Api } from './api';
import { AccountStatus, Role, User } from './entities';
import { databaseOptions } from './database';
import { Gym } from './gym';
import { InitialSchema1760000000000 } from './migration';
import { AddGymBookings1764000000000 } from './booking-migration';
import { NormalizeEquipmentAvailability1764100000000 } from './equipment-availability-migration';
import { AddProfilePicture1764200000000 } from './profile-picture-migration';
import { ProfilePictures } from './profile-pictures';

const secret = process.env.JWT_SECRET;
if (!secret || Buffer.byteLength(secret) < 32) throw new Error('Set JWT_SECRET to a random value of at least 32 bytes');

@Module({
  imports: [
    TypeOrmModule.forRoot({
      ...databaseOptions(),
      migrations: [InitialSchema1760000000000, AddGymBookings1764000000000, NormalizeEquipmentAvailability1764100000000, AddProfilePicture1764200000000], migrationsRun: true,
      retryAttempts: 2,
    }),
    JwtModule.register({ secret, signOptions: { expiresIn: '2h', algorithm: 'HS256' } }),
  ],
  providers: [Auth, Gym, ProfilePictures, { provide: APP_GUARD, useClass: AccessGuard }],
  controllers: [Api],
})
class Application {}

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(Application);
  try {
    app.disable('x-powered-by');
    app.setGlobalPrefix('api/v1');
    app.enableCors({ origin: (process.env.CORS_ORIGIN ?? 'http://localhost:5173').split(',').map(value => value.trim()) });
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    const users = app.get(DataSource).getRepository(User);
    if (!(await users.existsBy({ role: Role.ADMIN, accountStatus: AccountStatus.ACTIVE }))) {
      const email = process.env.BOOTSTRAP_ADMIN_EMAIL?.trim().toLowerCase();
      const password = process.env.BOOTSTRAP_ADMIN_PASSWORD;
      if (!email || email.length > 100 || !isEmail(email) || !password || [...password].length < 8 || Buffer.byteLength(password) > 72) {
        throw new Error('Initial setup requires a valid BOOTSTRAP_ADMIN_EMAIL and a BOOTSTRAP_ADMIN_PASSWORD with at least 8 characters and at most 72 UTF-8 bytes');
      }
      await users.createQueryBuilder().insert().values({
        firstName: 'Gym', lastName: 'Administrator', email, password: await hash(password, 12),
        role: Role.ADMIN, accountStatus: AccountStatus.ACTIVE,
      }).orIgnore().execute();
      if (!(await users.existsBy({ role: Role.ADMIN, accountStatus: AccountStatus.ACTIVE }))) {
        throw new Error('Administrator email is already in use. Choose a different bootstrap email');
      }
    }
    app.enableShutdownHooks();
    await app.listen(Number(process.env.PORT ?? 3000));
  } catch (error) {
    await app.close();
    throw error;
  }
}

bootstrap().catch(error => {
  Logger.error(error instanceof Error ? error.message : 'Startup failed', 'Bootstrap');
  process.exitCode = 1;
});

