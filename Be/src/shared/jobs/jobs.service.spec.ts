import { ConfigService } from '@nestjs/config';
import { JobsService, JobName } from './jobs.service';

describe('JobsService', () => {
  it('enqueues Redis jobs with bounded retry policy', async () => {
    const queue = { add: jest.fn().mockResolvedValue({ id: 'job-1' }) };
    const service = new JobsService(
      {
        get: jest.fn().mockReturnValue('redis'),
      } as unknown as ConfigService,
      {
        get: jest.fn().mockReturnValue(queue),
      } as never,
      {} as never,
    );

    await service.enqueue(JobName.AuthSendOtp, {
      email: 'user@test.local',
      otp: '123456',
    });

    expect(queue.add).toHaveBeenCalledWith(
      JobName.AuthSendOtp,
      { email: 'user@test.local', otp: '123456' },
      expect.objectContaining({
        attempts: 3,
        backoff: { type: 'exponential', delay: 1000 },
      }),
    );
  });

  it('fails the enqueue when the Redis queue is unavailable', async () => {
    const service = new JobsService(
      { get: jest.fn().mockReturnValue('redis') } as unknown as ConfigService,
      { get: jest.fn().mockReturnValue(undefined) } as never,
      {} as never,
    );

    await expect(
      service.enqueue(JobName.AuthSendOtp, {
        email: 'user@test.local',
        otp: '123456',
      }),
    ).rejects.toThrow(/not registered/);
  });
});
