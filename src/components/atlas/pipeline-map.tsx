
'use client';
import { useEffect, useRef } from 'react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import type { Panchayat, PipelineFeature, ValveFeature, PumpFeature, TankFeature, ComplaintFeature, GisProperties } from '@/lib/gis-data';
import Image from 'next/image';

// --- Custom Icon Definitions ---

// Reset default icon path
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Helper for creating custom HTML-based icons
const createDivIcon = (content: string, className: string = '') => L.divIcon({ 
    html: content, 
    className: `bg-transparent border-0 ${className}`, 
    iconSize: [24, 24], 
    iconAnchor: [12, 12],
    popupAnchor: [0, -12]
});

// Define specific icons for each asset type
const pumpIcon = createDivIcon('<div class="w-6 h-6 bg-green-500 rounded-full border-2 border-white shadow-md"></div>', 'pump-icon');
const valveIcon = createDivIcon('<div class="w-6 h-6 bg-gray-500 rounded-full border-2 border-white shadow-md flex items-center justify-center text-white font-bold text-xs">V</div>', 'valve-icon');
const tankIcon = createDivIcon('<div class="w-6 h-6 bg-purple-500 rounded-sm border-2 border-white shadow-md"></div>', 'tank-icon');

// A pulsing icon for complaints
const complaintIcon = L.divIcon({
    className: 'leaflet-pulsing-icon',
    iconSize: [20, 20],
    html: '<div class="w-5 h-5 bg-red-500 rounded-full border-2 border-white"></div>'
});

const getIconForFeature = (type: GisProperties['asset_type']) => {
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
  pipelines: PipelineFeature[];
  pumps: PumpFeature[];
  tanks: TankFeature[];
  valves: ValveFeature[];
  complaints: ComplaintFeature[];
}

export function PipelineMap({ panchayat, pipelines, pumps, tanks, valves, complaints }: PipelineMapProps) {
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

            pipelineLayerRef.current = L.featureGroup().addTo(map);
            pumpLayerRef.current = L.featureGroup().addTo(map);
            tankLayerRef.current = L.featureGroup().addTo(map);
            valveLayerRef.current = L.featureGroup().addTo(map);
            complaintLayerRef.current = L.featureGroup().addTo(map);
            
            mapRef.current = map;
        }
    }, [panchayat]);

    // Generic function to update feature layers
    const updateFeatureLayer = <T extends { id: string; type: "Feature"; geometry: any; properties: any; }>(
        features: T[],
        layerGroupRef: React.MutableRefObject<L.FeatureGroup | null>
    ) => {
        const layer = layerGroupRef.current;
        if (!layer) return;

        layer.clearLayers();

        features.forEach(feature => {
            const { geometry, properties } = feature;
            let leafletLayer: L.Layer | null = null;
            
            const assetType = properties.asset_type || (properties.issueType ? 'complaint' : 'unknown');

            if (geometry.type === 'LineString') {
                const latLngs = geometry.coordinates.map((coord: [number, number]) => L.latLng(coord[1], coord[0]));
                leafletLayer = L.polyline(latLngs, { color: '#1E90FF', weight: 4 });
            } else if (geometry.type === 'Point') {
                const latLng = L.latLng(geometry.coordinates[1], geometry.coordinates[0]);
                leafletLayer = L.marker(latLng, { icon: getIconForFeature(assetType) });
            }
            
            if (leafletLayer) {
                const popupContent = `
                    <div class="space-y-1 text-sm">
                        <h4 class="font-bold text-base">${properties.name || properties.issueType || `Asset ${properties.asset_id}`}</h4>
                        <p><strong>Type:</strong> ${properties.asset_type || 'Complaint'}</p>
                        ${properties.address ? `<p><strong>Location:</strong> ${properties.address}</p>` : ''}
                        ${properties.village ? `<p><strong>Village:</strong> ${properties.village}</p>` : ''}
                        <p><strong>Status:</strong> ${properties.status || 'N/A'}</p>
                        ${properties.last_updated ? `<p><strong>Last Updated:</strong> ${new Date(properties.last_updated).toLocaleDateString()}</p>` : ''}
                    </div>
                `;
                leafletLayer.bindPopup(popupContent);
                layer.addLayer(leafletLayer);
            }
        });
    };

    useEffect(() => updateFeatureLayer(pipelines, pipelineLayerRef), [pipelines]);
    useEffect(() => updateFeatureLayer(pumps, pumpLayerRef), [pumps]);
    useEffect(() => updateFeatureLayer(tanks, tankLayerRef), [tanks]);
    useEffect(() => updateFeatureLayer(valves, valveLayerRef), [valves]);
    useEffect(() => updateFeatureLayer(complaints, complaintLayerRef), [complaints]);

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
        `}
        </style>
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
                         <div className="w-4 h-4 rounded-sm bg-purple-500"></div>
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

    