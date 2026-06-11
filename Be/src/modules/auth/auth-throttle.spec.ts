import 'reflect-metadata';
import {
  THROTTLER_LIMIT,
  THROTTLER_SKIP,
  THROTTLER_TTL,
} from '@nestjs/throttler/dist/throttler.constants';
import { ProviderWalletsController } from '../provider-wallets/provider-wallets.controller';
import { AuthController } from './auth.controller';

describe('Auth route throttling metadata', () => {
  it.each([
    ['register', 5],
    ['verifyOtp', 10],
    ['resendOtp', 3],
    ['login', 5],
    ['googleLogin', 10],
    ['providerGoogleLogin', 10],
    ['refresh', 20],
    ['forgotPassword', 3],
    ['resetPassword', 5],
    ['changePassword', 5],
  ] as const)('sets %s throttle limit', (methodName, limit) => {
    const handler = getHandler(AuthController.prototype, methodName);

    expect(Reflect.getMetadata(`${THROTTLER_LIMIT}default`, handler)).toBe(
      limit,
    );
    expect(Reflect.getMetadata(`${THROTTLER_TTL}default`, handler)).toBe(60000);
  });

  it('keeps VNPay IPN outside throttling', () => {
    expect(
      Reflect.getMetadata(
        `${THROTTLER_SKIP}default`,
        getHandler(ProviderWalletsController.prototype, 'vnpayIpnGet'),
      ),
    ).toBe(true);
    expect(
      Reflect.getMetadata(
        `${THROTTLER_SKIP}default`,
        getHandler(ProviderWalletsController.prototype, 'vnpayIpnPost'),
      ),
    ).toBe(true);
  });
});

function getHandler(target: object, methodName: string): object {
  const descriptor = Object.getOwnPropertyDescriptor(target, methodName);
  const value: unknown = descriptor?.value;
  if (typeof value !== 'function') {
    throw new Error(`Missing handler ${methodName}`);
  }
  return value;
}
