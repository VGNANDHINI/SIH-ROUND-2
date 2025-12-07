
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin } from "lucide-react";
import React, { useState, useMemo, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useStates, useDistricts, useMandals, usePanchayats, usePipelines, useMarkers, useComplaints } from "@/firebase";
import { Loader2 } from 'lucide-react';
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";

const PipelineMap = dynamic(() => import('@/components/atlas/pipeline-map').then(mod => mod.PipelineMap), {
    ssr: false,
    loading: () => <div className="flex items-center justify-center h-[70vh] bg-muted rounded-lg"><Loader2 className="h-8 w-8 animate-spin" /></div>
});


export default function GisAtlasPage() {
    const [selectedState, setSelectedState] = useState<string | null>('tamil_nadu');
    const [selectedDistrict, setSelectedDistrict] = useState<string | null>('chengalpattu');
    const [selectedMandal, setSelectedMandal] = useState<string | null>('kattankolathur');
    const [selectedPanchayat, setSelectedPanchayat] = useState<string | null>('anjur');
    
    const router = useRouter();

    const { data: states, loading: statesLoading } = useStates();
    const { data: districts, loading: districtsLoading } = useDistricts(selectedState);
    const { data: mandals, loading: mandalsLoading } = useMandals(selectedState, selectedDistrict);
    const { data: panchayats, loading: panchayatsLoading } = usePanchayats(selectedState, selectedDistrict, selectedMandal);

    const pipelinePath = useMemo(() => selectedPanchayat ? `states/${selectedState}/districts/${selectedDistrict}/mandals/${selectedMandal}/panchayats/${selectedPanchayat}/pipelines` : null, [selectedState, selectedDistrict, selectedMandal, selectedPanchayat]);
    const markerPath = useMemo(() => selectedPanchayat ? `states/${selectedState}/districts/${selectedDistrict}/mandals/${selectedMandal}/panchayats/${selectedPanchayat}/markers` : null, [selectedState, selectedDistrict, selectedMandal, selectedPanchayat]);
    
    const { data: pipelines, loading: pipelinesLoading } = usePipelines(pipelinePath);
    const { data: staticMarkers, loading: markersLoading } = useMarkers(markerPath);
    const { data: complaints, loading: complaintsLoading } = useComplaints();

    const complaintMarkers = useMemo(() => {
        if (!complaints || !selectedPanchayat) return [];
        const panchayatDetails = panchayats?.find(p => p.id === selectedPanchayat);
        if (!panchayatDetails) return [];
        
        // This is a placeholder for real GPS data which should be in the complaint document
        // A real app would get lat/lng from the complaint itself.
        const panchayatCenter = panchayatDetails.center || { lat: 12.825, lng: 80.045 };

        return complaints.filter(c => c.status === 'Open' && c.userPanchayat === panchayatDetails.name).map(c => ({
            id: c.id,
            type: 'Complaint' as const,
            label: c.issueType,
            position: c.gpsLocation || { lat: panchayatCenter.lat + (Math.random() - 0.5) * 0.01, lng: panchayatCenter.lng + (Math.random() - 0.5) * 0.01 }, // Fallback random location
            data: c
        }));
    }, [complaints, selectedPanchayat, panchayats]);

    const allMarkers = useMemo(() => {
        return [...(staticMarkers || []), ...complaintMarkers];
    }, [staticMarkers, complaintMarkers]);


    const handleStateChange = (stateId: string) => {
        setSelectedState(stateId);
        setSelectedDistrict(null);
        setSelectedMandal(null);
        setSelectedPanchayat(null);
    }

    const handleDistrictChange = (districtId: string) => {
        setSelectedDistrict(districtId);
        setSelectedMandal(null);
        setSelectedPanchayat(null);
    }

    const handleMandalChange = (mandalId: string) => {
        setSelectedMandal(mandalId);
        setSelectedPanchayat(null);
    }
    
    const loading = statesLoading || districtsLoading || mandalsLoading || panchayatsLoading || pipelinesLoading || markersLoading || complaintsLoading;

    const panchayatDetails = useMemo(() => {
        if (!selectedPanchayat || !panchayats) return null;
        return panchayats.find(p => p.id === selectedPanchayat);
    }, [selectedPanchayat, panchayats]);
    
    const handleMarkAsResolved = (complaintId: string) => {
        console.log("Marking as resolved:", complaintId);
        // In a real app, you would call a Firestore update function here.
    };

    return (
        <div className="grid lg:grid-cols-4 gap-6 items-start">
            <div className="lg:col-span-1 space-y-6">
                 <Card>
                    <CardHeader>
                        <CardTitle>Atlas Assistant</CardTitle>
                        <CardDescription>Select a location to view its assets.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Select onValueChange={handleStateChange} value={selectedState ?? ''} disabled={statesLoading}>
                            <SelectTrigger>
                                {statesLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                                <SelectValue placeholder="Select State" />
                            </SelectTrigger>
                            <SelectContent>{states?.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                        </Select>
                         <Select onValueChange={handleDistrictChange} value={selectedDistrict ?? ''} disabled={!selectedState || districtsLoading}>
                            <SelectTrigger>
                                {districtsLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                                <SelectValue placeholder="Select District" />
                            </SelectTrigger>
                            <SelectContent>{districts?.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent>
                        </Select>
                        <Select onValueChange={handleMandalChange} value={selectedMandal ?? ''} disabled={!selectedDistrict || mandalsLoading}>
                            <SelectTrigger>
                                {mandalsLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                                <SelectValue placeholder="Select Block/Mandal" />
                            </SelectTrigger>
                            <SelectContent>{mandals?.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}</SelectContent>
                        </Select>
                        <Select onValueChange={setSelectedPanchayat} value={selectedPanchayat ?? ''} disabled={!selectedMandal || panchayatsLoading}>
                            <SelectTrigger>
                                {panchayatsLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                                <SelectValue placeholder="Select Panchayat" />
                            </SelectTrigger>
                            <SelectContent>{panchayats?.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                        </Select>
                    </CardContent>
                </Card>
            </div>

            <div className="lg:col-span-3">
                <Card>
                     <CardHeader>
                        <CardTitle>Live GIS Map: {panchayatDetails?.name ?? '...'}</CardTitle>
                        <CardDescription>Interactive map of water infrastructure and live alerts.</CardDescription>
                    </CardHeader>
                    <CardContent>
                         {!selectedPanchayat ? (
                            <div className="flex items-center justify-center h-[70vh] bg-muted rounded-lg">
                                <p>Select a panchayat to view the map.</p>
                            </div>
                        ) : (
                             <PipelineMap 
                                pipelines={pipelines || []} 
                                markers={allMarkers || []}
                                onMarkAsResolved={handleMarkAsResolved} 
                                panchayat={panchayatDetails}
                            />
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
