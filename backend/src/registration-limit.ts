import { CanActivate, ExecutionContext, HttpException, HttpStatus, Injectable } from '@nestjs/common';

@Injectable()
export class RegistrationLimit implements CanActivate {
  private readonly interval = 15 * 60 * 1000;
  private readonly attempts = new Map<string, { count: number; expires: number }>();
  private cleanupAt = 0;

  canActivate(context: ExecutionContext): boolean {
    const http = context.switchToHttp();
    const request = http.getRequest<{ ip?: string; socket: { remoteAddress?: string } }>();
    const address = request.ip ?? request.socket.remoteAddress ?? 'unknown';
    const now = Date.now();
    if (now >= this.cleanupAt) {
      for (const [key, value] of this.attempts) if (value.expires <= now) this.attempts.delete(key);
      this.cleanupAt = now + 60_000;
    }
    const previous = this.attempts.get(address);
    const current = previous && previous.expires > now ? previous : undefined;
    if ((current && current.count >= 10) || (!previous && this.attempts.size >= 10_000)) {
      const seconds = current ? Math.ceil((current.expires - now) / 1000) : 60;
      http.getResponse<{ setHeader(name: string, value: number): void }>().setHeader('Retry-After', seconds);
      throw new HttpException('Too many registration attempts. Please try again later.', HttpStatus.TOO_MANY_REQUESTS);
    }
    this.attempts.set(address, { count: (current?.count ?? 0) + 1, expires: current?.expires ?? now + this.interval });
    return true;
  }
}
