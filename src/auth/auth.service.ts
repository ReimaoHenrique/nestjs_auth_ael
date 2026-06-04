import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import {
  JWT_EXPIRES_IN,
  JWT_REFRESH_EXPIRES_IN,
  JWT_REFRESH_SECRET,
  JWT_SECRET,
} from '../config/constants';
import { PrismaService } from '../prisma/prisma.service';
import { AuthTokensDto, LoginDto, RegisterDto } from './auth.dto';

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  async register(dto: RegisterDto) {
    if (!dto.email || !dto.password) {
      throw new BadRequestException('Email and password are required');
    }

    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new BadRequestException('Email already in use');
    }

    const password = await argon2.hash(dto.password, {
      type: argon2.argon2id,
    });

    return this.prisma.user.create({
      data: {
        email: dto.email,
        name: dto.name,
        password,
      },
      select: {
        id: true,
        email: true,
        name: true,
        access: true,
      },
    });
  }

  async login(dto: LoginDto): Promise<AuthTokensDto> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (
      !user ||
      !user.password ||
      !dto.password ||
      !(await argon2.verify(user.password, dto.password))
    ) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = this.createTokens(user);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.prisma.refreshToken.create({
      data: {
        token: tokens.refreshToken,
        userId: user.id,
        expiresAt,
      },
    });

    return tokens;
  }

  async refresh(refreshToken: string) {
    if (!refreshToken) {
      throw new BadRequestException('Refresh token is required');
    }

    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!storedToken) {
      throw new ForbiddenException('Invalid refresh token');
    }

    if (new Date() > storedToken.expiresAt) {
      await this.prisma.refreshToken.delete({
        where: { id: storedToken.id },
      });
      throw new ForbiddenException('Refresh token expired');
    }

    try {
      jwt.verify(refreshToken, JWT_REFRESH_SECRET);
    } catch {
      await this.prisma.refreshToken.delete({
        where: { id: storedToken.id },
      });
      throw new ForbiddenException('Invalid refresh token');
    }

    return {
      accessToken: this.createAccessToken(storedToken.user),
    };
  }

  async logout(refreshToken: string) {
    if (!refreshToken) {
      throw new BadRequestException('Refresh token is required');
    }

    await this.prisma.refreshToken.deleteMany({
      where: { token: refreshToken },
    });

    return { message: 'Logged out successfully' };
  }

  async me(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        access: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid token');
    }

    return user;
  }

  private createTokens(user: { id: number; email: string; access: string }) {
    return {
      accessToken: this.createAccessToken(user),
      refreshToken: jwt.sign({ sub: user.id }, JWT_REFRESH_SECRET, {
        expiresIn: JWT_REFRESH_EXPIRES_IN,
      }),
    };
  }

  private createAccessToken(user: {
    id: number;
    email: string;
    access: string;
  }) {
    return jwt.sign(
      {
        sub: user.id,
        email: user.email,
        access: user.access,
      },
      JWT_SECRET,
      {
        expiresIn: JWT_EXPIRES_IN,
      },
    );
  }
}
