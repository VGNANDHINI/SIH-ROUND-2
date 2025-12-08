
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Layers, RefreshCw, Wifi, Search, Edit } from "lucide-react";
import React, { useState, useMemo } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from 'lucide-react';
import dynamic from "next/dynamic";
import { useToast } from "@/hooks/use-toast";

// Import the new detailed dummy data
import detailedGisData from '@/lib/dummy-gis-data-detailed.json';

// Define types based on the new JSON structure
type Pipeline = { id: string; path: { lat: number; lng: number }[]; color: string; };
type PointAsset = { id: string; name?: string; location: { lat: number; lng: number }; icon: string; [key: string]: any; };

const panchayatDetails = {
    id: 'anjur',
    name: 'Anjur',
    center: { lat: 12.71, lng: 80.22 },
    zoom: 15
};

// Lazy-load the map component to prevent SSR issues with Leaflet
const PipelineMap = dynamic(() => import('@/components/atlas/pipeline-map').then(mod => mod.PipelineMap), {
    ssr: false,
    loading: () => <div className="flex items-center justify-center h-[70vh] bg-muted rounded-lg"><Loader2 className="h-8 w-8 animate-spin" /></div>
});

export default function GisAtlasPage() {
    const { toast } = useToast();
    const [searchTerm, setSearchTerm] = useState('');
    
    // Updated layers state to match the new detailed dataset
    const [layers, setLayers] = useState({
        main_pipeline: true,
        distribution_pipeline: true,
        lateral_pipeline: true,
        pump_houses: true,
        overhead_tanks: true,
        valves: true,
        public_taps: true,
        leakage_alerts: true,
        live_alerts: true,
    });
    
    const handleLayerToggle = (layer: keyof typeof layers) => {
        setLayers(prev => ({ ...prev, [layer]: !prev[layer] }));
    };

    // No longer fetching from firebase, using the imported JSON
    const loading = false;

    // Prepare data for the map component
    const allPipelines = useMemo(() => [
        ...(layers.main_pipeline ? detailedGisData.main_pipeline : []),
        ...(layers.distribution_pipeline ? detailedGisData.distribution_pipeline : []),
        ...(layers.lateral_pipeline ? detailedGisData.lateral_pipeline : [])
    ], [layers.main_pipeline, layers.distribution_pipeline, layers.lateral_pipeline]);

    const allMarkers = useMemo(() => [
        ...(layers.pump_houses ? detailedGisData.pump_houses : []),
        ...(layers.overhead_tanks ? detailedGisData.overhead_tanks : []),
        ...(layers.valves ? detailedGisData.valves : []),
        ...(layers.public_taps ? detailedGisData.public_taps : []),
        ...(layers.leakage_alerts ? detailedGisData.leakage_alerts : []),
        ...(layers.live_alerts ? detailedGisData.live_alerts : [])
    ], [layers.pump_houses, layers.overhead_tanks, layers.valves, layers.public_taps, layers.leakage_alerts, layers.live_alerts]);

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
                                    <Label htmlFor={layerKey} className="capitalize font-normal text-sm">{layerKey.replace(/_/g, ' ')}</Label>
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
                                pipelines={allPipelines} 
                                markers={allMarkers}
                            />
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
