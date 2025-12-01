"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useWaterSchemes } from "@/firebase";
import { ArrowUpRight, CheckCircle, Droplets, Users, Loader2 } from "lucide-react";
import Link from "next/link";

export default function GramPanchayatDashboard() {
  const { data: waterSchemes, loading } = useWaterSchemes();
  
  const activeSchemes = waterSchemes?.filter(s => s.status === 'Active').length ?? 0;
  const villages = waterSchemes ? [...new Set(waterSchemes.map(s => s.village))] : [];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Schemes</CardTitle>
            <Droplets className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? <Loader2 className="h-6 w-6 animate-spin" /> : waterSchemes?.length}</div>
            <p className="text-xs text-muted-foreground">managed in your panchayat</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Schemes</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? <Loader2 className="h-6 w-6 animate-spin" /> : activeSchemes}</div>
            <p className="text-xs text-muted-foreground">out of {waterSchemes?.length ?? 0} are operational</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Villages Covered</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? <Loader2 className="h-6 w-6 animate-spin" /> : villages.length}</div>
            <p className="text-xs text-muted-foreground">across the panchayat</p>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Welcome, Panchayat Member</CardTitle>
          <CardDescription>
            This is your dashboard to manage and monitor water supply schemes in your area. Use the navigation on the left to access different modules.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p>You can manage water schemes, view reports, and monitor the overall health of the water supply infrastructure.</p>
          <Button asChild className="mt-4">
            <Link href="/gram-panchayat/schemes">
              Manage Schemes <ArrowUpRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
