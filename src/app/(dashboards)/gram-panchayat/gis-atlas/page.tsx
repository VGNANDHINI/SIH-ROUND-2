
'use client';

import { useState, useMemo } from 'react';
import { useStates, useDistricts, useMandals, usePanchayats, usePipelines, useMarkers } from '@/firebase/firestore/gis-hooks';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { PipelineMap } from '@/components/atlas/pipeline-map';

export default function GisAtlasPage() {
    const [selectedState, setSelectedState] = useState<string | null>('tamil_nadu');
    const [selectedDistrict, setSelectedDistrict] = useState<string | null>('chengalpattu');
    const [selectedMandal, setSelectedMandal] = useState<string | null>('kattankolathur');
    const [selectedPanchayat, setSelectedPanchayat] = useState<string | null>('anjur');

    const { data: states, loading: statesLoading } = useStates();
    const { data: districts, loading: districtsLoading } = useDistricts(selectedState);
    const { data: mandals, loading: mandalsLoading } = useMandals(selectedState, selectedDistrict);
    const { data: panchayats, loading: panchayatsLoading } = usePanchayats(selectedState, selectedDistrict, selectedMandal);

    const pipelinePath = useMemo(() => selectedPanchayat ? `states/${selectedState}/districts/${selectedDistrict}/mandals/${selectedMandal}/panchayats/${selectedPanchayat}/pipelines` : null, [selectedState, selectedDistrict, selectedMandal, selectedPanchayat]);
    const markerPath = useMemo(() => selectedPanchayat ? `states/${selectedState}/districts/${selectedDistrict}/mandals/${selectedMandal}/panchayats/${selectedPanchayat}/markers` : null, [selectedState, selectedDistrict, selectedMandal, selectedPanchayat]);
    
    const { data: pipelines, loading: pipelinesLoading } = usePipelines(pipelinePath);
    const { data: markers, loading: markersLoading } = useMarkers(markerPath);

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
    
    const loading = statesLoading || districtsLoading || mandalsLoading || panchayatsLoading;

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Atlas Assistant</CardTitle>
                    <CardDescription>Select a location to view its pipeline network and assets.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                    </div>
                </CardContent>
            </Card>

            {selectedPanchayat && (
                <Card>
                    <CardHeader>
                        <CardTitle>Pipeline Map: {panchayats?.find(p => p.id === selectedPanchayat)?.name}</CardTitle>
                        <CardDescription>Interactive map of the water infrastructure.</CardDescription>
                    </CardHeader>
                    <CardContent>
                         {(pipelinesLoading || markersLoading) ? (
                            <div className="flex items-center justify-center h-96 bg-muted rounded-lg">
                                <Loader2 className="h-8 w-8 animate-spin" />
                            </div>
                        ) : (
                            <div className="relative w-full aspect-video border rounded-lg overflow-hidden bg-muted">
                                <PipelineMap pipelines={pipelines || []} markers={markers || []} />
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
