'use client';

import { useState, useMemo, useEffect } from 'react';
import { useStates, useDistricts, useMandals, usePanchayats, usePipelines, useMarkers, useComplaints } from '@/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import type { Marker } from '@/lib/gis-data';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { doc, setDoc } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import dynamic from 'next/dynamic';

const PipelineMap = dynamic(() => import('@/components/atlas/pipeline-map').then(mod => mod.PipelineMap), {
    ssr: false,
    loading: () => <div className="flex items-center justify-center h-[70vh] bg-muted rounded-lg"><Loader2 className="h-8 w-8 animate-spin" /></div>
});


export default function GisAtlasPage() {
    const [selectedState, setSelectedState] = useState<string | null>('tamil_nadu');
    const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);
    const [selectedMandal, setSelectedMandal] = useState<string | null>(null);
    const [selectedPanchayat, setSelectedPanchayat] = useState<string | null>(null);
    
    const firestore = useFirestore();
    const { toast } = useToast();

    const { data: states, loading: statesLoading } = useStates();
    const { data: districts, loading: districtsLoading } = useDistricts(selectedState);
    const { data: mandals, loading: mandalsLoading } = useMandals(selectedState, selectedDistrict);
    const { data: panchayats, loading: panchayatsLoading } = usePanchayats(selectedState, selectedDistrict, selectedMandal);

    const pipelinePath = useMemo(() => selectedPanchayat ? `states/${selectedState}/districts/${selectedDistrict}/mandals/${selectedMandal}/panchayats/${selectedPanchayat}/pipelines` : null, [selectedState, selectedDistrict, selectedMandal, selectedPanchayat]);
    const markerPath = useMemo(() => selectedPanchayat ? `states/${selectedState}/districts/${selectedDistrict}/mandals/${selectedMandal}/panchayats/${selectedPanchayat}/markers` : null, [selectedState, selectedDistrict, selectedMandal, selectedPanchayat]);
    
    const { data: pipelines, loading: pipelinesLoading } = usePipelines(pipelinePath);
    const { data: staticMarkers, loading: markersLoading } = useMarkers(markerPath);
    const { data: complaints, loading: complaintsLoading } = useComplaints();

    const complaintMarkers: Marker[] = useMemo(() => {
        if (!complaints || !selectedPanchayat) return [];
        const panchayatDetails = panchayats?.find(p => p.id === selectedPanchayat);
        if (!panchayatDetails) return [];
        return complaints.filter(c => c.status === 'Open' && c.gpsLocation && c.userPanchayat === panchayatDetails.name).map(c => ({
            id: c.id,
            type: c.issueType === 'Leakage' ? 'Alert' : 'Complaint',
            label: c.issueType,
            position: c.gpsLocation,
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

    const handleMarkAsResolved = async (complaintId: string) => {
        if (!firestore) return;
        const complaintRef = doc(firestore, 'complaints', complaintId);
        try {
            await setDoc(complaintRef, { status: 'Resolved' }, { merge: true });
            toast({ title: "Complaint Resolved", description: "The complaint has been marked as resolved." });
        } catch (error) {
            toast({ title: "Error", description: "Could not update complaint status.", variant: 'destructive' });
            console.error("Error resolving complaint: ", error);
        }
    };
    
    const panchayatComplaints = useMemo(() => {
        if (!panchayatDetails || !complaints) return [];
        return complaints.filter(c => c.userPanchayat === panchayatDetails.name);
    }, [panchayatDetails, complaints]);

    const openComplaintsCount = useMemo(() => panchayatComplaints.filter(c => c.status === 'Open').length ?? 0, [panchayatComplaints]);
    const leakComplaintsCount = useMemo(() => panchayatComplaints.filter(c => c.issueType === 'Leakage' && c.status === 'Open').length ?? 0, [panchayatComplaints]);
    const pumpIssuesCount = useMemo(() => panchayatComplaints.filter(c => c.issueType === 'Pump Failure' && c.status === 'Open').length ?? 0, [panchayatComplaints]);
    const valveIssuesCount = useMemo(() => panchayatComplaints.filter(c => c.issueType === 'Valve Stuck' && c.status === 'Open').length ?? 0, [panchayatComplaints]);


    return (
        <div className="grid lg:grid-cols-4 gap-6 items-start">
            <div className="lg:col-span-1 space-y-6">
                 <Card>
                    <CardHeader>
                        <CardTitle>Atlas Assistant</CardTitle>
                        <CardDescription>Select a location to view its assets.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Select value={selectedState ?? ''} onValueChange={handleStateChange} disabled={statesLoading}>
                            <SelectTrigger>
                                {statesLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                                <SelectValue placeholder="Select State" />
                            </SelectTrigger>
                            <SelectContent>{states?.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                        </Select>
                         <Select value={selectedDistrict ?? ''} onValueChange={handleDistrictChange} disabled={!selectedState || districtsLoading}>
                            <SelectTrigger>
                                {districtsLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                                <SelectValue placeholder="Select District" />
                            </SelectTrigger>
                            <SelectContent>{districts?.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent>
                        </Select>
                        <Select value={selectedMandal ?? ''} onValueChange={handleMandalChange} disabled={!selectedDistrict || mandalsLoading}>
                            <SelectTrigger>
                                {mandalsLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                                <SelectValue placeholder="Select Block/Mandal" />
                            </SelectTrigger>
                            <SelectContent>{mandals?.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}</SelectContent>
                        </Select>
                        <Select value={selectedPanchayat ?? ''} onValueChange={setSelectedPanchayat} disabled={!selectedMandal || panchayatsLoading}>
                            <SelectTrigger>
                                {panchayatsLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                                <SelectValue placeholder="Select Panchayat" />
                            </SelectTrigger>
                            <SelectContent>{panchayats?.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                        </Select>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Panchayat Dashboard</CardTitle>
                        <CardDescription>Real-time complaint summary for {panchayatDetails?.name}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="flex justify-between items-center"><span>Total Complaints:</span> <Badge>{loading ? <Loader2 className="h-3 w-3 animate-spin"/> : panchayatComplaints.length}</Badge></div>
                        <div className="flex justify-between items-center"><span>Open Complaints:</span> <Badge variant="destructive">{loading ? <Loader2 className="h-3 w-3 animate-spin"/> : openComplaintsCount}</Badge></div>
                        <div className="flex justify-between items-center"><span>Leaks:</span> <Badge variant="secondary">{loading ? <Loader2 className="h-3 w-3 animate-spin"/> : leakComplaintsCount}</Badge></div>
                        <div className="flex justify-between items-center"><span>Pump Issues:</span> <Badge variant="secondary">{loading ? <Loader2 className="h-3 w-3 animate-spin"/> : pumpIssuesCount}</Badge></div>
                        <div className="flex justify-between items-center"><span>Valve Issues:</span> <Badge variant="secondary">{loading ? <Loader2 className="h-3 w-3 animate-spin"/> : valveIssuesCount}</Badge></div>
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
