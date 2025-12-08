
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Layers, MapPin, Wifi, WifiOff, Edit, RefreshCw } from "lucide-react";
import React, { useState, useMemo } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { usePipelines, useMarkers, useComplaints } from "@/firebase";
import { Loader2 } from 'lucide-react';
import dynamic from "next/dynamic";
import type { Complaint } from '@/lib/data';
import type { Panchayat, Marker as MarkerType } from '@/lib/gis-data';
import { useToast } from "@/hooks/use-toast";

// Lazy-load the map component to prevent SSR issues with Leaflet
const PipelineMap = dynamic(() => import('@/components/atlas/pipeline-map').then(mod => mod.PipelineMap), {
    ssr: false,
    loading: () => <div className="flex items-center justify-center h-[70vh] bg-muted rounded-lg"><Loader2 className="h-8 w-8 animate-spin" /></div>
});

const panchayatDetails: Panchayat = {
    id: 'anjur',
    name: 'Anjur',
    center: { lat: 12.826, lng: 80.045 },
    zoom: 15
};

export default function GisAtlasPage() {
    const { toast } = useToast();

    // Layer visibility state
    const [layers, setLayers] = useState({
        pipelines: true,
        valves: true,
        tanks: true,
        complaints: true,
        pumps: true,
    });

    const handleLayerToggle = (layer: keyof typeof layers) => {
        setLayers(prev => ({ ...prev, [layer]: !prev[layer] }));
    };

    const pipelinePath = `states/tamil_nadu/districts/chengalpattu/mandals/kattankolathur/panchayats/anjur/pipelines`;
    const markerPath = `states/tamil_nadu/districts/chengalpattu/mandals/kattankolathur/panchayats/anjur/markers`;
    
    const { data: pipelines, loading: pipelinesLoading } = usePipelines(pipelinePath);
    const { data: staticMarkers, loading: markersLoading } = useMarkers(markerPath);
    const { data: allComplaints, loading: complaintsLoading } = useComplaints();

    const complaintMarkers = useMemo((): MarkerType[] => {
        if (!allComplaints) return [];
        
        return allComplaints
            .filter(c => c.status === 'Open' && c.userPanchayat === panchayatDetails.name)
            .map((c: Complaint) => ({
                id: c.id,
                type: 'Complaint',
                label: c.issueType,
                position: c.gpsLocation || { lat: panchayatDetails.center.lat + (Math.random() - 0.5) * 0.01, lng: panchayatDetails.center.lng + (Math.random() - 0.5) * 0.01 },
                data: c
            }));
    }, [allComplaints]);

    const allMarkers = useMemo(() => {
        return [...(staticMarkers || []), ...complaintMarkers];
    }, [staticMarkers, complaintMarkers]);


    const filteredMarkers = useMemo(() => {
        return allMarkers.filter(marker => {
            switch (marker.type) {
                case 'Valve': return layers.valves;
                case 'Tank': return layers.tanks;
                case 'Pump': return layers.pumps;
                case 'Complaint': return layers.complaints;
                default: return true;
            }
        });
    }, [allMarkers, layers]);

    const loading = pipelinesLoading || markersLoading || complaintsLoading;

    return (
        <div className="grid lg:grid-cols-4 gap-6 items-start">
            <div className="lg:col-span-1 space-y-6">
                 <Card>
                    <CardHeader>
                        <CardTitle>Asset Layer Controls</CardTitle>
                        <CardDescription>Toggle visibility of map assets.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {Object.keys(layers).map((layerKey) => (
                             <div key={layerKey} className="flex items-center justify-between">
                                <Label htmlFor={layerKey} className="capitalize">{layerKey}</Label>
                                <Switch
                                    id={layerKey}
                                    checked={layers[layerKey as keyof typeof layers]}
                                    onCheckedChange={() => handleLayerToggle(layerKey as keyof typeof layers)}
                                />
                            </div>
                        ))}
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle>Map Status & Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                         <div className="flex items-center justify-between p-2 bg-muted rounded-md">
                            <div className="flex items-center gap-2 text-sm font-medium">
                                <Wifi className="h-5 w-5 text-green-500" />
                                <span>Online</span>
                            </div>
                            <span className="text-xs text-muted-foreground">Sync: All updated</span>
                        </div>
                        <Button variant="outline" className="w-full justify-start"><Edit className="mr-2 h-4 w-4" /> Enable Edit Mode</Button>
                        <Button variant="outline" className="w-full justify-start" onClick={() => toast({ title: "Syncing...", description: "Force sync with server initiated."})}><RefreshCw className="mr-2 h-4 w-4" /> Force Sync</Button>
                    </CardContent>
                </Card>
            </div>

            <div className="lg:col-span-3">
                <Card>
                     <CardHeader>
                        <CardTitle>Village Pipeline Map: {panchayatDetails?.name ?? '...'}</CardTitle>
                        <CardDescription>Interactive map of water infrastructure and live alerts.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                             <div className="flex items-center justify-center h-[70vh] bg-muted rounded-lg"><Loader2 className="h-8 w-8 animate-spin" /></div>
                        ): (
                             <PipelineMap 
                                pipelines={layers.pipelines ? (pipelines || []) : []} 
                                markers={filteredMarkers}
                                onMarkAsResolved={() => {}} 
                                panchayat={panchayatDetails}
                            />
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
