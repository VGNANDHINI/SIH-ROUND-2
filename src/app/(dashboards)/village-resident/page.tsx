
"use client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpRight, FileText } from "lucide-react";
import Link from "next/link";
import { WaterSchedule } from "./_components/water-schedule";
import { AIAssistant } from "./_components/ai-assistant";

export default function VillageResidentDashboard() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Welcome, Resident</CardTitle>
          <CardDescription>
            Your portal for all water-related services in your village.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p>Here you can check water supply status, view the supply schedule, and receive important notifications.</p>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <WaterSchedule />

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="flex flex-col space-y-2 pt-4">
            <Button asChild size="sm" variant="outline" className="w-full">
              <Link href="/village-resident/availability">Check Live Availability</Link>
            </Button>
            <Button asChild size="sm" variant="default" className="w-full">
              <Link href="/village-resident/complaints">Register Complaint</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
      <AIAssistant />
    </div>
  );
}
