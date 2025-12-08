
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Layers, RefreshCw, Wifi, Search, Edit } from "lucide-react";
import React, { useState, useMemo } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useComplaints, usePipelines, usePumps, useTanks, useValves } from "@/firebase";
import { Loader2 } from 'lucide-react';
import dynamic from "next/dynamic";
import type { Complaint } from '@/lib/data';
import type { Panchayat, PipelineFeature, ValveFeature, PumpFeature, TankFeature, ComplaintFeature } from '@/lib/gis-data';
import { useToast } from "@/hooks/use-toast";

// Lazy-load the map component to prevent SSR issues with Leaflet
const PipelineMap = dynamic(() => import('@/components/atlas/pipeline-map').then(mod => mod.PipelineMap), {
    ssr: false,
    loading: () => <div className="flex items-center justify-center h-[70vh] bg-muted rounded-lg"><Loader2 className="h-8 w-8 animate-spin" /></div>
});

const panchayatDetails: Panchayat = {
    id: 'anjur',
    name: 'Anjur',
    center: { lat: 12.828, lng: 80.051 },
    zoom: 16
};

export default function GisAtlasPage() {
    const { toast } = useToast();
    const [searchTerm, setSearchTerm] = useState('');
    const [layers, setLayers] = useState({
        pipelines: true,
        valves: true,
        tanks: true,
        pumps: true,
        complaints: true,
    });

    const handleLayerToggle = (layer: keyof typeof layers) => {
        setLayers(prev => ({ ...prev, [layer]: !prev[layer] }));
    };

    // Fetching data for all layers
    const { data: pipelines, loading: pipelinesLoading } = usePipelines();
    const { data: pumps, loading: pumpsLoading } = usePumps();
    const { data: tanks, loading: tanksLoading } = useTanks();
    const { data: valves, loading: valvesLoading } = useValves();
    const { data: allComplaints, loading: complaintsLoading } = useComplaints();

    const complaintMarkers = useMemo((): ComplaintFeature[] => {
        if (!allComplaints) return [];
        return allComplaints
            .filter(c => c.status !== 'Resolved' && c.userPanchayat === panchayatDetails.name && c.gpsLocation)
            .map((c: Complaint): ComplaintFeature => ({
                id: c.id,
                type: 'Feature',
                geometry: {
                    type: 'Point',
                    coordinates: [c.gpsLocation!.lng, c.gpsLocation!.lat]
                },
                properties: c
            }));
    }, [allComplaints]);

    const loading = pipelinesLoading || pumpsLoading || tanksLoading || valvesLoading || complaintsLoading;

    // Filter logic based on search term
    const filterData = <T extends { properties: { name?: string, asset_id?: string } }>(data: T[] | null): T[] => {
        if (!data) return [];
        if (!searchTerm) return data;
        return data.filter(item => 
            item.properties.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.properties.asset_id?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    };

    const filteredPipelines = useMemo(() => filterData(pipelines), [pipelines, searchTerm]);
    const filteredPumps = useMemo(() => filterData(pumps), [pumps, searchTerm]);
    const filteredTanks = useMemo(() => filterData(tanks), [tanks, searchTerm]);
    const filteredValves = useMemo(() => filterData(valves), [valves, searchTerm]);
    const filteredComplaints = useMemo(() => {
        if (!complaintMarkers) return [];
        if (!searchTerm) return complaintMarkers;
         return complaintMarkers.filter(item => 
            item.properties.issueType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.properties.address?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [complaintMarkers, searchTerm]);

    return (
        <div className="grid lg:grid-cols-4 gap-6 items-start">
            <div className="lg:col-span-1 space-y-6">
                 <Card>
                    <CardHeader>
                        <CardTitle>Map Controls</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="search"
                                placeholder="Search by name or ID..."
                                className="pl-8"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                             <Label>Asset Layers</Label>
                            {Object.keys(layers).map((layerKey) => (
                                <div key={layerKey} className="flex items-center justify-between">
                                    <Label htmlFor={layerKey} className="capitalize font-normal text-sm">{layerKey}</Label>
                                    <Switch
                                        id={layerKey}
                                        checked={layers[layerKey as keyof typeof layers]}
                                        onCheckedChange={() => handleLayerToggle(layerKey as keyof typeof layers)}
                                    />
                                </div>
                            ))}
                        </div>
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
                                <span>Online & Synced</span>
                            </div>
                            <span className="text-xs text-muted-foreground">Just now</span>
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
                                panchayat={panchayatDetails}
                                pipelines={layers.pipelines ? filteredPipelines : []} 
                                pumps={layers.pumps ? filteredPumps : []}
                                tanks={layers.tanks ? filteredTanks : []}
                                valves={layers.valves ? filteredValves : []}
                                complaints={layers.complaints ? filteredComplaints : []}
                            />
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
