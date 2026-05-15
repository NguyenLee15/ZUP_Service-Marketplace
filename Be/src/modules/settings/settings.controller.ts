import { Controller, Get } from '@nestjs/common';
import { SettingsService } from './settings.service';

@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get('public-social')
  async getPublicSocial() {
    const data = await this.settingsService.getPublicSocialConfig();
    return { data };
  }
}
