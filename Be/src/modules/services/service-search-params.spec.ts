import 'reflect-metadata';
import { SearchServiceDto } from './dto/services.dto';
import {
  buildServiceSearchCacheKey,
  getCategoryIdsWithDescendants,
  getRequestedCategoryIds,
  parseCategoryIds,
} from './service-search-params';

describe('service search params', () => {
  it('parses only positive integer category ids and removes duplicates', () => {
    expect(parseCategoryIds('3, 2, invalid, -1, 3, 0')).toEqual([3, 2, 3]);
  });

  it('combines singular and plural category filters into sorted unique ids', () => {
    const dto = Object.assign(new SearchServiceDto(), {
      categoryId: 3,
      categoryIds: '5, 2, 3',
    });

    expect(getRequestedCategoryIds(dto)).toEqual([2, 3, 5]);
  });

  it('does not mutate category ids when descendant expansion is unavailable', () => {
    const ids = [4, 4, 7];

    expect(getCategoryIdsWithDescendants(ids)).toEqual([4, 7]);
    expect(ids).toEqual([4, 4, 7]);
  });

  it('creates a stable cache key from normalized search values', () => {
    const dto = Object.assign(new SearchServiceDto(), {
      categoryIds: '5, 2',
      keyword: '  Wedding   photo  ',
      sortBy: undefined,
    });

    expect(buildServiceSearchCacheKey(dto, 1, 20)).toBe(
      JSON.stringify({
        categoryId: null,
        categoryIds: '2,5',
        keyword: 'wedding photo',
        limit: 20,
        maxPrice: null,
        minPrice: null,
        minRating: null,
        page: 1,
        province: '',
        lat: null,
        lng: null,
        radiusKm: null,
        sortBy: 'newest',
      }),
    );
  });
});
