import { SearchServiceDto } from './dto/services.dto';

export function parseCategoryIds(categoryIds?: string): number[] {
  if (!categoryIds) return [];

  return categoryIds
    .split(',')
    .map((categoryId) => Number.parseInt(categoryId.trim(), 10))
    .filter((categoryId) => Number.isInteger(categoryId) && categoryId > 0);
}

export function getRequestedCategoryIds(dto: SearchServiceDto): number[] {
  const categoryIds = new Set<number>(parseCategoryIds(dto.categoryIds));
  if (dto.categoryId) categoryIds.add(dto.categoryId);
  return [...categoryIds].sort((a, b) => a - b);
}

export function getCategoryIdsWithDescendants(categoryIds: number[]): number[] {
  return [...new Set(categoryIds)];
}

export function buildServiceSearchCacheKey(
  dto: SearchServiceDto,
  page: number,
  limit: number,
): string {
  const categoryIds = getRequestedCategoryIds(dto);

  return JSON.stringify({
    categoryId: dto.categoryId ?? null,
    categoryIds: categoryIds.length > 0 ? categoryIds.join(',') : null,
    keyword: dto.keyword?.trim().toLowerCase().replace(/\s+/g, ' ') ?? '',
    limit,
    maxPrice: dto.maxPrice ?? null,
    minPrice: dto.minPrice ?? null,
    minRating: dto.minRating ?? null,
    page,
    province: dto.province?.trim().toLowerCase() ?? '',
    lat: dto.lat ?? null,
    lng: dto.lng ?? null,
    radiusKm: dto.radiusKm ?? null,
    sortBy: dto.sortBy ?? 'newest',
  });
}
