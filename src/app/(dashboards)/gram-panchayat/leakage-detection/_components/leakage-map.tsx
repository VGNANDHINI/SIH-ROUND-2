
'use client';
import { useEffect, useRef } from 'react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Timestamp } from 'firebase/firestore';

// Define the structure for processed data with inferred status
type ProcessedSensorReading = {
  id: string;
  timestamp: Timestamp;
  sensor_id: string;
  pressure: number;
  flow_rate: number;
  location: {
    lat: number;
    lng: number;
  };
  inferred_status: 'Normal' | 'Leak Detected' | 'Critical Leakage / Pipe Burst';
};

interface LeakageMapProps {
  sensorData: ProcessedSensorReading[];
}

// Reset default icon path
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const createDivIcon = (color: string) => {
    return L.divIcon({
        html: `<div class="w-4 h-4 rounded-full border-2 border-white" style="background-color: ${color};"></div>`,
        className: 'bg-transparent border-0',
        iconSize: [16, 16],
        iconAnchor: [8, 8],
    });
}

const normalIcon = createDivIcon('#28a745'); // Green
const leakIcon = createDivIcon('#fd7e14'); // Orange
const criticalIcon = createDivIcon('#dc3545'); // Red


const getIconForStatus = (status: ProcessedSensorReading['inferred_status']) => {
  switch (status) {
    case 'Critical Leakage / Pipe Burst':
      return criticalIcon;
    case 'Leak Detected':
      return leakIcon;
    case 'Normal':
    default:
      return normalIcon;
  }
};

const LeakageMap = ({ sensorData }: LeakageMapProps) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerLayerRef = useRef<L.FeatureGroup | null>(null);

  // Initialize map
  useEffect(() => {
    if (mapContainerRef.current && !mapRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [12.828, 80.051], // Default center
        zoom: 15,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);

      markerLayerRef.current = L.featureGroup().addTo(map);
      mapRef.current = map;
    }
  }, []);

  // Update markers when data changes
  useEffect(() => {
    const layer = markerLayerRef.current;
    if (!layer || !mapRef.current) return;
    
    layer.clearLayers();

    if (sensorData.length === 0) return;

    sensorData.forEach((sensor) => {
      if (!sensor.location || typeof sensor.location.lat !== 'number' || typeof sensor.location.lng !== 'number') return;
      
      const latLng = L.latLng(sensor.location.lat, sensor.location.lng);
      const marker = L.marker(latLng, { icon: getIconForStatus(sensor.inferred_status) });

      const popupContent = `
        <div class="space-y-1 text-sm">
          <h4 class="font-bold text-base">Sensor: ${sensor.sensor_id}</h4>
          <p><strong>Status:</strong> ${sensor.inferred_status}</p>
          <p><strong>Pressure:</strong> ${sensor.pressure.toFixed(2)} bar</p>
          <p><strong>Flow Rate:</strong> ${sensor.flow_rate.toFixed(2)} L/s</p>
          <p><strong>Last Reading:</strong> ${sensor.timestamp.toDate().toLocaleString()}</p>
        </div>
      `;
      marker.bindPopup(popupContent);
      layer.addLayer(marker);
    });

    // Fit map to markers if there are any
    const bounds = layer.getBounds();
    if (bounds.isValid()) {
      mapRef.current.fitBounds(bounds, { padding: [50, 50] });
    }

  }, [sensorData]);

  return <div ref={mapContainerRef} className="h-[500px] w-full rounded-lg" />;
};

export default LeakageMap;
