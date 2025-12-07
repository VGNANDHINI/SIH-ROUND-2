
'use client';
// This is a placeholder file to satisfy the new navigation link.
// The actual AI assistant is a floating component on the main dashboard.

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function AiAssistantPage() {
    return (
        <div className="flex items-center justify-center h-[60vh]">
            <Card className="text-center max-w-lg">
                <CardHeader>
                    <div className="flex justify-center mb-4">
                        <Sparkles className="h-12 w-12 text-primary"/>
                    </div>
                    <CardTitle>AI Assistant</CardTitle>
                    <CardDescription>Your smart assistant is available on the main dashboard.</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="mb-4">
                        Click the chat bubble icon at the bottom-right corner of your dashboard to start a conversation with the JalSaathi Assistant.
                    </p>
                    <Button asChild>
                        <Link href="/village-resident">Go to Dashboard</Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
