import { BadRequestException } from '@nestjs/common';
import { UsersController } from './users.controller';

describe('UsersController KYC validation', () => {
  it('rejects missing required KYC files as a bad request', async () => {
    const controller = new UsersController(
      {} as never,
      { submitKyc: jest.fn() } as never,
    );

    await expect(
      controller.submitKyc(7, '127.0.0.1', {}),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
