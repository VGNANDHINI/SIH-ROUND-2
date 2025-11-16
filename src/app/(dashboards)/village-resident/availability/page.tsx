"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { waterSchemes } from "@/lib/data";
import { Loader2 } from "lucide-react";
import React, { useState } from "react";

const statuses = {
  "Ramgarh": { status: "Available", schedule: "6 AM - 9 AM, 5 PM - 8 PM" },
  "Sitapur": { status: "Available", schedule: "5 AM - 8 AM, 6 PM - 9 PM" },
  "Laxmangarh": { status: "Limited Supply", schedule: "6 AM - 8 AM only" },
  "Krishnanagar": { status: "Unavailable", schedule: "No supply due to pipeline damage." },
  "Gopalpur": { status: "Available", schedule: "7 AM - 10 AM, 4 PM - 7 PM" },
};

type Village = keyof typeof statuses;

export default function AvailabilityPage() {
  const [selectedVillage, setSelectedVillage] = useState<Village | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{ status: string; schedule: string; } | null>(null);

  const villages = [...new Set(waterSchemes.map(s => s.village))] as Village[];

  const handleCheck = () => {
    if (!selectedVillage) return;
    setIsLoading(true);
    setResult(null);
    setTimeout(() => {
      setResult(statuses[selectedVillage]);
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Check Water Availability</CardTitle>
          <CardDescription>Select your village to check the current water supply status and schedule.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select onValueChange={(value: Village) => setSelectedVillage(value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select your village" />
            </SelectTrigger>
            <SelectContent>
              {villages.map(village => (
                <SelectItem key={village} value={village}>{village}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={handleCheck} disabled={!selectedVillage || isLoading} className="w-full">
            {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Checking...</> : "Check Status"}
          </Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Current Status</CardTitle>
          <CardDescription>
            {selectedVillage ? `Showing status for ${selectedVillage}` : "Please select a village"}
          </CardDescription>
        </CardHeader>
        <CardContent className="min-h-[150px] flex items-center justify-center">
          {isLoading ? <Loader2 className="h-8 w-8 animate-spin text-primary" /> : (
            result ? (
              <div className="text-center space-y-2">
                <p className="text-sm text-muted-foreground">Supply Status</p>
                <h3 className={`text-2xl font-bold ${result.status === "Available" ? "text-green-600" : result.status === "Limited Supply" ? "text-yellow-600" : "text-red-600"}`}>{result.status}</h3>
                <p className="text-sm text-muted-foreground">Today's Schedule: {result.schedule}</p>
              </div>
            ) : <p className="text-muted-foreground">No status to show.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
