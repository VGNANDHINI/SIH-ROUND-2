
'use client';
import { useEffect, useRef } from 'react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import type { Pipeline, Marker as MarkerType, Panchayat } from '@/lib/gis-data';

// Fix for default icon not showing in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});


const getIcon = (type: MarkerType['type']) => {
    const iconHtml = (color: string, symbol: string) => `<div style="font-size: 24px; color: ${color};">${symbol}</div>`;

    switch(type) {
        case 'Tank': return L.divIcon({ html: iconHtml('blue', '🔵'), className: '', iconSize: [24, 24], iconAnchor: [12, 12] });
        case 'Pump': return L.divIcon({ html: iconHtml('gold', '🟡'), className: '', iconSize: [24, 24], iconAnchor: [12, 12] });
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
                    <li className="flex items-center gap-2">🔵<span className="font-bold">Blue Line:</span> Water Pipeline</li>
                    <li className="flex items-center gap-2">🔵<span className="font-bold">Blue Marker:</span> Overhead Tank</li>
                    <li className="flex items-center gap-2">🟡<span className="font-bold">Yellow Marker:</span> Pump House</li>
                    <li className="flex items-center gap-2">⚙️<span className="font-bold">Grey Marker:</span> Valve</li>
                    <li className="flex items-center gap-2">🔴<span className="font-bold">Red Marker:</span> Leak/Complaint</li>
                    <li className="flex items-center gap-2">🟢<span className="font-bold">Green Marker:</span> Operator</li>
                    <li className="flex items-center gap-2">🟠<span className="font-bold">Orange Marker:</span> Pump Fault</li>
                    <li className="flex items-center gap-2">🟣<span className="font-bold">Purple Marker:</span> Suspected Leak Cluster</li>
                </ul>
            </div>
        </div>
    </div>
  );
}
