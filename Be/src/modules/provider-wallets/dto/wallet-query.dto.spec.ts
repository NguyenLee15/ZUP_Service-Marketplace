import 'reflect-metadata';
import { validate } from 'class-validator';
import { AdminWalletRequestQueryDto } from './wallet-query.dto';

describe('AdminWalletRequestQueryDto', () => {
  it.each(['INVALID', 'pending', ''])(
    'rejects invalid status %s',
    async (status) => {
      const dto = Object.assign(new AdminWalletRequestQueryDto(), { status });
      await expect(validate(dto)).resolves.toEqual(
        expect.arrayContaining([
          expect.objectContaining({ property: 'status' }),
        ]),
      );
    },
  );

  it.each(['all', 'PENDING', 'APPROVED', 'REJECTED', 'EXPIRED'])(
    'accepts status %s',
    async (status) => {
      const dto = Object.assign(new AdminWalletRequestQueryDto(), { status });
      await expect(validate(dto)).resolves.toHaveLength(0);
    },
  );
});
