import { hasValidImageSignature } from './upload-limits.constant';

describe('hasValidImageSignature', () => {
  it.each([
    ['image/jpeg', Buffer.from([0xff, 0xd8, 0xff, 0x00])],
    [
      'image/png',
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    ],
    ['image/webp', Buffer.from('RIFFxxxxWEBP')],
    ['image/gif', Buffer.from('GIF89a')],
  ])('accepts a valid %s signature', (mimetype, buffer) => {
    expect(hasValidImageSignature(mimetype, buffer)).toBe(true);
  });

  it('rejects a mismatched signature even when MIME is allowed', () => {
    expect(hasValidImageSignature('image/png', Buffer.from('not-a-png'))).toBe(
      false,
    );
  });
});
