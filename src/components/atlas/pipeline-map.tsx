
'use client';
import { useEffect, useRef } from 'react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// --- Custom Icon Definitions ---

// Reset default icon path
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Helper for creating custom HTML-based icons
const createDivIcon = (html: string, className: string = '', size: [number, number] = [24, 24]) => L.divIcon({ 
    html, 
    className: `bg-transparent border-0 ${className}`, 
    iconSize: size, 
    iconAnchor: [size[0] / 2, size[1]], // Point to the bottom center of the icon
    popupAnchor: [0, -size[1]] // Popup above the icon
});

// Specific icons for different asset types
const pumpIcon = createDivIcon('<div class="w-6 h-6 bg-purple-600 rounded-full border-2 border-white shadow-md flex items-center justify-center text-white text-xs font-bold">P</div>', 'pump-icon');
const valveIcon = createDivIcon('<div style="font-size: 24px; color: #dc3545;">★</div>', 'valve-icon');
const tankIcon = createDivIcon('<div class="w-6 h-6 bg-green-500 border-2 border-white shadow-md"></div>', 'tank-icon');
const tapIcon = createDivIcon('<div class="w-5 h-5 bg-yellow-400 rounded-full border-2 border-white shadow-md"></div>', 'tap-icon');

const leakageIcon = L.divIcon({
    className: 'leaflet-pulsing-icon',
    iconSize: [20, 20],
    html: '<div class="w-5 h-5 bg-red-500 rounded-full border-2 border-white"></div>'
});

const liveAlertIcon = createDivIcon('<div class="w-6 h-6 bg-orange-500 rounded-full border-2 border-white shadow-md flex items-center justify-center text-white font-bold">!</div>', 'live-alert-icon');


const getIconForFeature = (type: string) => {
    switch(type) {
        case 'pump_house': return pumpIcon;
        case 'valve': return valveIcon;
        case 'oh_tank': return tankIcon;
        case 'public_tap': return tapIcon;
        case 'leakage': return leakageIcon;
        case 'live_alert': return liveAlertIcon;
        default: return new L.Icon.Default();
    }
}

interface Pipeline {
  id: string;
  path: { lat: number; lng: number }[];
  color: string;
  [key: string]: any;
}

interface Marker {
  id: string;
  name?: string;
  location: { lat: number; lng: number };
  icon: string;
  [key: string]: any;
}

interface PipelineMapProps {
  panchayat: { center: { lat: number; lng: number }, zoom: number } | null;
  pipelines: Pipeline[];
  markers: Marker[];
}

export function PipelineMap({ panchayat, pipelines, markers }: PipelineMapProps) {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<L.Map | null>(null);
    
    const pipelineLayerRef = useRef<L.FeatureGroup | null>(null);
    const markerLayerRef = useRef<L.FeatureGroup | null>(null);

    // Initialize map
    useEffect(() => {
        if (mapContainerRef.current && !mapRef.current) {
            const center = panchayat?.center || { lat: 12.825, lng: 80.045 };
            const zoom = panchayat?.zoom || 15;

            const map = L.map(mapContainerRef.current, {
                center: [center.lat, center.lng],
                zoom: zoom,
            });

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            }).addTo(map);

            pipelineLayerRef.current = L.featureGroup().addTo(map);
            markerLayerRef.current = L.featureGroup().addTo(map);
            
            mapRef.current = map;
        }
    }, [panchayat]);

    // Update pipelines
    useEffect(() => {
        const layer = pipelineLayerRef.current;
        if (!layer) return;
        layer.clearLayers();

        pipelines.forEach(pipeline => {
            const latLngs = pipeline.path.map(p => L.latLng(p.lat, p.lng));
            const leafletLayer = L.polyline(latLngs, { color: pipeline.color || '#0080FF', weight: 4 });
            
            const popupContent = `
                <div class="space-y-1 text-sm">
                    <h4 class="font-bold text-base">${pipeline.name || `Pipeline ${pipeline.id}`}</h4>
                    <p><strong>Type:</strong> Pipeline</p>
                    <p><strong>Diameter:</strong> ${pipeline.diameter_mm} mm</p>
                    <p><strong>Material:</strong> ${pipeline.material}</p>
                    <p><strong>Status:</strong> ${pipeline.status}</p>
                </div>
            `;
            leafletLayer.bindPopup(popupContent);
            layer.addLayer(leafletLayer);
        });
    }, [pipelines]);

    // Update markers
    useEffect(() => {
        const layer = markerLayerRef.current;
        if (!layer) return;
        layer.clearLayers();

        markers.forEach(marker => {
            const latLng = L.latLng(marker.location.lat, marker.location.lng);
            const leafletLayer = L.marker(latLng, { icon: getIconForFeature(marker.icon) });

            const popupContent = `
                <div class="space-y-1 text-sm">
                    <h4 class="font-bold text-base">${marker.name || marker.type || `Asset ${marker.id}`}</h4>
                    <p><strong>Type:</strong> ${marker.icon.replace(/_/g, ' ')}</p>
                    ${marker.status ? `<p><strong>Status:</strong> ${marker.status}</p>`: ''}
                    ${marker.capacity_liters ? `<p><strong>Capacity:</strong> ${marker.capacity_liters} L</p>`: ''}
                    ${marker.severity ? `<p><strong>Severity:</strong> ${marker.severity}</p>`: ''}
                    ${marker.timestamp ? `<p><strong>Reported:</strong> ${new Date(marker.timestamp).toLocaleString()}</p>`: ''}
                </div>
            `;
            leafletLayer.bindPopup(popupContent);
            layer.addLayer(leafletLayer);
        });
    }, [markers]);


  return (
    <div className="relative w-full h-[70vh] border rounded-lg overflow-hidden bg-muted">
        <style>
        {`
            .leaflet-pulsing-icon {
                border-radius: 50%;
                box-shadow: 0 0 0 rgba(239, 68, 68, 0.7);
                animation: pulse 1.5s infinite;
            }
            @keyframes pulse {
                0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
                70% { box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
                100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
            }
            .valve-icon div { line-height: 24px; text-align: center; }
            .pump-icon div, .live-alert-icon div { line-height: 24px; text-align: center; }
        `}
        </style>
        <div ref={mapContainerRef} style={{ height: '100%', width: '100%' }} />
        <div className="leaflet-bottom leaflet-right">
            <div className="leaflet-control leaflet-bar bg-white p-2 rounded-md shadow">
                <h4 className="font-bold text-sm mb-2">Legend</h4>
                <ul className="text-xs space-y-1">
                    <li className="flex items-center gap-2">
                        <div className="w-4 h-1 bg-[#005BBB]"></div><span>Main Pipeline</span>
                    </li>
                    <li className="flex items-center gap-2">
                        <div className="w-4 h-1 bg-[#28A745]"></div><span>Distribution Line</span>
                    </li>
                    <li className="flex items-center gap-2">
                        <div className="w-4 h-1 bg-[#F39C12]"></div><span>Lateral Line</span>
                    </li>
                    <li className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-purple-600 rounded-full flex items-center justify-center text-white text-[10px] font-bold">P</div>
                        <span>Pump House</span>
                    </li>
                     <li className="flex items-center gap-2">
                         <div className="w-4 h-4 bg-green-500"></div>
                        <span>Overhead Tank</span>
                    </li>
                    <li className="flex items-center gap-2">
                        <div style={{ fontSize: '16px', color: '#dc3545', width: '16px', textAlign: 'center' }}>★</div>
                        <span>Valve</span>
                    </li>
                    <li className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-yellow-400 rounded-full"></div>
                        <span>Public Tap</span>
                    </li>
                     <li className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full bg-red-500"></div>
                        <span>Leakage Alert</span>
                    </li>
                    <li className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full bg-orange-500 flex items-center justify-center text-white text-xs font-bold">!</div>
                        <span>Live Alert</span>
                    </li>
                </ul>
            </div>
        </div>
    </div>
  );
}
