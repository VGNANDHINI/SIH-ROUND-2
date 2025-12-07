
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { HelpCircle, Phone, BookOpen, Layers, GitBranch, Search } from 'lucide-react';
import Link from 'next/link';

const helpTopics = [
    {
        title: "Contact Panchayat",
        description: "Get contact details for officials.",
        icon: <Phone className="w-8 h-8 text-primary" />,
        href: "/village-resident/help/contact",
    },
    {
        title: "FAQ",
        description: "Find answers to common questions.",
        icon: <HelpCircle className="w-8 h-8 text-primary" />,
        href: "/village-resident/help/faq",
    },
    {
        title: "How to Use the App",
        description: "Step-by-step guides for app features.",
        icon: <BookOpen className="w-8 h-8 text-primary" />,
        href: "/village-resident/help/how-to-use",
    },
    {
        title: "Issue Resolution Process",
        description: "Learn how your complaints get resolved.",
        icon: <GitBranch className="w-8 h-8 text-primary" />,
        href: "/village-resident/help/issue-process",
    }
];

export default function HelpPage() {
    return (
        <div className="space-y-8">
            <div className="text-center">
                <h1 className="text-3xl font-bold">Help & Support</h1>
                <p className="text-muted-foreground">We're here to help you with any questions or issues.</p>
            </div>
            
            <div className="max-w-lg mx-auto">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input placeholder="Search for help topics..." className="pl-10" />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {helpTopics.map((topic) => (
                    <Link href={topic.href} key={topic.title}>
                        <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                            <CardHeader className="items-center text-center">
                                {topic.icon}
                                <CardTitle className="mt-4">{topic.title}</CardTitle>
                            </CardHeader>
                            <CardContent className="text-center">
                                <p className="text-sm text-muted-foreground">{topic.description}</p>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>
        </div>
    );
}
