
'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FilePenLine, UserCheck, Wrench, Upload, ShieldCheck, CheckCircle } from 'lucide-react';
import Link from 'next/link';

const processSteps = [
    {
        title: "1. Citizen Raises Issue",
        description: "You report a problem like a leak or no water through the app.",
        icon: <FilePenLine className="w-8 h-8" />,
    },
    {
        title: "2. GP Assigns Task",
        description: "The Gram Panchayat official receives the complaint and assigns it to a local pump operator.",
        icon: <UserCheck className="w-8 h-8" />,
    },
    {
        title: "3. Operator Completes Work",
        description: "The operator visits the site, fixes the issue (e.g., repairs the leak, fixes the motor).",
        icon: <Wrench className="w-8 h-8" />,
    },
    {
        title: "4. Operator Submits Proof",
        description: "The operator takes a photo of the completed work and submits it through their app for verification.",
        icon: <Upload className="w-8 h-8" />,
    },
    {
        title: "5. Official Verifies Work",
        description: "A Block or District official reviews the operator's submission to ensure the work is done correctly.",
        icon: <ShieldCheck className="w-8 h-8" />,
    },
    {
        title: "6. Issue Resolved",
        description: "Once verified, the issue is marked as 'Resolved' and you receive a confirmation.",
        icon: <CheckCircle className="w-8 h-8" />,
    }
];

export default function IssueProcessPage() {
    return (
        <div>
            <div className="mb-8">
                <Link href="/village-resident/help" className="text-sm text-primary hover:underline">
                    &larr; Back to Help & Support
                </Link>
                <h1 className="text-3xl font-bold mt-2">Issue Resolution Process</h1>
                <p className="text-muted-foreground">Understanding the journey of a complaint from submission to resolution.</p>
            </div>

            <div className="relative max-w-2xl mx-auto">
                <div className="absolute left-9 top-0 h-full w-0.5 bg-border" aria-hidden="true"></div>
                <div className="relative space-y-8">
                    {processSteps.map((step, index) => (
                        <div key={index} className="flex items-start gap-6">
                            <div className="flex-shrink-0 w-20 flex flex-col items-center">
                                <div className="z-10 flex items-center justify-center w-12 h-12 bg-primary text-primary-foreground rounded-full">
                                    {step.icon}
                                </div>
                            </div>
                            <div className="mt-1.5">
                                <h3 className="text-lg font-semibold">{step.title}</h3>
                                <p className="mt-1 text-muted-foreground">{step.description}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
