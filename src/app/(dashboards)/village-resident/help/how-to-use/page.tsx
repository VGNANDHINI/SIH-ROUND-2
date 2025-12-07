
'use client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UserPlus, FilePenLine, History, Megaphone, FlaskConical, Calendar } from 'lucide-react';
import Link from 'next/link';

const steps = [
    {
        title: "Create an Account",
        description: "Sign up with your email or Google account to get started.",
        icon: <UserPlus className="w-8 h-8 text-primary" />,
    },
    {
        title: "Register a Complaint",
        description: "Go to the 'Register Complaint' section, fill in the details, and submit your issue.",
        icon: <FilePenLine className="w-8 h-8 text-primary" />,
    },
    {
        title: "Check Issue Status",
        description: "Your complaint history and its status (Open, In Progress, Resolved) are visible on the complaint page.",
        icon: <History className="w-8 h-8 text-primary" />,
    },
    {
        title: "Read Community Updates",
        description: "Check the dashboard for any important announcements from your Gram Panchayat.",
        icon: <Megaphone className="w-8 h-8 text-primary" />,
    },
    {
        title: "View Water Quality",
        description: "Visit the 'Water Quality' page to see the latest test results for your area.",
        icon: <FlaskConical className="w-8 h-8 text-primary" />,
    },
    {
        title: "View Supply Schedule",
        description: "The weekly water supply timings are displayed on your main dashboard.",
        icon: <Calendar className="w-8 h-8 text-primary" />,
    }
];

export default function HowToUsePage() {
    return (
        <div>
            <div className="mb-8">
                <Link href="/village-resident/help" className="text-sm text-primary hover:underline">
                    &larr; Back to Help & Support
                </Link>
                <h1 className="text-3xl font-bold mt-2">How to Use the App</h1>
                <p className="text-muted-foreground">Simple guides for using the JalShakthi resident portal.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {steps.map((step, index) => (
                    <Card key={index}>
                        <CardHeader className="flex flex-row items-center gap-4">
                            {step.icon}
                            <CardTitle>{step.title}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground">{step.description}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
