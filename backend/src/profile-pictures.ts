import { BadRequestException, Injectable, NotFoundException, PayloadTooLargeException, StreamableFile } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { DataSource } from 'typeorm';
import { AccountStatus, Role, User } from './entities';

export const profilePictureLimit = 5 * 1024 * 1024;
export type PictureUpload = { buffer: Buffer; size: number; originalname: string; mimetype: string };

const imageTypes = { jpg: 'image/jpeg', png: 'image/png', webp: 'image/webp' } as const;
type PictureFormat = keyof typeof imageTypes;

function pictureFormat(buffer: Buffer): PictureFormat | undefined {
  if (buffer.length >= 4 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff &&
      buffer[buffer.length - 2] === 0xff && buffer[buffer.length - 1] === 0xd9) return 'jpg';
  if (buffer.length >= 45 && buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) &&
      buffer.toString('ascii', 12, 16) === 'IHDR' &&
      buffer.toString('ascii', buffer.length - 8, buffer.length - 4) === 'IEND') return 'png';
  if (buffer.length >= 20 && buffer.toString('ascii', 0, 4) === 'RIFF' &&
      buffer.readUInt32LE(4) === buffer.length - 8 && buffer.toString('ascii', 8, 12) === 'WEBP' &&
      ['VP8 ', 'VP8L', 'VP8X'].includes(buffer.toString('ascii', 12, 16))) return 'webp';
}

@Injectable()
export class ProfilePictures {
  private readonly storage = resolve(process.env.PROFILE_PICTURE_DIR || '.gym-uploads/profile-pictures');

  constructor(private db: DataSource) {}

  private pathFor(key: string) {
    if (!/^[0-9a-f-]{36}\.(jpg|png|webp)$/.test(key)) throw new NotFoundException('Profile picture not found');
    return join(this.storage, key);
  }

  async read(userId: number) {
    const user = await this.db.getRepository(User).createQueryBuilder('user')
      .select('user.userId').addSelect('user.profilePictureKey')
      .where('user.userId = :userId AND user.role = :role AND user.accountStatus = :status', {
        userId, role: Role.MEMBER, status: AccountStatus.ACTIVE,
      }).getOne();
    const key = user?.profilePictureKey;
    if (!key) throw new NotFoundException('Profile picture not found');
    let picture: Buffer;
    try {
      picture = await readFile(this.pathFor(key));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') throw new NotFoundException('Profile picture not found');
      throw error;
    }
    const format = key.slice(key.lastIndexOf('.') + 1) as PictureFormat;
    return new StreamableFile(picture, { type: imageTypes[format] });
  }

  async save(userId: number, file?: PictureUpload) {
    if (!file?.buffer.length) throw new BadRequestException('Choose a JPG, PNG, or WebP image');
    if (file.size > profilePictureLimit || file.buffer.length > profilePictureLimit) {
      throw new PayloadTooLargeException('Profile pictures must be 5 MB or smaller');
    }
    const format = pictureFormat(file.buffer);
    const extension = file.originalname.toLowerCase().match(/\.(jpe?g|png|webp)$/)?.[1];
    if (!format || !extension || (extension === 'jpeg' ? 'jpg' : extension) !== format || file.mimetype !== imageTypes[format]) {
      throw new BadRequestException('Choose a valid JPG, PNG, or WebP image');
    }
    const key = `${randomUUID()}.${format}`;
    await mkdir(this.storage, { recursive: true });
    await writeFile(this.pathFor(key), file.buffer, { flag: 'wx', mode: 0o600 });
    let previous: string | null;
    try {
      previous = await this.db.transaction(async manager => {
        const user = await manager.getRepository(User).createQueryBuilder('user')
          .select('user.userId').addSelect('user.profilePictureKey')
          .where('user.userId = :userId AND user.role = :role AND user.accountStatus = :status', {
            userId, role: Role.MEMBER, status: AccountStatus.ACTIVE,
          }).setLock('pessimistic_write').getOne();
        if (!user) throw new NotFoundException('Member account not found');
        await manager.update(User, userId, { profilePictureKey: key });
        return user.profilePictureKey;
      });
    } catch (error) {
      await unlink(this.pathFor(key)).catch(() => {});
      throw error;
    }
    if (previous && previous !== key) {
      await Promise.resolve().then(() => unlink(this.pathFor(previous))).catch(() => {});
    }
  }
}
