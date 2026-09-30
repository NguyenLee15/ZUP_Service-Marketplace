import { z } from "zod";

const paginationMetaSchema = z
  .object({
    total: z.number().int().nonnegative(),
    page: z.number().int().positive(),
    limit: z.number().int().positive(),
    totalPages: z.number().int().nonnegative(),
  })
  .passthrough();

const statusCountsSchema = z.object({
  total: z.number().int().nonnegative(),
  active: z.number().int().nonnegative(),
  pending: z.number().int().nonnegative(),
  locked: z.number().int().nonnegative(),
});

const adminUserSchema = z
  .object({
    id: z.number().int(),
    fullName: z.string(),
    email: z.string(),
    phone: z.string().nullable().optional(),
    role: z.enum(["CUSTOMER", "PROVIDER", "ADMIN", "STAFF"]),
    status: z.enum(["ACTIVE", "LOCKED", "PENDING"]),
    emailVerified: z.boolean().optional(),
    avatarUrl: z.string().nullable().optional(),
    createdAt: z.string(),
  })
  .passthrough();

const auditLogActorSchema = z
  .object({
    id: z.number().int().optional(),
    email: z.string().optional(),
    fullName: z.string().optional(),
    role: z.string().optional(),
  })
  .passthrough();

const auditLogSchema = z
  .object({
    id: z.number().int(),
    createdAt: z.string(),
    actor: auditLogActorSchema.nullable().optional(),
    actorId: z.number().int().nullable().optional(),
    action: z.string(),
    targetType: z.string().nullable().optional(),
    targetId: z.union([z.number().int(), z.string()]).nullable().optional(),
    ipAddress: z.string().nullable().optional(),
    description: z.string().nullable().optional(),
  })
  .passthrough();

const adminUserResponseSchema = z
  .object({
    data: z.array(adminUserSchema),
    meta: paginationMetaSchema.extend({ statusCounts: statusCountsSchema }),
  })
  .passthrough();

const auditLogResponseSchema = z
  .object({
    data: z.array(auditLogSchema),
    meta: paginationMetaSchema,
  })
  .passthrough();

const objectItemSchema = z.object({}).passthrough();
const dashboardStatsSchema = z
  .object({
    totalBookings: z.number().optional(),
    totalUsers: z.number().optional(),
    totalProviders: z.number().optional(),
    totalServices: z.number().optional(),
    activeBookings: z.number().optional(),
    pendingBookings: z.number().optional(),
    doneBookings: z.number().optional(),
    cancelledBookings: z.number().optional(),
    totalRevenue: z.number().optional(),
    commissionRevenue: z.number().optional(),
    avgOrderValue: z.number().optional(),
    filterSummary: z.string().optional(),
    isTruncated: z.boolean().optional(),
  })
  .passthrough();

const dashboardChartResponseSchema = z
  .object({
    data: z
      .object({
        revenueData: z.array(objectItemSchema).optional(),
        statusData: z.array(objectItemSchema).optional(),
        provinceData: z.array(objectItemSchema).optional(),
        categoryData: z.array(objectItemSchema).optional(),
        serviceData: z.array(objectItemSchema).optional(),
        filterOptions: objectItemSchema.optional(),
        filterSummary: z.string().optional(),
      })
      .passthrough(),
  })
  .passthrough();

const dashboardStatsResponseSchema = z
  .object({ data: dashboardStatsSchema })
  .passthrough();

const paginatedResponseSchema = z
  .object({
    data: z.array(objectItemSchema),
    meta: paginationMetaSchema,
  })
  .passthrough();

const listResponseSchema = z
  .object({ data: z.array(objectItemSchema) })
  .passthrough();

const objectResponseSchema = z
  .object({ data: objectItemSchema })
  .passthrough();

function parseOrThrow<T>(schema: z.ZodType<T>, payload: unknown, label: string): T {
  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    throw new Error(`Phản hồi ${label} không hợp lệ`);
  }
  return parsed.data;
}

export function parseAdminUsersResponse(payload: unknown) {
  return parseOrThrow(adminUserResponseSchema, payload, "danh sách người dùng");
}

export function parseAdminAuditLogsResponse(payload: unknown) {
  const direct = auditLogResponseSchema.safeParse(payload);
  if (direct.success) return direct.data;

  const nested = z
    .object({ data: auditLogResponseSchema })
    .passthrough()
    .safeParse(payload);
  if (nested.success) return nested.data.data;

  throw new Error("Phản hồi audit logs không hợp lệ");
}

export function parseAdminDashboardStatsResponse(payload: unknown) {
  return parseOrThrow(
    dashboardStatsResponseSchema,
    payload,
    "dashboard stats",
  );
}

export function parseAdminDashboardChartResponse(payload: unknown) {
  return parseOrThrow(
    dashboardChartResponseSchema,
    payload,
    "dashboard chart data",
  );
}

export function parseAdminPaginatedResponse(payload: unknown, label: string) {
  return parseOrThrow(paginatedResponseSchema, payload, label);
}

export function parseAdminListResponse(payload: unknown, label: string) {
  return parseOrThrow(listResponseSchema, payload, label);
}

export function parseAdminObjectResponse(payload: unknown, label: string) {
  return parseOrThrow(objectResponseSchema, payload, label);
}
