import api from '../../lib/axios';

export const reviewApi = {
  create: (data: { bookingId: number; rating: number; comment?: string }) =>
    api.post('/reviews', data),
};
