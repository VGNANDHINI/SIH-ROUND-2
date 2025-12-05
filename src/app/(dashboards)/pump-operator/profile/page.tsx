
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useUser, useDoc } from '@/firebase';
import type { UserProfile } from '@/lib/data';
import { Loader2, User, Mail, Phone, MapPin } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function OperatorProfilePage() {
    const { user, loading: userLoading } = useUser();
    const { data: profile, loading: profileLoading } = useDoc<UserProfile>(user ? `users/${user.uid}` : null);

    const loading = userLoading || profileLoading;

    const getInitials = (name?: string | null) => {
        if (!name) return "OP";
        return name.split(' ').map(n => n[0]).join('');
    }

    return (
        <Card className="max-w-2xl mx-auto">
            <CardHeader>
                <CardTitle>Operator Profile</CardTitle>
                <CardDescription>
                    Your personal and professional information.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                ) : profile ? (
                    <div className="space-y-6">
                        <div className="flex items-center gap-4">
                            <Avatar className="h-20 w-20">
                                {profile.photoURL && <AvatarImage src={profile.photoURL} alt={profile.displayName || ""} />}
                                <AvatarFallback className="text-2xl">{getInitials(profile.displayName)}</AvatarFallback>
                            </Avatar>
                            <div>
                                <h2 className="text-2xl font-bold">{profile.displayName}</h2>
                                <p className="text-muted-foreground">Pump Operator</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-md">
                                <Mail className="h-5 w-5 text-muted-foreground" />
                                <span>{profile.email}</span>
                            </div>
                             <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-md">
                                <Phone className="h-5 w-5 text-muted-foreground" />
                                <span>{profile.phoneNumber || 'Not Provided'}</span>
                            </div>
                        </div>
                         <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-md">
                            <MapPin className="h-5 w-5 text-muted-foreground mt-1" />
                            <div>
                                <p className="font-medium">Operating Area</p>
                                <p className="text-sm text-muted-foreground">{profile.panchayat}, {profile.block}, {profile.district}, {profile.state}</p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="text-center text-muted-foreground h-64 flex items-center justify-center">
                        <p>Could not load operator profile.</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
