import { NextResponse } from 'next/server';
import { FALLBACK_ADDRESS_OPTIONS, normalizeAddressOptions } from '@/lib/address-options';

const ADDRESS_API_URL = 'https://provinces.open-api.vn/api/v1/?depth=3';
const CACHE_CONTROL = 'public, s-maxage=86400, stale-while-revalidate=604800';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const response = await fetch(ADDRESS_API_URL, {
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) throw new Error(`Address API returned ${response.status}`);

    const payload = await response.json();
    return NextResponse.json(
      {
        data: normalizeAddressOptions(payload),
        fallback: false,
        source: 'provinces.open-api.vn/api/v1',
      },
      {
        headers: {
          'Cache-Control': CACHE_CONTROL,
        },
      },
    );
  } catch {
    return NextResponse.json(
      {
        data: FALLBACK_ADDRESS_OPTIONS,
        fallback: true,
        source: 'local-fallback',
      },
      {
        headers: {
          'Cache-Control': CACHE_CONTROL,
        },
      },
    );
  }
}
