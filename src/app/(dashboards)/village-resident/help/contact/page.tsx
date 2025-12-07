
'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Phone, MessageSquare, User, Shield, Briefcase } from 'lucide-react';
import Link from 'next/link';

const contacts = [
    { name: 'Gram Panchayat Helpline', role: 'General Support', number: '1800-123-4567', icon: <Phone /> },
    { name: 'Smt. Radha Sharma', role: 'Panchayat Assistant', number: '+91-9876543210', icon: <User /> },
    { name: 'Mr. Kumar', role: 'Pump Operator', number: '+91-8765432109', icon: <Briefcase /> },
    { name: 'District Engineer', role: 'Escalation Support', number: '+91-7654321098', icon: <Shield /> },
];

export default function ContactPanchayatPage() {
    return (
        <div>
            <div className="mb-8">
                <Link href="/village-resident/help" className="text-sm text-primary hover:underline">
                    &larr; Back to Help & Support
                </Link>
                <h1 className="text-3xl font-bold mt-2">Contact Panchayat</h1>
                <p className="text-muted-foreground">Reach out to officials for support or information.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {contacts.map((contact) => (
                    <Card key={contact.name}>
                        <CardHeader className="flex flex-row items-center gap-4">
                            <div className="p-3 bg-muted rounded-full">
                                {contact.icon}
                            </div>
                            <div>
                                <CardTitle>{contact.name}</CardTitle>
                                <CardDescription>{contact.role}</CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-lg font-semibold">{contact.number}</p>
                            <div className="flex gap-2">
                                <Button className="w-full">
                                    <Phone className="mr-2 h-4 w-4"/> Call Now
                                </Button>
                                <Button variant="outline" className="w-full">
                                    <MessageSquare className="mr-2 h-4 w-4"/> Message
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
