import api from '@/lib/axios';

export interface CreateReviewDto {
  bookingId: number;
  rating: number;
  comment?: string;
}

export const reviewsApi = {
  create: (dto: CreateReviewDto) => api.post('/reviews', dto),
  getByService: (
    serviceId: number,
    params?: { rating?: number; page?: number; limit?: number },
  ) => api.get(`/reviews/service/${serviceId}`, { params }),
};

