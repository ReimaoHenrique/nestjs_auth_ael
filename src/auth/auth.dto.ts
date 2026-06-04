import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'Henrique Reimao', required: false })
  name?: string;

  @ApiProperty({ example: 'henrique@example.com' })
  email: string;

  @ApiProperty({ example: 'senha-forte-123', minLength: 8 })
  password: string;
}

export class LoginDto {
  @ApiProperty({ example: 'henrique@example.com' })
  email: string;

  @ApiProperty({ example: 'senha-forte-123' })
  password: string;
}

export class RefreshTokenDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  refreshToken: string;
}

export class UserResponseDto {
  @ApiProperty({ type: Number, example: 1 })
  id: number;

  @ApiProperty({ example: 'henrique@example.com' })
  email: string;

  @ApiProperty({ example: 'Henrique Reimao', nullable: true })
  name: string | null;

  @ApiProperty({ example: 'default' })
  access: string;
}

export class AuthTokensDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken: string;

  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  refreshToken: string;
}

export class AccessTokenDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken: string;
}

export class LogoutResponseDto {
  @ApiProperty({ example: 'Logged out successfully' })
  message: string;
}
