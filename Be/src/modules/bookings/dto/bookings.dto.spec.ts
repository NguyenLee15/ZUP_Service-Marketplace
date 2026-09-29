import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateBookingDto } from './bookings.dto';

describe('CreateBookingDto', () => {
  const validPayload = {
    serviceId: 1,
    description: 'Cần sửa đường ống nước trong bếp',
    province: 'Hà Nội',
    district: 'Ba Đình',
    ward: 'Phúc Xá',
    addressDetail: '12 phố Hàng Than',
    desiredTime: '2030-01-01T10:00:00.000Z',
  };

  it('rejects blank and short descriptions plus blank address fields', async () => {
    const dto = plainToInstance(CreateBookingDto, {
      ...validPayload,
      description: 'ngắn',
      province: '',
      ward: '',
      addressDetail: '',
    });

    const errors = await validate(dto);

    expect(errors.map((error) => error.property)).toEqual(
      expect.arrayContaining(['description', 'province', 'ward', 'addressDetail']),
    );
  });

  it('accepts a complete booking request', async () => {
    const errors = await validate(
      plainToInstance(CreateBookingDto, validPayload),
    );

    expect(errors).toHaveLength(0);
  });
});
