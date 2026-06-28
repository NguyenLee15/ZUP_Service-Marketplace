'use client'

import React, { useEffect, useState, useRef } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Search, Navigation, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

// Fix Leaflet's default icon path issues in Next.js
if (typeof window !== 'undefined') {
  delete (L.Icon.Default.prototype as any)._getIconUrl
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  })
}

interface MapPickerProps {
  latitude: number
  longitude: number
  searchSuffix?: string
  onChange: (lat: number, lng: number, addressDetails?: any) => void
}

function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap()
  useEffect(() => {
    map.flyTo(center, 16, { animate: true, duration: 1 })
  }, [center, map])
  return null
}

function MapEvents({ onChange }: { onChange: (lat: number, lng: number, details?: any) => void }) {
  useMapEvents({
    async click(e) {
      const lat = e.latlng.lat
      const lng = e.latlng.lng
      onChange(lat, lng) // Immediate visual update
      
      try {
        const res = await fetch(`/api/geocode?lat=${lat}&lng=${lng}`)
        const data = await res.json()
        if (data.results && data.results.length > 0) {
          const result = data.results[0]
          let province = ''
          let district = ''
          let ward = ''
          let street = ''
          
          result.address_components.forEach((component: any) => {
            if (component.types.includes('administrative_area_level_1')) {
              province = component.long_name
            }
            if (component.types.includes('administrative_area_level_2') || component.types.includes('locality')) {
              district = component.long_name
            }
            if (component.types.includes('administrative_area_level_3') || component.types.includes('sublocality_level_1') || component.types.includes('sublocality')) {
              ward = component.long_name
            }
            if (component.types.includes('route')) {
              street = component.long_name
            }
          })
          
          const fullAddress = result.formatted_address
          onChange(lat, lng, { province, district, ward, street, fullAddress })
        }
      } catch (err) {
        console.error('Reverse geocode error:', err)
      }
    },
  })
  return null
}

export default function AddressMapPicker({ latitude, longitude, searchSuffix, onChange }: MapPickerProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [gettingLocation, setGettingLocation] = useState(false)

  const handleSearch = async () => {
    if (!searchQuery.trim()) return
    try {
      setSearching(true)
      const fullQuery = searchSuffix ? `${searchQuery}, ${searchSuffix}` : searchQuery;
      const res = await fetch(`/api/geocode?address=${encodeURIComponent(fullQuery)}`);
      const data = await res.json()
      if (data.results && data.results.length > 0) {
        const lat = data.results[0].geometry.location.lat
        const lon = data.results[0].geometry.location.lng
        onChange(lat, lon)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setSearching(false)
    }
  }

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) return
    setGettingLocation(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onChange(pos.coords.latitude, pos.coords.longitude)
        setGettingLocation(false)
      },
      (err) => {
        console.error(err)
        setGettingLocation(false)
      },
      { enableHighAccuracy: true }
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Input 
            placeholder="Tìm địa điểm trên bản đồ..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleSearch())}
            className="pl-9"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        </div>
        <Button type="button" onClick={handleSearch} disabled={searching} variant="secondary">
          {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Tìm'}
        </Button>
        <Button 
          type="button" 
          variant="outline" 
          className="border-action-blue text-action-blue hover:bg-action-blue/10" 
          onClick={handleGetCurrentLocation}
          disabled={gettingLocation}
        >
          {gettingLocation ? <Loader2 className="w-4 h-4 animate-spin" /> : <Navigation className="w-4 h-4 mr-2" />}
          Vị trí của tôi
        </Button>
      </div>

      <div className="h-[300px] rounded-lg overflow-hidden border border-platinum-tint relative z-0">
        <MapContainer 
          center={[latitude, longitude]} 
          zoom={16} 
          scrollWheelZoom={true} 
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapEvents onChange={onChange} />
          <MapUpdater center={[latitude, longitude]} />
          <Marker position={[latitude, longitude]} />
        </MapContainer>
      </div>
      <p className="text-[11px] text-muted-foreground text-center">Bạn có thể nhấp vào bản đồ để chọn vị trí chính xác</p>
    </div>
  )
}
