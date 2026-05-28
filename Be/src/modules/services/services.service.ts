import { Injectable } from '@nestjs/common';
import {
  CreateServiceDto,
  SearchServiceDto,
  UpdateServiceDto,
} from './dto/services.dto';
import { ProviderPublicService } from './provider-public.service';
import { PublicProviderServicesQuery } from './service-query.types';
import {
  AdminServiceFilters,
  ServiceModerationService,
} from './service-moderation.service';
import { ServiceCommandService } from './service-command.service';
import { ServiceSearchService } from './service-search.service';

@Injectable()
export class ServicesService {
  constructor(
    private readonly commandService: ServiceCommandService,
    private readonly moderationService: ServiceModerationService,
    private readonly searchService: ServiceSearchService,
    private readonly providerPublicService: ProviderPublicService,
  ) {}

  create(
    providerId: number,
    dto: CreateServiceDto,
    files?: Express.Multer.File[],
  ) {
    return this.commandService.create(providerId, dto, files);
  }

  update(
    providerId: number,
    serviceId: number,
    dto: UpdateServiceDto,
    files?: Express.Multer.File[],
  ) {
    return this.commandService.update(providerId, serviceId, dto, files);
  }

  submit(providerId: number, serviceId: number) {
    return this.commandService.submit(providerId, serviceId);
  }

  hide(providerId: number, serviceId: number) {
    return this.commandService.hide(providerId, serviceId);
  }

  show(providerId: number, serviceId: number) {
    return this.commandService.show(providerId, serviceId);
  }

  getMyServices(providerId: number, status?: string) {
    return this.commandService.getMyServices(providerId, status);
  }

  deleteByProvider(providerId: number, serviceId: number) {
    return this.commandService.deleteByProvider(providerId, serviceId);
  }

  adminApprove(adminId: number, serviceId: number) {
    return this.moderationService.approve(adminId, serviceId);
  }

  adminReject(adminId: number, serviceId: number, reason: string) {
    return this.moderationService.reject(adminId, serviceId, reason);
  }

  adminHide(adminId: number, serviceId: number, reason = '') {
    return this.moderationService.hide(adminId, serviceId, reason);
  }

  deleteByAdmin(adminId: number, serviceId: number) {
    return this.moderationService.delete(adminId, serviceId);
  }

  adminGetAll(filters?: AdminServiceFilters) {
    return this.moderationService.getAll(filters);
  }

  search(dto: SearchServiceDto) {
    return this.searchService.search(dto);
  }

  aiSearch(query: string) {
    return this.searchService.aiSearch(query);
  }

  getPublicDetail(serviceId: number) {
    return this.providerPublicService.getPublicDetail(serviceId);
  }

  getProviderMetrics(providerId: number) {
    return this.providerPublicService.getProviderMetrics(providerId);
  }

  getPublicProviderProfile(providerId: number) {
    return this.providerPublicService.getPublicProviderProfile(providerId);
  }

  getPublicProviderServices(
    providerId: number,
    queryParams: PublicProviderServicesQuery,
  ) {
    return this.providerPublicService.getPublicProviderServices(
      providerId,
      queryParams,
    );
  }
}

export type { PublicProviderServicesQuery } from './service-query.types';
