
'use client';
import { GoogleMap, useJsApiLoader, Polyline, MarkerF } from '@react-google-maps/api';
import { useMemo } from 'react';
import type { Pipeline, Marker } from '@/lib/gis-data';
import { Loader2 } from 'lucide-react';

const containerStyle = {
  width: '100%',
  height: '100%',
};

const mapOptions = {
    mapId: 'e9e8f3f1a3f1b39', // A custom map style from Google Cloud Console
    disableDefaultUI: true,
    zoomControl: true,
};

// Custom icons for different markers
const icons = {
    Pump: { url: '/icons/pump-station.svg', scaledSize: { width: 32, height: 32 } },
    Tank: { url: '/icons/water-tank.svg', scaledSize: { width: 32, height: 32 } },
    Valve: { url: '/icons/valve.svg', scaledSize: { width: 24, height: 24 } },
    Alert: { url: '/icons/alert-triangle.svg', scaledSize: { width: 28, height: 28 } },
};

interface PipelineMapProps {
  pipelines: Pipeline[];
  markers: Marker[];
}

export function PipelineMap({ pipelines, markers }: PipelineMapProps) {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
  });

  const center = useMemo(() => {
    if (markers.length > 0) {
      return markers[0].position;
    }
    if (pipelines.length > 0 && pipelines[0].path.length > 0) {
      return pipelines[0].path[0];
    }
    return { lat: 12.825, lng: 80.045 }; // Default center for Anjur
  }, [pipelines, markers]);

  const bounds = useMemo(() => {
    if (!isLoaded) return null;
    const bounds = new window.google.maps.LatLngBounds();
    pipelines.forEach(p => p.path.forEach(point => bounds.extend(point)));
    markers.forEach(m => bounds.extend(m.position));
    return bounds;
  }, [isLoaded, pipelines, markers]);

  if (!isLoaded) return <div className="flex items-center justify-center h-full"><Loader2 className="h-8 w-8 animate-spin"/></div>;

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={center}
      zoom={15}
      options={mapOptions}
      onLoad={map => bounds && map.fitBounds(bounds)}
    >
      {pipelines.map(pipeline => (
        <Polyline
          key={pipeline.id}
          path={pipeline.path}
          options={{
            strokeColor: pipeline.type === 'Rising Main' ? '#1E90FF' : '#FF6347',
            strokeOpacity: 0.8,
            strokeWeight: 4,
          }}
        />
      ))}
      {markers.map(marker => (
        <MarkerF
          key={marker.id}
          position={marker.position}
          label={{ text: marker.label, className: 'font-bold text-xs -translate-y-6 bg-white/70 px-2 py-1 rounded' }}
          icon={icons[marker.type]}
        />
      ))}
    </GoogleMap>
  );
}
