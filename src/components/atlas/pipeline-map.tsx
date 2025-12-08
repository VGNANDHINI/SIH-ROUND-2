
'use client';
import { useEffect, useRef } from 'react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import type { Pipeline, Marker as MarkerType, Panchayat } from '@/lib/gis-data';
import Image from 'next/image';

// --- Custom Icon Definitions ---

// Fix for default Leaflet icon path issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom Water Tank Icon
const waterTankIcon = L.icon({
    iconUrl: '/assets/icons/water_tank.png', // The path to your asset in the `public` folder
    iconSize: [32, 32], // The size of the icon in pixels
    iconAnchor: [16, 32], // The point of the icon which will correspond to the marker's location
    popupAnchor: [0, -32] // The point from which the popup should open relative to the iconAnchor
});

// Custom Pump House Icon
const pumpHouseIcon = L.icon({
    iconUrl: '/assets/icons/pump_house.png',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
});


const getIcon = (type: MarkerType['type']) => {
    const iconHtml = (color: string, symbol: string) => `<div style="font-size: 24px; color: ${color};">${symbol}</div>`;

    switch(type) {
        case 'Tank': return waterTankIcon;
        case 'Pump': return pumpHouseIcon;
        case 'Valve': return L.divIcon({ html: iconHtml('grey', '⚙️'), className: '', iconSize: [24, 24], iconAnchor: [12, 12] });
        case 'Alert': return L.divIcon({ html: iconHtml('red', '🔴'), className: '', iconSize: [24, 24], iconAnchor: [12, 12] });
        case 'Complaint': return L.divIcon({ html: iconHtml('red', '🔴'), className_:'', iconSize: [24, 24], iconAnchor: [12,12] });
        case 'Operator': return L.divIcon({ html: iconHtml('green', '🟢'), className: '', iconSize: [24, 24], iconAnchor: [12, 12] });
        case 'Pump Fault': return new L.Icon({ iconUrl: 'https://unpkg.com/lucide-static@latest/icons/alert-triangle.svg', iconSize: [24, 24], iconAnchor: [12, 12], className: 'text-orange-500' });
        case 'Leak Cluster': return L.divIcon({ html: iconHtml('purple', '🟣'), className: '', iconSize: [24, 24], iconAnchor: [12, 12] });
        default: return new L.Icon.Default();
    }
}

interface PipelineMapProps {
  pipelines: Pipeline[];
  markers: MarkerType[];
  onMarkAsResolved: (complaintId: string) => void;
  panchayat: Panchayat | null;
}

export function PipelineMap({ pipelines, markers, onMarkAsResolved, panchayat }: PipelineMapProps) {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<L.Map | null>(null);
    const pipelineLayerRef = useRef<L.LayerGroup | null>(null);
    const markerLayerRef = useRef<L.LayerGroup | null>(null);

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

            pipelineLayerRef.current = L.layerGroup().addTo(map);
            markerLayerRef.current = L.layerGroup().addTo(map);
            
            mapRef.current = map;
        }

        // Cleanup function to destroy the map instance
        return () => {
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
            }
        };
    }, []); // Only run this effect once

    // Effect to update map view when panchayat changes
    useEffect(() => {
        if (mapRef.current && panchayat) {
            mapRef.current.setView([panchayat.center.lat, panchayat.center.lng], panchayat.zoom);
        }
    }, [panchayat]);


    // Effect to update pipelines
    useEffect(() => {
        const layer = pipelineLayerRef.current;
        if (!layer) return;

        layer.clearLayers();
        pipelines.forEach(pipeline => {
            const polyline = L.polyline(pipeline.path, { color: 'blue', weight: 3 });
            const popupContent = `<b>Pipeline ID:</b> ${pipeline.id} <br/>
                                <b>Length:</b> ${pipeline.length}m <br/>
                                <b>Village Served:</b> ${pipeline.villageServed} <br/>
                                <b>Pressure Status:</b> Normal <br/>
                                <b>Active Complaints:</b> 0`;
            polyline.bindPopup(popupContent);
            layer.addLayer(polyline);
        });
    }, [pipelines]);


    // Effect to update markers
    useEffect(() => {
        const layer = markerLayerRef.current;
        if (!layer) return;

        layer.clearLayers();
        markers.forEach(marker => {
            if (!marker.position) return;
            const leafletMarker = L.marker([marker.position.lat, marker.position.lng], { icon: getIcon(marker.type) });
            
            let popupContent = `<div class="space-y-2">
                                <h4 class="font-bold">${marker.label} (${marker.type})</h4>`;
            
            if (marker.data?.issueType) {
                 popupContent += `<p><b>Issue:</b> ${marker.data.issueType}</p>
                               <p><b>Address:</b> ${marker.data.address}</p>
                               <p><b>Status:</b> ${marker.data.status}</p>
                               <div id="resolve-btn-container-${marker.id}"></div>`;
            } else if (marker.data?.capacity) {
                popupContent += `<p><b>Capacity:</b> ${marker.data.capacity} Liters</p>`;
            } else if (marker.data) {
                popupContent += `<p>Details not available for this marker type.</p>`;
            }
            
            popupContent += `</div>`;
            
            const popup = leafletMarker.bindPopup(popupContent);

            popup.on('add', () => {
                if (marker.data?.issueType) {
                    const container = document.getElementById(`resolve-btn-container-${marker.id}`);
                    if (container) {
                         const button = document.createElement('button');
                         button.innerHTML = 'Mark as Resolved';
                         button.className = 'w-full p-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90';
                         button.onclick = () => onMarkAsResolved(marker.id);
                         container.appendChild(button);
                    }
                }
            });

            layer.addLayer(leafletMarker);
        });
    }, [markers, onMarkAsResolved]);


  return (
    <div className="relative w-full h-[70vh] border rounded-lg overflow-hidden bg-muted">
        <div ref={mapContainerRef} style={{ height: '100%', width: '100%' }} />
        <div className="leaflet-bottom leaflet-right">
            <div className="leaflet-control leaflet-bar bg-white p-2 rounded-md shadow">
                <h4 className="font-bold text-sm mb-2">Legend</h4>
                <ul className="text-xs space-y-1">
                    <li className="flex items-center gap-2">
                        <div className="w-4 h-0.5 bg-blue-600"></div>
                        <span className="font-bold">Water Pipeline</span>
                    </li>
                     <li className="flex items-center gap-2">
                        <Image src="/assets/icons/water_tank.png" alt="tank icon" width={16} height={16} />
                        <span className="font-bold">Overhead Tank</span>
                    </li>
                     <li className="flex items-center gap-2">
                        <Image src="/assets/icons/pump_house.png" alt="pump icon" width={16} height={16} />
                        <span className="font-bold">Pump House</span>
                    </li>
                    <li className="flex items-center gap-2">
                        <span className="text-lg">⚙️</span>
                        <span className="font-bold">Valve</span>
                    </li>
                     <li className="flex items-center gap-2">
                        <span className="text-lg">🔴</span>
                        <span className="font-bold">Leak/Complaint</span>
                    </li>
                     <li className="flex items-center gap-2">
                        <span className="text-lg">🟢</span>
                        <span className="font-bold">Operator</span>
                    </li>
                </ul>
            </div>
        </div>
    </div>
  );
}
