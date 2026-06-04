import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiUnauthorizedResponse, ApiExtraModels } from '@nestjs/swagger';



import { AuthService } from './auth.service';
import {
  AccessTokenDto,
  AuthTokensDto,
  LoginDto,
  LogoutResponseDto,
  RefreshTokenDto,
  RegisterDto,
  UserResponseDto,
} from './auth.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import type { AuthenticatedRequest } from './jwt-auth.guard';

@ApiExtraModels(UserResponseDto)
@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Cria um usuario com senha usando Argon2id' })
  @ApiCreatedResponse({ type: () => UserResponseDto })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Autentica usuario e retorna JWTs' })
  @ApiOkResponse({ type: AuthTokensDto })
  @ApiUnauthorizedResponse({ description: 'Invalid credentials' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Gera um novo access token usando refresh token' })
  @ApiOkResponse({ type: AccessTokenDto })
  refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refresh(dto.refreshToken);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Revoga um refresh token' })
  @ApiOkResponse({ type: LogoutResponseDto })
  logout(@Body() dto: RefreshTokenDto) {
    return this.authService.logout(dto.refreshToken);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Retorna o usuario autenticado pelo access token' })
  @ApiOkResponse({ type: () => UserResponseDto })
  @ApiUnauthorizedResponse({ description: 'Invalid token' })
  me(@Req() request: AuthenticatedRequest) {
    return this.authService.me(request.user.id);
  }
}
