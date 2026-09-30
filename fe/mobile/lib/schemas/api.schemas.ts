import { z } from 'zod';

export const mobileUserSchema = z.object({
  id: z.number().int(),
  email: z.string().email(),
  fullName: z.string(),
  phone: z.string().nullable(),
  avatarUrl: z.string().nullable(),
  role: z.string(),
  status: z.string(),
  isOnline: z.boolean().optional(),
  kycStatus: z.enum(['PENDING', 'APPROVED', 'REJECTED']).nullable().optional(),
}).passthrough();

export const authResponseSchema = z.object({
  data: z.object({
    accessToken: z.string().min(1),
    refreshToken: z.string().min(1),
  }).passthrough(),
}).passthrough();

export const paginatedResponseSchema = z.object({
  data: z.union([z.array(z.unknown()), z.object({ items: z.array(z.unknown()) }).passthrough()]),
  meta: z.object({ total: z.number().nonnegative().optional(), page: z.number().positive().optional(), limit: z.number().positive().optional() }).passthrough().optional(),
}).passthrough();

export type MobileUser = z.infer<typeof mobileUserSchema>;

export const parseUserResponse = (payload: unknown): MobileUser => {
  const candidate = (payload as { data?: unknown })?.data;
  return mobileUserSchema.parse(candidate && typeof candidate === 'object' && 'data' in candidate ? (candidate as { data: unknown }).data : candidate);
};

export const parseStoredUser = (value: string): MobileUser | null => {
  try {
    return mobileUserSchema.parse(JSON.parse(value));
  } catch {
    return null;
  }
};
