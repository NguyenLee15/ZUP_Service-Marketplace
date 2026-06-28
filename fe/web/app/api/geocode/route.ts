import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const addressQuery = searchParams.get('address')
    const lat = searchParams.get('lat')
    const lng = searchParams.get('lng')
    
    if (!addressQuery && (!lat || !lng)) {
      return NextResponse.json({ error: 'Address or lat/lng is required' }, { status: 400 })
    }

    const headers = { 'User-Agent': 'zup-service-marketplace-v1' }
    let rawData: any = null

    if (lat && lng) {
      // Reverse Geocoding
      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
      const res = await fetch(url, { headers })
      rawData = await res.json()
      if (rawData.error) rawData = null
    } else if (addressQuery) {
      // Forward Geocoding
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(addressQuery)}&format=json&addressdetails=1&countrycodes=vn&limit=1`
      const res = await fetch(url, { headers })
      const list = await res.json()
      if (list && list.length > 0) {
        rawData = list[0]
      }
    }

    if (!rawData) {
      return NextResponse.json({ results: [] })
    }

    const addr = rawData.address || {}
    const components = []

    if (addr.city || addr.state || addr.province) {
      components.push({ long_name: addr.city || addr.state || addr.province, types: ["administrative_area_level_1"] })
    }
    if (addr.county || addr.district || addr.suburb) {
      components.push({ long_name: addr.county || addr.district || addr.suburb, types: ["administrative_area_level_2"] })
    }
    if (addr.quarter || addr.village || addr.neighbourhood || addr.town) {
      components.push({ long_name: addr.quarter || addr.village || addr.neighbourhood || addr.town, types: ["administrative_area_level_3"] })
    }
    if (addr.road || addr.pedestrian || addr.path) {
      components.push({ long_name: addr.road || addr.pedestrian || addr.path, types: ["route"] })
    }

    const mappedResult = {
      formatted_address: rawData.display_name,
      geometry: {
        location: {
          lat: parseFloat(rawData.lat),
          lng: parseFloat(rawData.lon)
        }
      },
      address_components: components
    }

    return NextResponse.json({ results: [mappedResult] })
  } catch (error) {
    console.error('Geocoding error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
