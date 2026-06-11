import { OAuth2Client } from 'google-auth-library';
import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Prisma, UserRole, UserStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { JobName, JobsService } from '../../shared/jobs/jobs.service';
import { ErrorCodes } from '../../common/errors/error-codes';
import { hashPassword, comparePassword } from '../../common/utils/hash.util';
import { generateOtp, generateToken } from '../../common/utils/generate.util';
import { hashToken } from '../../common/utils/token-hash.util';
import {
  RegisterDto,
  VerifyOtpDto,
  LoginDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  ChangePasswordDto,
} from './dto/auth.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger('AuthService');
  private readonly otpCooldownMs = 60 * 1000;
  private readonly loginWindowMs = 15 * 60 * 1000;
  private readonly maxLoginAttempts = 5;
  private googleClient: OAuth2Client;

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private jobsService: JobsService,
  ) {
    this.googleClient = new OAuth2Client(
      this.configService.get<string>('GOOGLE_CLIENT_ID'),
    );
  }

  // ===== UC01: ĐĂNG KÝ =====

  async register(dto: RegisterDto) {
    // 1. Kiểm tra email trùng
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException({
        code: ErrorCodes.DUPLICATE_EMAIL,
        message: 'Email đã được sử dụng',
      });
    }

    // 2. Kiểm tra rate-limit OTP trong DB để free mode không phụ thuộc Redis
    await this.ensureOtpCooldown(dto.email, 'REGISTER');

    // 3. Hash mật khẩu
    const hashedPassword = await hashPassword(dto.password);

    // 4. Tạo user (status: PENDING, emailVerified: false)
    await this.prisma.user.create({
      data: {
        fullName: dto.fullName,
        email: dto.email,
        phone: dto.phone,
        password: hashedPassword,
        role: dto.role,
        status: UserStatus.PENDING,
        emailVerified: false,
      },
    });

    // 5. Tạo OTP + lưu DB
    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 phút

    await this.prisma.otpAttempt.create({
      data: {
        email: dto.email,
        type: 'REGISTER',
        code: otp,
        lastSentAt: new Date(),
        expiresAt,
      },
    });

    // 6. Gửi OTP qua JobsService: inline ở free mode, BullMQ ở redis mode
    await this.jobsService.enqueue(JobName.AuthSendOtp, {
      email: dto.email,
      otp,
    });

    this.logger.log(`User registered: ${dto.email} (role: ${dto.role})`);

    return {
      data: {
        message: 'Đăng ký thành công. Vui lòng kiểm tra email để nhận mã OTP.',
        email: dto.email,
      },
      message: 'Đăng ký thành công',
    };
  }

  // ===== VERIFY OTP =====

  async verifyOtp(dto: VerifyOtpDto) {
    // 1. Tìm OTP mới nhất chưa hết hạn
    const otpRecord = await this.prisma.otpAttempt.findFirst({
      where: {
        email: dto.email,
        type: 'REGISTER',
        expiresAt: { gt: new Date() },
      },
      orderBy: { id: 'desc' },
    });

    if (!otpRecord) {
      throw new BadRequestException({
        code: ErrorCodes.OTP_INVALID,
        message: 'Mã OTP không tồn tại hoặc đã hết hạn',
      });
    }

    // 2. Kiểm tra brute-force (max 5 lần sai)
    if (otpRecord.wrongAttempts >= 5) {
      throw new BadRequestException({
        code: ErrorCodes.OTP_RATE_LIMIT,
        message: 'Bạn đã nhập sai quá nhiều lần. Vui lòng yêu cầu OTP mới.',
      });
    }

    // 3. So khớp OTP
    if (otpRecord.code !== dto.otp) {
      await this.prisma.otpAttempt.update({
        where: { id: otpRecord.id },
        data: { wrongAttempts: { increment: 1 } },
      });
      throw new BadRequestException({
        code: ErrorCodes.OTP_INVALID,
        message: 'Mã OTP không chính xác',
      });
    }

    // 4. Kích hoạt tài khoản
    const user = await this.prisma.user.update({
      where: { email: dto.email },
      data: {
        status: UserStatus.ACTIVE,
        emailVerified: true,
      },
    });

    // 5. Xóa OTP records
    await this.prisma.otpAttempt.deleteMany({
      where: { email: dto.email, type: 'REGISTER' },
    });

    // 6. Tạo token pair
    const tokens = await this.generateTokenPair(
      this.prisma,
      user.id,
      user.email,
      user.role,
    );

    // 7. Tạo ví nếu là Provider
    if (user.role === UserRole.PROVIDER) {
      await this.prisma.providerWallet.create({
        data: { providerId: user.id },
      });
    }

    this.logger.log(`OTP verified: ${dto.email}`);

    return {
      data: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        user: this.sanitizeUser(user),
      },
      message: 'Xác thực OTP thành công',
    };
  }

  // ===== RESEND OTP =====

  async resendOtp(email: string) {
    // 1. Kiểm tra cooldown trong DB
    await this.ensureOtpCooldown(email, 'REGISTER');

    // 2. Kiểm tra user tồn tại + chưa verify
    const user = await this.prisma.user.findUnique({
      where: { email },
    });
    if (!user || user.emailVerified) {
      throw new BadRequestException({
        code: ErrorCodes.VALIDATION_ERROR,
        message: 'Email không hợp lệ hoặc đã được xác thực',
      });
    }

    // 3. Tạo OTP mới
    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await this.prisma.otpAttempt.create({
      data: {
        email,
        type: 'REGISTER',
        code: otp,
        lastSentAt: new Date(),
        expiresAt,
      },
    });

    await this.jobsService.enqueue(JobName.AuthSendOtp, { email, otp });

    return {
      data: { message: 'OTP đã được gửi lại' },
      message: 'Gửi OTP thành công',
    };
  }

  // ===== UC02: ĐĂNG NHẬP =====

  async login(dto: LoginDto) {
    // 1. Tìm user
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new UnauthorizedException({
        code: ErrorCodes.UNAUTHORIZED,
        message: 'Email hoặc mật khẩu không chính xác',
      });
    }

    // 2. Kiểm tra brute-force trong DB (max 5 lần/15 phút)
    const loginAttemptKey = this.loginAttemptKey(dto.email);
    await this.ensureLoginAttemptNotLocked(loginAttemptKey);

    // 3. Kiểm tra mật khẩu
    if (!user.password) {
      throw new UnauthorizedException({
        code: ErrorCodes.UNAUTHORIZED,
        message:
          'Tài khoản này được đăng ký qua Google. Vui lòng đăng nhập bằng Google.',
      });
    }

    const isPasswordValid = await comparePassword(dto.password, user.password);
    if (!isPasswordValid) {
      await this.recordFailedLoginAttempt(loginAttemptKey);

      throw new UnauthorizedException({
        code: ErrorCodes.UNAUTHORIZED,
        message: 'Email hoặc mật khẩu không chính xác',
      });
    }

    // 4. Kiểm tra trạng thái tài khoản
    if (user.status === UserStatus.LOCKED) {
      throw new UnauthorizedException({
        code: ErrorCodes.ACCOUNT_LOCKED,
        message: 'Tài khoản đã bị khóa. Vui lòng liên hệ quản trị viên.',
      });
    }

    if (user.status === UserStatus.PENDING) {
      throw new UnauthorizedException({
        code: ErrorCodes.UNAUTHORIZED,
        message: 'Tài khoản chưa xác thực email. Vui lòng kiểm tra hộp thư.',
      });
    }

    // 5. Xóa brute-force counter
    await this.clearLoginAttempts(loginAttemptKey);

    // 6. Tạo token pair
    const tokens = await this.generateTokenPair(
      this.prisma,
      user.id,
      user.email,
      user.role,
    );

    this.logger.log(`User logged in: ${dto.email} (role: ${user.role})`);

    return {
      data: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        user: this.sanitizeUser(user),
      },
      message: 'Đăng nhập thành công',
    };
  }

  // ===== GOOGLE LOGIN =====

  async googleLogin(credential: string) {
    try {
      const { email, name, picture, googleId } =
        await this.verifyGoogleCredential(credential);

      // 1. Tìm user theo googleId hoặc email
      let user = await this.prisma.user.findFirst({
        where: {
          OR: [{ googleId }, { email }],
        },
      });

      if (!user) {
        // 2. Nếu chưa có -> Tạo mới (mặc định CUSTOMER, status ACTIVE)
        user = await this.prisma.user.create({
          data: {
            email,
            fullName: name || 'Google User',
            avatarUrl: picture,
            googleId,
            role: UserRole.CUSTOMER,
            status: UserStatus.ACTIVE,
            emailVerified: true,
          },
        });
        this.logger.log(`New Google user registered: ${email}`);
      } else {
        const shouldForceCustomerRole =
          user.role === UserRole.ADMIN || user.role === UserRole.STAFF;

        // 3. Google login is always treated as a customer account.
        if (!user.googleId || shouldForceCustomerRole) {
          user = await this.prisma.user.update({
            where: { id: user.id },
            data: {
              ...(!user.googleId && { googleId }),
              avatarUrl: user.avatarUrl || picture,
              ...(shouldForceCustomerRole && { role: UserRole.CUSTOMER }),
            },
          });
          this.logger.log(`Linked Google account to existing user: ${email}`);
        }
      }

      // 4. Kiểm tra trạng thái tài khoản
      if (user.status === UserStatus.LOCKED) {
        throw new UnauthorizedException({
          code: ErrorCodes.ACCOUNT_LOCKED,
          message: 'Tài khoản đã bị khóa. Vui lòng liên hệ quản trị viên.',
        });
      }

      // 5. Tạo token pair
      const tokens = await this.generateTokenPair(
        this.prisma,
        user.id,
        user.email,
        user.role,
      );

      return {
        data: {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          user: this.sanitizeUser(user),
        },
        message: 'Đăng nhập Google thành công',
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(`Google login error: ${message}`);
      if (err instanceof UnauthorizedException) throw err;
      throw new UnauthorizedException({
        code: ErrorCodes.UNAUTHORIZED,
        message: 'Xác thực Google thất bại',
      });
    }
  }

  async providerGoogleLogin(credential: string) {
    try {
      const { email, picture, googleId } =
        await this.verifyGoogleCredential(credential);

      let user = await this.prisma.user.findFirst({
        where: {
          OR: [{ googleId }, { email }],
        },
      });

      if (!user || user.role !== UserRole.PROVIDER) {
        throw new UnauthorizedException({
          code: ErrorCodes.UNAUTHORIZED,
          message:
            'Vui lòng đăng ký tài khoản thợ bằng email trước khi dùng Google.',
        });
      }

      if (user.status === UserStatus.LOCKED) {
        throw new UnauthorizedException({
          code: ErrorCodes.ACCOUNT_LOCKED,
          message: 'Tài khoản đã bị khóa. Vui lòng liên hệ quản trị viên.',
        });
      }

      if (user.status === UserStatus.PENDING) {
        throw new UnauthorizedException({
          code: ErrorCodes.UNAUTHORIZED,
          message:
            'Tài khoản thợ chưa xác thực email. Vui lòng kiểm tra hộp thư.',
        });
      }

      if (!user.googleId) {
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: { googleId, avatarUrl: user.avatarUrl || picture },
        });
        this.logger.log(`Linked Google account to provider: ${email}`);
      }

      const tokens = await this.generateTokenPair(
        this.prisma,
        user.id,
        user.email,
        user.role,
      );

      return {
        data: {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          user: this.sanitizeUser(user),
        },
        message: 'Đăng nhập Google thành công',
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(`Provider Google login error: ${message}`);
      if (err instanceof UnauthorizedException) throw err;
      throw new UnauthorizedException({
        code: ErrorCodes.UNAUTHORIZED,
        message: 'Xác thực Google thất bại',
      });
    }
  }

  // ===== REFRESH TOKEN =====

  async refreshToken(refreshToken: string) {
    const tokenHash = hashToken(refreshToken);

    // 1. Tìm token hash mới, fallback legacy raw token cho phiên cũ
    const tokenRecord = await this.prisma.refreshToken.findFirst({
      where: {
        OR: [{ tokenHash }, { token: refreshToken }],
      },
      include: { user: true },
    });

    if (!tokenRecord) {
      throw new UnauthorizedException({
        code: ErrorCodes.UNAUTHORIZED,
        message: 'Refresh token không hợp lệ hoặc đã hết hạn',
      });
    }

    if (tokenRecord.revoked) {
      await this.prisma.refreshToken.updateMany({
        where: { userId: tokenRecord.userId, revoked: false },
        data: { revoked: true },
      });
      throw new UnauthorizedException({
        code: ErrorCodes.UNAUTHORIZED,
        message: 'Refresh token không hợp lệ hoặc đã hết hạn',
      });
    }

    if (tokenRecord.expiresAt <= new Date()) {
      throw new UnauthorizedException({
        code: ErrorCodes.UNAUTHORIZED,
        message: 'Refresh token không hợp lệ hoặc đã hết hạn',
      });
    }

    const user = tokenRecord.user;
    const tokens = await this.prisma.$transaction(async (tx) => {
      await tx.refreshToken.update({
        where: { id: tokenRecord.id },
        data: { revoked: true },
      });
      return this.generateTokenPair(tx, user.id, user.email, user.role);
    });

    return {
      data: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      },
      message: 'Token đã được làm mới',
    };
  }

  // ===== LOGOUT =====

  async logout(userId: number) {
    // Revoke tất cả refresh token của user
    await this.prisma.refreshToken.updateMany({
      where: { userId, revoked: false },
      data: { revoked: true },
    });

    return { message: 'Đăng xuất thành công' };
  }

  // ===== UC03: QUÊN MẬT KHẨU =====

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    // Luôn trả success (không leak thông tin user tồn tại)
    if (!user) {
      return {
        data: {
          message: 'Nếu email tồn tại, bạn sẽ nhận được link đặt lại mật khẩu.',
        },
        message: 'Yêu cầu đã được xử lý',
      };
    }

    // Kiểm tra cooldown bằng DB để không phụ thuộc Redis
    const recentReset = await this.prisma.passwordReset.findFirst({
      where: {
        userId: user.id,
        createdAt: { gte: new Date(Date.now() - 60 * 1000) },
      },
      orderBy: { createdAt: 'desc' },
    });
    if (recentReset) {
      return {
        data: {
          message: 'Nếu email tồn tại, bạn sẽ nhận được link đặt lại mật khẩu.',
        },
        message: 'Yêu cầu đã được xử lý',
      };
    }

    // Tạo token reset
    const token = generateToken();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 phút

    await this.prisma.passwordReset.create({
      data: {
        userId: user.id,
        token: '',
        tokenHash: hashToken(token),
        expiresAt,
      },
    });

    // Gửi email qua JobsService
    const frontendUrl = this.configService.get<string>('app.frontendUrl');
    const resetLink = `${frontendUrl}/forgot-password?token=${token}`;
    await this.jobsService.enqueue(JobName.AuthSendReset, {
      email: dto.email,
      resetLink,
    });

    return {
      data: {
        message: 'Nếu email tồn tại, bạn sẽ nhận được link đặt lại mật khẩu.',
      },
      message: 'Yêu cầu đã được xử lý',
    };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const tokenHash = hashToken(dto.token);

    // 1. Tìm token hash mới, fallback legacy raw token
    const resetRecord = await this.prisma.passwordReset.findFirst({
      where: {
        OR: [{ tokenHash }, { token: dto.token }],
      },
    });

    if (
      !resetRecord ||
      resetRecord.used ||
      resetRecord.expiresAt <= new Date()
    ) {
      throw new BadRequestException({
        code: ErrorCodes.VALIDATION_ERROR,
        message: 'Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn',
      });
    }

    // 2. Hash mật khẩu mới + update
    const hashedPassword = await hashPassword(dto.newPassword);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: resetRecord.userId },
        data: { password: hashedPassword },
      }),
      this.prisma.passwordReset.update({
        where: { id: resetRecord.id },
        data: { used: true },
      }),
      // Revoke tất cả refresh token (force re-login)
      this.prisma.refreshToken.updateMany({
        where: { userId: resetRecord.userId, revoked: false },
        data: { revoked: true },
      }),
    ]);

    return {
      data: { message: 'Mật khẩu đã được thay đổi thành công' },
      message: 'Đặt lại mật khẩu thành công',
    };
  }

  // ===== ĐỔI MẬT KHẨU =====

  async changePassword(userId: number, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException({
        code: ErrorCodes.NOT_FOUND,
        message: 'Người dùng không tồn tại',
      });
    }

    // Brute-force protection for change password, stored in DB for free mode
    const changePasswordAttemptKey = `change-password:${userId}`;
    await this.ensureLoginAttemptNotLocked(
      changePasswordAttemptKey,
      'Bạn đã nhập sai mật khẩu quá nhiều lần. Vui lòng thử lại sau 15 phút.',
    );

    if (!user.password) {
      throw new BadRequestException({
        code: ErrorCodes.VALIDATION_ERROR,
        message: 'Tài khoản này chưa thiết lập mật khẩu (đăng ký qua Google).',
      });
    }

    const isValid = await comparePassword(dto.currentPassword, user.password);
    if (!isValid) {
      await this.recordFailedLoginAttempt(changePasswordAttemptKey);

      throw new BadRequestException({
        code: ErrorCodes.VALIDATION_ERROR,
        message: 'Mật khẩu hiện tại không chính xác',
      });
    }

    // Success -> Clear attempts and update
    await this.clearLoginAttempts(changePasswordAttemptKey);

    const hashedPassword = await hashPassword(dto.newPassword);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { password: hashedPassword },
      }),
      // Revoke all refresh tokens to force logout other sessions
      this.prisma.refreshToken.updateMany({
        where: { userId, revoked: false },
        data: { revoked: true },
      }),
    ]);

    return {
      data: {
        message:
          'Đổi mật khẩu thành công. Các phiên đăng nhập khác đã được đăng xuất.',
      },
      message: 'Đổi mật khẩu thành công',
    };
  }

  // ===== GET PROFILE =====

  async getProfile(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        kycProfiles: {
          orderBy: { id: 'desc' },
          take: 1,
        },
      },
    });

    if (!user) {
      throw new NotFoundException({
        code: ErrorCodes.NOT_FOUND,
        message: 'Người dùng không tồn tại',
      });
    }

    return {
      data: {
        ...this.sanitizeUser(user),
        kycStatus: user.kycProfiles?.[0]?.status || null,
      },
    };
  }

  // ===== PRIVATE HELPERS =====

  private async ensureOtpCooldown(
    email: string,
    type: 'REGISTER' | 'RESET_PASSWORD',
  ) {
    const recentOtp = await this.prisma.otpAttempt.findFirst({
      where: {
        email,
        type,
        lastSentAt: { gte: new Date(Date.now() - this.otpCooldownMs) },
      },
      orderBy: { lastSentAt: 'desc' },
    });

    if (!recentOtp?.lastSentAt) return;

    const elapsedMs = Date.now() - recentOtp.lastSentAt.getTime();
    const waitSeconds = Math.max(
      1,
      Math.ceil((this.otpCooldownMs - elapsedMs) / 1000),
    );
    throw new BadRequestException({
      code: ErrorCodes.OTP_RATE_LIMIT,
      message: `Vui lòng đợi ${waitSeconds} giây trước khi gửi lại OTP`,
    });
  }

  private loginAttemptKey(email: string): string {
    return `login:${email.trim().toLowerCase()}`;
  }

  private async ensureLoginAttemptNotLocked(
    identifier: string,
    message?: string,
  ) {
    const attempt = await this.prisma.loginAttempt.findUnique({
      where: { identifier },
    });
    if (!attempt) return;

    const now = new Date();
    if (attempt.lockedUntil && attempt.lockedUntil > now) {
      throw new BadRequestException({
        code: ErrorCodes.ACCOUNT_LOCKED,
        message:
          message ||
          'Tài khoản tạm khóa do nhập sai quá nhiều lần. Vui lòng thử lại sau 15 phút.',
      });
    }

    if (
      now.getTime() - attempt.windowStartedAt.getTime() >
      this.loginWindowMs
    ) {
      await this.prisma.loginAttempt.update({
        where: { identifier },
        data: {
          failedCount: 0,
          windowStartedAt: now,
          lockedUntil: null,
          lastAttemptAt: now,
        },
      });
    }
  }

  private async recordFailedLoginAttempt(identifier: string) {
    const now = new Date();
    const current = await this.prisma.loginAttempt.findUnique({
      where: { identifier },
    });
    const windowExpired = current
      ? now.getTime() - current.windowStartedAt.getTime() > this.loginWindowMs
      : true;
    const failedCount = windowExpired ? 1 : (current?.failedCount || 0) + 1;
    const lockedUntil =
      failedCount >= this.maxLoginAttempts
        ? new Date(now.getTime() + this.loginWindowMs)
        : null;

    await this.prisma.loginAttempt.upsert({
      where: { identifier },
      create: {
        identifier,
        failedCount,
        windowStartedAt: now,
        lockedUntil,
        lastAttemptAt: now,
      },
      update: {
        failedCount,
        windowStartedAt: windowExpired ? now : current?.windowStartedAt,
        lockedUntil,
        lastAttemptAt: now,
      },
    });
  }

  private async clearLoginAttempts(identifier: string) {
    await this.prisma.loginAttempt.deleteMany({ where: { identifier } });
  }

  private async verifyGoogleCredential(credential: string) {
    const ticket = await this.googleClient.verifyIdToken({
      idToken: credential,
      audience: this.getGoogleAudiences(),
    });
    const payload = ticket.getPayload();
    if (!payload) {
      throw new UnauthorizedException({
        code: ErrorCodes.UNAUTHORIZED,
        message: 'Google token không hợp lệ',
      });
    }

    const { email, name, picture, sub: googleId } = payload;
    if (!email) {
      throw new UnauthorizedException({
        code: ErrorCodes.UNAUTHORIZED,
        message: 'Google token không có email',
      });
    }

    return { email, name, picture, googleId };
  }

  private getGoogleAudiences(): string | string[] {
    const configuredAudiences = [
      this.configService.get<string>('GOOGLE_CLIENT_IDS'),
      this.configService.get<string>('GOOGLE_CLIENT_ID'),
      this.configService.get<string>('EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID'),
      this.configService.get<string>('EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID'),
    ]
      .filter(Boolean)
      .join(',');

    const audiences = configuredAudiences
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean);

    return audiences.length > 1 ? audiences : audiences[0];
  }

  private async generateTokenPair(
    tx: PrismaService | Prisma.TransactionClient,
    userId: number,
    email: string,
    role: UserRole,
  ) {
    const payload = { sub: userId, email, role };
    const secret = this.configService.getOrThrow<string>('app.jwtSecret');
    const expiresIn = (this.configService.get<string>('app.jwtExpiresIn') ||
      '30m') as JwtSignOptions['expiresIn'];

    const signOptions: Parameters<JwtService['sign']>[1] = {
      secret,
      expiresIn,
    };
    const accessToken = this.jwtService.sign(payload, signOptions);

    const refreshToken = generateToken(48);

    // Lưu refresh token vào DB
    const refreshExpiresIn =
      this.configService.get<string>('app.jwtRefreshExpiresIn') || '7d';
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + (parseInt(refreshExpiresIn) || 7));

    await tx.refreshToken.create({
      data: {
        userId,
        token: '',
        tokenHash: hashToken(refreshToken),
        expiresAt,
      },
    });

    return { accessToken, refreshToken };
  }

  private sanitizeUser<T extends { password?: unknown }>(
    user: T,
  ): Omit<T, 'password'> {
    const { password, ...sanitized } = user;
    void password;
    return sanitized;
  }
}
