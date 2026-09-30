import {
  hasValidImageSignature,
  hasValidMediaSignature,
} from './upload-limits.constant';

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

  it.each([
    [
      'video/mp4',
      Buffer.from([
        0, 0, 0, 20, 0x66, 0x74, 0x79, 0x70, 0x69, 0x73, 0x6f, 0x6d,
      ]),
    ],
    [
      'video/quicktime',
      Buffer.from([
        0, 0, 0, 20, 0x66, 0x74, 0x79, 0x70, 0x71, 0x74, 0x20, 0x20,
      ]),
    ],
  ])('accepts a valid %s media signature', (mimetype, buffer) => {
    expect(hasValidMediaSignature(mimetype, buffer)).toBe(true);
  });

  it('rejects forged video MIME before upload', () => {
    expect(
      hasValidMediaSignature('video/mp4', Buffer.from('not-a-video')),
    ).toBe(false);
  });
});
