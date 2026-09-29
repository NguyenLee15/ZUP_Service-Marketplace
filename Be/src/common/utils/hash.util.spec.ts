import * as bcrypt from 'bcrypt';
import { needsPasswordRehash } from './hash.util';

describe('password hash policy', () => {
  it('requires rehashing hashes below the production cost factor', async () => {
    const hash = await bcrypt.hash('secret', 10);
    expect(needsPasswordRehash(hash)).toBe(true);
  });

  it('accepts hashes at the production cost factor', async () => {
    const hash = await bcrypt.hash('secret', 12);
    expect(needsPasswordRehash(hash)).toBe(false);
  });
});
