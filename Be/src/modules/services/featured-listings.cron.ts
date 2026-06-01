import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { FeaturedListingsService } from './featured-listings.service';

@Injectable()
export class FeaturedListingsCron {
  private readonly logger = new Logger(FeaturedListingsCron.name);

  constructor(
    private readonly featuredListingsService: FeaturedListingsService,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async handleExpireListings() {
    this.logger.debug('Expiring inactive featured listings...');
    await this.featuredListingsService.expireListings();
  }
}
