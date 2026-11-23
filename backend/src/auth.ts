import { BadRequestException, CanActivate, ConflictException, ExecutionContext, ForbiddenException, Injectable, SetMetadata, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { DataSource } from 'typeorm';
import { compare } from 'bcrypt';
import { isEmail } from 'class-validator';
import { AccountStatus, Role, User } from './entities';
import { Login, RegistrationInput } from './dto';
import { Gym } from './gym';

export const Public = () => SetMetadata('public', true);
export const Roles = (...roles: Role[]) => SetMetadata('roles', roles);

@Injectable()
export class Auth {
  constructor(private db: DataSource, private jwt: JwtService, private gym: Gym) {}

  async register(input: RegistrationInput) {
    if (input.password !== input.confirmPassword) throw new BadRequestException('Passwords do not match.');
    // Preserve the full name while fitting the two existing name columns.
    const separators = Array.from(input.fullName.matchAll(/ /g), match => match.index);
    const split = separators.find(index => index <= 50 && input.fullName.length - index - 1 <= 50);
    if (split === undefined && input.fullName.length > 50) {
      throw new BadRequestException('Enter a full name that fits the account name fields.');
    }
    const duplicate = () => new ConflictException('This email address is already registered. Please sign in.');
    if (await this.db.getRepository(User).existsBy({ email: input.email })) throw duplicate();
    try {
      await this.gym.saveUser({
        firstName: split === undefined ? input.fullName : input.fullName.slice(0, split),
        lastName: split === undefined ? '' : input.fullName.slice(split + 1),
        email: input.email, password: input.password, role: Role.MEMBER, accountStatus: AccountStatus.ACTIVE,
      });
    } catch (error) {
      if (error instanceof ConflictException) throw duplicate();
      throw error;
    }
    return { message: 'Account created successfully! You can now sign in.' };
  }

  async login(input: Login) {
    const invalid = () => new UnauthorizedException('Invalid email or password.');
    if (typeof input.email !== 'string' || input.email.length > 100 || !isEmail(input.email) ||
      typeof input.password !== 'string' || Buffer.byteLength(input.password) > 72 || !input.password) {
      throw invalid();
    }
    const user = await this.db.getRepository(User).findOne({
      where: { email: input.email },
      select: { userId: true, password: true, accountStatus: true },
    });
    if (!user || !(await compare(input.password, user.password)) || user.accountStatus !== AccountStatus.ACTIVE) {
      throw invalid();
    }
    return { accessToken: await this.jwt.signAsync({ sub: user.userId }), tokenType: 'Bearer' };
  }
}

@Injectable()
export class AccessGuard implements CanActivate {
  constructor(private reflector: Reflector, private jwt: JwtService, private db: DataSource) {}

  async canActivate(context: ExecutionContext) {
    const handler = context.getHandler();
    if (this.reflector.get<boolean>('public', handler)) return true;
    const request = context.switchToHttp().getRequest();
    const match = /^Bearer (\S+)$/i.exec(request.headers.authorization ?? '');
    if (!match) throw new UnauthorizedException();
    let userId: number;
    try {
      const payload = await this.jwt.verifyAsync<{ sub: number }>(match[1], { algorithms: ['HS256'] });
      userId = payload.sub;
      if (!Number.isSafeInteger(userId) || userId < 1) throw new Error('Invalid subject');
    } catch {
      throw new UnauthorizedException('Invalid or expired access token');
    }
    const user = await this.db.getRepository(User).findOneBy({ userId, accountStatus: AccountStatus.ACTIVE });
    if (!user) throw new UnauthorizedException('Account unavailable');
    const roles = this.reflector.get<Role[]>('roles', handler);
    if (roles && !roles.includes(user.role)) throw new ForbiddenException();
    request.user = user;
    return true;
  }
}

