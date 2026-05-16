import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { KycService } from './kyc.service';
import { UsersController } from './users.controller';
import { CloudinaryModule } from '../../shared/cloudinary/cloudinary.module';

@Module({
  imports: [CloudinaryModule],
  controllers: [UsersController],
  providers: [UsersService, KycService],
  exports: [UsersService, KycService],
})
export class UsersModule {}
