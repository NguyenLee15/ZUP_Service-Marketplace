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
