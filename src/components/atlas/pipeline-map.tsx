
'use client';
import { useEffect, useRef } from 'react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import type { Panchayat, Pipeline, Valve, Pump, Tank, ComplaintMarker } from '@/lib/gis-data';
import Image from 'next/image';

// --- Custom Icon Definitions ---

// Fix for default Leaflet icon path issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom Icons
const createDivIcon = (content: string, className: string = '') => L.divIcon({ 
    html: content, 
    className: `bg-transparent border-0 ${className}`, 
    iconSize: [24, 24], 
    iconAnchor: [12, 12],
    popupAnchor: [0, -12]
});

const pumpIcon = createDivIcon('P', 'w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center font-bold text-sm');
const valveIcon = createDivIcon('V', 'w-6 h-6 bg-gray-500 text-white rounded-full flex items-center justify-center font-bold text-sm');
const tankIcon = createDivIcon('T', 'w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center font-bold text-sm');
const complaintIcon = createDivIcon('!', 'w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center font-bold text-lg');


const getIconForFeature = (type: string) => {
    switch(type) {
        case 'pump': return pumpIcon;
        case 'valve': return valveIcon;
        case 'tank': return tankIcon;
        case 'complaint': return complaintIcon;
        default: return new L.Icon.Default();
    }
}

interface PipelineMapProps {
  panchayat: Panchayat | null;
  pipelines: Pipeline[];
  pumps: Pump[];
  tanks: Tank[];
  valves: Valve[];
  complaints: ComplaintMarker[];
  onMarkAsResolved: (complaintId: string) => void;
}

export function PipelineMap({ panchayat, pipelines, pumps, tanks, valves, complaints, onMarkAsResolved }: PipelineMapProps) {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<L.Map | null>(null);
    
    // Using refs for layer groups to avoid re-adding them on every render
    const pipelineLayerRef = useRef<L.FeatureGroup | null>(null);
    const pumpLayerRef = useRef<L.FeatureGroup | null>(null);
    const tankLayerRef = useRef<L.FeatureGroup | null>(null);
    const valveLayerRef = useRef<L.FeatureGroup | null>(null);
    const complaintLayerRef = useRef<L.FeatureGroup | null>(null);

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

            // Initialize layer groups and add them to the map
            pipelineLayerRef.current = L.featureGroup().addTo(map);
            pumpLayerRef.current = L.featureGroup().addTo(map);
            tankLayerRef.current = L.featureGroup().addTo(map);
            valveLayerRef.current = L.featureGroup().addTo(map);
            complaintLayerRef.current = L.featureGroup().addTo(map);
            
            mapRef.current = map;
        }
    }, [panchayat]);

    // Generic function to update layers
    const updateLayer = <T extends { id: string; geometry: any; properties: any; }>(
        features: T[],
        layerGroupRef: React.MutableRefObject<L.FeatureGroup | null>
    ) => {
        const layer = layerGroupRef.current;
        if (!layer) return;

        layer.clearLayers();

        features.forEach(feature => {
            const { geometry, properties } = feature;
            let leafletLayer: L.Layer | null = null;
            
            if (geometry.type === 'LineString') {
                 // Leaflet uses [lat, lng], GeoJSON uses [lng, lat]
                const latLngs = geometry.coordinates.map(coord => L.latLng(coord[1], coord[0]));
                leafletLayer = L.polyline(latLngs, { color: '#1E90FF', weight: 3 });
            } else if (geometry.type === 'Point') {
                 // Leaflet uses [lat, lng], GeoJSON uses [lng, lat]
                const latLng = L.latLng(geometry.coordinates[1], geometry.coordinates[0]);
                leafletLayer = L.marker(latLng, { icon: getIconForFeature(properties.asset_type) });
            }
            
            if (leafletLayer) {
                const popupContent = `
                    <div class="space-y-1 text-sm">
                        <h4 class="font-bold text-base">${properties.name || properties.issueType || `Asset ${properties.asset_id}`}</h4>
                        <p><strong>Type:</strong> ${properties.asset_type || 'N/A'}</p>
                        ${properties.installation_date ? `<p><strong>Installed:</strong> ${properties.installation_date}</p>` : ''}
                        ${properties.last_maintenance ? `<p><strong>Last Service:</strong> ${properties.last_maintenance}</p>` : ''}
                        <p><strong>Status:</strong> ${properties.status || 'N/A'}</p>
                        ${properties.complaints !== undefined ? `<p><strong>Complaints:</strong> ${properties.complaints}</p>` : ''}
                    </div>
                `;
                leafletLayer.bindPopup(popupContent);
                layer.addLayer(leafletLayer);
            }
        });
    };

    useEffect(() => updateLayer(pipelines, pipelineLayerRef), [pipelines]);
    useEffect(() => updateLayer(pumps, pumpLayerRef), [pumps]);
    useEffect(() => updateLayer(tanks, tankLayerRef), [tanks]);
    useEffect(() => updateLayer(valves, valveLayerRef), [valves]);
    useEffect(() => updateLayer(complaints, complaintLayerRef), [complaints]);

  return (
    <div className="relative w-full h-[70vh] border rounded-lg overflow-hidden bg-muted">
        <div ref={mapContainerRef} style={{ height: '100%', width: '100%' }} />
        <div className="leaflet-bottom leaflet-right">
            <div className="leaflet-control leaflet-bar bg-white p-2 rounded-md shadow">
                <h4 className="font-bold text-sm mb-2">Legend</h4>
                <ul className="text-xs space-y-1">
                    <li className="flex items-center gap-2">
                        <div className="w-4 h-0.5 bg-[#1E90FF]"></div>
                        <span>Pipeline</span>
                    </li>
                     <li className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full bg-green-500"></div>
                        <span>Pump House</span>
                    </li>
                     <li className="flex items-center gap-2">
                         <div className="w-4 h-4 rounded-full bg-purple-500"></div>
                        <span>Tank</span>
                    </li>
                    <li className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full bg-gray-500"></div>
                        <span>Valve</span>
                    </li>
                     <li className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full bg-red-500"></div>
                        <span>Complaint</span>
                    </li>
                </ul>
            </div>
        </div>
    </div>
  );
}
