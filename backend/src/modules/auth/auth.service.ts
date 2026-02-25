// ============================================
// AuthService — All authentication business logic
// Like: AuthController + AuthService combined in Laravel
// Handles: register, login, password hashing, JWT tokens
// ============================================

import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../common/prisma/prisma.service';
import { RegisterDto, LoginDto } from './dto';

@Injectable()
export class AuthService {

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  // ============================================
  // REGISTER — Create new user
  // Like: public function register(RegisterRequest $request)
  // ============================================
  async register(dto: RegisterDto) {
    // 1. Check if email already exists
    // Like: User::where('email', $request->email)->exists()
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    // 2. Hash the password (never store plain text!)
    // Like: $hashedPassword = Hash::make($request->password)
    const hashedPassword = await bcrypt.hash(dto.password, 12);

    // 3. Create the user in database
    // Like: User::create([...])
    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        password: hashedPassword,
        firstName: dto.firstName,
        lastName: dto.lastName || null,
      },
    });

    // 4. Create a FREE subscription for the new user
    // Like: $user->subscription()->create(['plan' => 'free'])
    await this.prisma.subscription.create({
      data: {
        userId: user.id,
        plan: 'FREE',
        status: 'ACTIVE',
      },
    });

    // 5. Generate JWT tokens
    const tokens = await this.generateTokens(user.id, user.email, user.role);

    // 6. Save refresh token to database
    await this.saveRefreshToken(user.id, tokens.refreshToken);

    // 7. Return user data + tokens (exclude password!)
    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
      ...tokens,
    };
  }

  // ============================================
  // LOGIN — Authenticate existing user
  // Like: public function login(LoginRequest $request)
  // ============================================
  async login(dto: LoginDto) {
    // 1. Find user by email
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    // 2. If user not found → 401 error
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // 3. Check if account is active
    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    // 4. Compare password with stored hash
    // Like: if (!Hash::check($request->password, $user->password))
    const isPasswordValid = await bcrypt.compare(dto.password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // 5. Generate new JWT tokens
    const tokens = await this.generateTokens(user.id, user.email, user.role);

    // 6. Save refresh token
    await this.saveRefreshToken(user.id, tokens.refreshToken);

    // 7. Return user + tokens
    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
      ...tokens,
    };
  }

  // ============================================
  // GET PROFILE — Return current user data
  // Like: public function me() { return auth()->user(); }
  // ============================================
  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        avatar: true,
        isVerified: true,
        twoFactorEnabled: true,
        createdAt: true,
        subscription: {
          select: {
            plan: true,
            status: true,
            auditsUsed: true,
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return user;
  }

  // ============================================
  // PRIVATE: Generate Access + Refresh tokens
  // ============================================
  private async generateTokens(userId: string, email: string, role: string) {
    const payload = { sub: userId, email, role };

    const jwtSecret = this.configService.get<string>('app.jwt.secret') || 'default-secret';
    const jwtRefreshSecret = this.configService.get<string>('app.jwt.refreshSecret') || 'default-refresh';

    const [accessToken, refreshToken] = await Promise.all([
      // Access token — expires in 15 minutes (900 seconds)
      this.jwtService.signAsync(payload, {
        secret: jwtSecret,
        expiresIn: 900,
      }),
      // Refresh token — expires in 7 days (604800 seconds)
      this.jwtService.signAsync(payload, {
        secret: jwtRefreshSecret,
        expiresIn: 604800,
      }),
    ]);

    return { accessToken, refreshToken };
  }

  // ============================================
  // PRIVATE: Save refresh token to database
  // ============================================
  private async saveRefreshToken(userId: string, token: string) {
    // Calculate expiry date (7 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.prisma.refreshToken.create({
      data: {
        userId,
        token,
        expiresAt,
      },
    });
  }
}