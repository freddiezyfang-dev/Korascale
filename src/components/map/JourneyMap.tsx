'use client';

import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default icon issue
if (typeof window !== 'undefined') {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  });
}

interface JourneyMapProps {
  location?: string;
  city?: string;
  region?: string;
  title?: string;
  className?: string;
}

// Component to automatically update map view
function MapViewUpdater({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  
  useEffect(() => {
    map.setView(center, zoom);
  }, [map, center, zoom]);
  
  return null;
}

export default function JourneyMap({ location, city, region, title, className = '' }: JourneyMapProps) {
  const [coordinates, setCoordinates] = useState<[number, number] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Geocoding: Convert address to coordinates
  useEffect(() => {
    const geocodeLocation = async () => {
      setIsLoading(true);
      setError(null);
      
      // Prioritize city (English name shown on card)
      const queryParts = [city, location, region, 'China'].filter(Boolean);
      const query = queryParts.join(', ');
      
      try {
        // Use OpenStreetMap Nominatim API (free, no API key required)
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`,
          {
            headers: {
              'User-Agent': 'Korascale Travel Website' // Nominatim requires User-Agent header
            }
          }
        );
        
        if (!response.ok) {
          throw new Error('Geocoding failed');
        }
        
        const data = await response.json();
        
        if (data && data.length > 0) {
          const lat = parseFloat(data[0].lat);
          const lon = parseFloat(data[0].lon);
          setCoordinates([lat, lon]);
        } else {
          // If exact location not found, use default coordinates (China center)
          setCoordinates([35.8617, 104.1954]);
          setError('Unable to locate city precisely, showing China map');
        }
      } catch (err) {
        console.error('Geocoding error:', err);
        // Fallback to China center
        setCoordinates([35.8617, 104.1954]);
        setError('Map loading failed, showing default location');
      } finally {
        setIsLoading(false);
      }
    };

    if (city || location || region) {
      geocodeLocation();
    } else {
      // Fallback
      setCoordinates([35.8617, 104.1954]);
      setIsLoading(false);
    }
  }, [location, city, region]);

  if (isLoading) {
    return (
      <div className={`h-[400px] lg:h-[600px] bg-gray-100 rounded-lg flex items-center justify-center ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-2"></div>
          <p className="text-gray-600 text-sm">Loading map...</p>
        </div>
      </div>
    );
  }

  if (!coordinates) {
    return (
      <div className={`h-[400px] lg:h-[600px] bg-gray-100 rounded-lg flex items-center justify-center ${className}`}>
        <p className="text-gray-600">Unable to load map</p>
      </div>
    );
  }

  return (
    <div className={`h-[400px] lg:h-[600px] rounded-lg overflow-hidden ${className}`}>
      <MapContainer
        center={coordinates}
        zoom={10}
        scrollWheelZoom={true}
        style={{ height: '100%', width: '100%' }}
        className="z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={coordinates}>
          <Popup>
            <div className="text-center">
              <strong>{title || city || location}</strong>
              {city && <p className="text-sm text-gray-600">{city}</p>}
              {region && <p className="text-sm text-gray-600">{region}</p>}
            </div>
          </Popup>
        </Marker>
        <MapViewUpdater center={coordinates} zoom={10} />
      </MapContainer>
      {error && (
        <div className="absolute bottom-2 left-2 bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">
          {error}
        </div>
      )}
    </div>
  );
}

