import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config/constants';

export interface AuthenticatedRequest {
  headers: {
    authorization?: string;
  };
  user: {
    id: number;
    email: string;
    tags: string[];
  };
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      throw new UnauthorizedException('No token provided');
    }

    const [scheme, token] = authHeader.split(' ');

    if (scheme?.toLowerCase() !== 'bearer' || !token) {
      throw new UnauthorizedException('Token malformatted');
    }

    try {
      const payload = jwt.verify(token, JWT_SECRET) as unknown as {
        sub: number;
        email: string;
        tags: string[];
      };

      request.user = {
        id: Number(payload.sub),
        email: payload.email,
        tags: payload.tags ?? [],
      };

      return true;
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
