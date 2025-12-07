
'use client';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import type { Pipeline, Marker as MarkerType, Panchayat } from '@/lib/gis-data';
import { Button } from '@/components/ui/button';
import { useEffect } from 'react';

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
        case 'Pump Fault': return L.divIcon({ html: iconHtml('orange', '🟠'), className: '', iconSize: [24, 24], iconAnchor: [12, 12] });
        case 'Leak Cluster': return L.divIcon({ html: iconHtml('purple', '🟣'), className: '', iconSize: [24, 24], iconAnchor: [12, 12] });
        default: return new L.Icon.Default();
    }
}


const MapController = ({ panchayat }: { panchayat: Panchayat | null }) => {
    const map = useMap();
    useEffect(() => {
        if (panchayat && panchayat.center) {
            map.setView(panchayat.center, panchayat.zoom);
        }
    }, [panchayat, map]);
    return null;
}


interface PipelineMapProps {
  pipelines: Pipeline[];
  markers: MarkerType[];
  onMarkAsResolved: (complaintId: string) => void;
  panchayat: Panchayat | null;
}

export function PipelineMap({ pipelines, markers, onMarkAsResolved, panchayat }: PipelineMapProps) {

  const center = panchayat?.center || { lat: 12.825, lng: 80.045 };
  const zoom = panchayat?.zoom || 15;

  return (
    <MapContainer center={center} zoom={zoom} style={{ height: '100%', width: '100%' }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      <MapController panchayat={panchayat} />

      {pipelines.map(pipeline => (
        <Polyline key={pipeline.id} positions={pipeline.path} color="blue" weight={3}>
            <Popup>
                <b>Pipeline ID:</b> {pipeline.id} <br/>
                <b>Length:</b> {pipeline.length}m <br/>
                <b>Village Served:</b> {pipeline.villageServed} <br/>
                <b>Pressure Status:</b> Normal <br/>
                <b>Active Complaints:</b> 0
            </Popup>
        </Polyline>
      ))}

      {markers.map(marker => (
        <Marker key={marker.id} position={marker.position} icon={getIcon(marker.type)}>
            <Popup>
                <div className="space-y-2">
                    <h4 className="font-bold">{marker.label} ({marker.type})</h4>
                    {marker.data && (
                        <>
                            <p><b>Village:</b> {marker.data.villageName}</p>
                            <p><b>Severity:</b> {marker.data.severity}</p>
                            <p><b>Status:</b> {marker.data.status}</p>
                            <p><b>Assigned To:</b> {marker.data.operatorAssigned || 'Unassigned'}</p>
                            <Button size="sm" className="w-full" onClick={() => onMarkAsResolved(marker.id)}>Mark as Resolved</Button>
                        </>
                    )}
                </div>
            </Popup>
        </Marker>
      ))}

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
                    <li className="flex items-center gap-2">🟣<span className="font-bold">Purple Marker:</span> Leak Cluster</li>
                </ul>
            </div>
        </div>
    </MapContainer>
  );
}
