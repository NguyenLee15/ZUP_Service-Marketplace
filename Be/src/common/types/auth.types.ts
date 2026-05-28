import type { Request } from 'express';
import type { Socket } from 'socket.io';
import { UserRole } from '@prisma/client';

export interface JwtTokenPayload {
  sub: number;
  email: string;
  role: UserRole;
}

export interface AuthenticatedUserPayload {
  id: number;
  email: string;
  role: UserRole;
}

export type AuthenticatedRequest = Omit<Request, 'user'> & {
  user?: AuthenticatedUserPayload | null;
};

export interface AuthenticatedSocketData {
  user?: AuthenticatedUserPayload;
}

type SocketEventMap = Record<string, (...args: unknown[]) => void>;

export type AuthenticatedSocket = Socket<
  SocketEventMap,
  SocketEventMap,
  SocketEventMap,
  AuthenticatedSocketData
>;

export function isUserRole(value: unknown): value is UserRole {
  return (
    typeof value === 'string' &&
    Object.values(UserRole).includes(value as UserRole)
  );
}

export function isJwtTokenPayload(value: unknown): value is JwtTokenPayload {
  if (!value || typeof value !== 'object') return false;
  const record = value as Record<string, unknown>;

  return (
    typeof record.sub === 'number' &&
    Number.isInteger(record.sub) &&
    typeof record.email === 'string' &&
    isUserRole(record.role)
  );
}

export function toAuthenticatedUser(
  payload: JwtTokenPayload,
): AuthenticatedUserPayload {
  return {
    id: payload.sub,
    email: payload.email,
    role: payload.role,
  };
}

export function isAuthenticatedUserKey(
  value: string,
): value is keyof AuthenticatedUserPayload {
  return value === 'id' || value === 'email' || value === 'role';
}

export function getSocketUser(socket: AuthenticatedSocket) {
  return socket.data.user;
}

export function extractBearerToken(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  return value.startsWith('Bearer ') ? value.slice(7) : value;
}

export function extractSocketToken(socket: Socket): string | null {
  const auth: unknown = socket.handshake.auth;
  const authToken =
    typeof auth === 'object' && auth !== null && 'token' in auth
      ? auth.token
      : undefined;

  return (
    extractBearerToken(authToken) ??
    extractBearerToken(socket.handshake.headers.authorization)
  );
}
