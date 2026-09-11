import {
  Controller,
  Get,
  Patch,
  Post,
  Delete,
  HttpCode,
  HttpStatus,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  Ip,
} from '@nestjs/common';
import {
  FileInterceptor,
  FileFieldsInterceptor,
} from '@nestjs/platform-express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { UsersService } from './users.service';
import { KycService } from './kyc.service';
import {
  UpdateProfileDto,
  CreateAddressDto,
  UpdateAddressDto,
  UpdatePushTokenDto,
  UpdateOnlineStatusDto,
} from './dto/users.dto';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly kycService: KycService,
  ) {}

  // ===== PROFILE =====

  /** GET /users/profile */
  @Get('profile')
  async getProfile(@CurrentUser('id') userId: number) {
    return this.usersService.getProfile(userId);
  }

  /** PATCH /users/profile — update name, phone, avatar */
  @Patch('profile')
  @UseInterceptors(FileInterceptor('avatar'))
  async updateProfile(
    @CurrentUser('id') userId: number,
    @Body() dto: UpdateProfileDto,
    @UploadedFile() avatar?: Express.Multer.File,
    @Ip() ip?: string,
  ) {
    return this.usersService.updateProfile(userId, dto, avatar, ip);
  }

  /** PATCH /users/profile/push-token — update Expo push token */
  @Patch('profile/push-token')
  async updatePushToken(
    @CurrentUser('id') userId: number,
    @Body() dto: UpdatePushTokenDto,
  ) {
    return this.usersService.updatePushToken(userId, dto.token);
  }

  /** PATCH /users/profile/online-status - Provider update online status */
  @Patch('profile/online-status')
  async updateOnlineStatus(
    @CurrentUser('id') userId: number,
    @Body() dto: UpdateOnlineStatusDto,
  ) {
    return this.usersService.updateOnlineStatus(userId, dto.isOnline);
  }

  // ===== ADDRESSES =====

  /** GET /users/addresses */
  @Get('addresses')
  async getAddresses(@CurrentUser('id') userId: number) {
    return this.usersService.getAddresses(userId);
  }

  /** POST /users/addresses */
  @Post('addresses')
  async createAddress(
    @CurrentUser('id') userId: number,
    @Body() dto: CreateAddressDto,
    @Ip() ip?: string,
  ) {
    return this.usersService.createAddress(userId, dto, ip);
  }

  /** PATCH /users/addresses/:id */
  @Patch('addresses/:id')
  async updateAddress(
    @CurrentUser('id') userId: number,
    @Param('id', ParseIntPipe) addressId: number,
    @Body() dto: UpdateAddressDto,
    @Ip() ip?: string,
  ) {
    return this.usersService.updateAddress(userId, addressId, dto, ip);
  }

  /** DELETE /users/addresses/:id */
  @Delete('addresses/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteAddress(
    @CurrentUser('id') userId: number,
    @Param('id', ParseIntPipe) addressId: number,
    @Ip() ip?: string,
  ) {
    return this.usersService.deleteAddress(userId, addressId, ip);
  }

  /** PATCH /users/addresses/:id/default */
  @Patch('addresses/:id/default')
  async setDefaultAddress(
    @CurrentUser('id') userId: number,
    @Param('id', ParseIntPipe) addressId: number,
    @Ip() ip?: string,
  ) {
    return this.usersService.setDefaultAddress(userId, addressId, ip);
  }

  // ===== KYC =====

  /** GET /users/kyc — lấy trạng thái KYC */
  @Get('kyc')
  @UseGuards(RolesGuard)
  @Roles('PROVIDER')
  async getKycStatus(@CurrentUser('id') userId: number) {
    return this.kycService.getKycStatus(userId);
  }

  /** POST /users/kyc — nộp hồ sơ KYC */
  @Post('kyc')
  @UseGuards(RolesGuard)
  @Roles('PROVIDER')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'cccdFront', maxCount: 1 },
      { name: 'cccdBack', maxCount: 1 },
      { name: 'portrait', maxCount: 1 },
      { name: 'certificate', maxCount: 1 },
    ]),
  )
  async submitKyc(
    @CurrentUser('id') userId: number,
    @Ip() ip: string,
    @UploadedFiles()
    files: {
      cccdFront?: Express.Multer.File[];
      cccdBack?: Express.Multer.File[];
      portrait?: Express.Multer.File[];
      certificate?: Express.Multer.File[];
    },
  ) {
    if (!files.cccdFront?.[0] || !files.cccdBack?.[0] || !files.portrait?.[0]) {
      throw new Error('Vui lòng upload đầy đủ CCCD 2 mặt và ảnh chân dung');
    }

    return this.kycService.submitKyc(
      userId,
      {
        cccdFront: files.cccdFront[0],
        cccdBack: files.cccdBack[0],
        portrait: files.portrait[0],
        certificate: files.certificate?.[0],
      },
      ip,
    );
  }
}
