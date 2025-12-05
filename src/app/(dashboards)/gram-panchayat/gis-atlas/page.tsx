
'use client';

import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useUser, useDoc } from '@/firebase';
import type { UserProfile } from '@/lib/data';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Loader2 } from 'lucide-react';

export default function GisAtlasPage() {
    const { user, loading: userLoading } = useUser();
    const { data: profile, loading: profileLoading } = useDoc<UserProfile>(user ? `users/${user.uid}` : null);
    
    const gisMapImage = PlaceHolderImages.find(p => p.id === 'gis-map-1');
    const loading = userLoading || profileLoading;

    return (
        <Card>
            <CardHeader>
                <CardTitle>GIS Pipeline Atlas</CardTitle>
                <CardDescription>
                    {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                       `Showing pipeline network map for ${profile?.panchayat || 'your panchayat'}.`
                    )}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="relative w-full aspect-video border rounded-lg overflow-hidden bg-muted">
                    {gisMapImage ? (
                        <Image
                            src={gisMapImage.imageUrl}
                            alt="GIS map of a pipeline network"
                            fill
                            className="object-cover"
                            data-ai-hint={gisMapImage.imageHint}
                        />
                    ) : (
                        <div className="flex items-center justify-center h-full text-muted-foreground">
                            Map data not available.
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

