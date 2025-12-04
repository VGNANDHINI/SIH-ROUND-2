"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { usePumpIssues, useWaterSchemes } from "@/firebase";
import { ArrowUpRight, Droplets, Users, AlertCircle, Loader2, CheckSquare } from "lucide-react";
import Link from "next/link";

export default function BlockOfficialDashboard() {
  const { data: waterSchemes, loading: loadingSchemes } = useWaterSchemes();
  const { data: pumpIssues, loading: loadingIssues } = usePumpIssues();

  const totalSchemes = waterSchemes?.length ?? 0;
  const panchayats = waterSchemes ? [...new Set(waterSchemes.map(s => s.village))].length : 0;
  const totalIssues = pumpIssues?.length ?? 0;
  const openIssues = pumpIssues?.filter(i => i.status === 'Open').length ?? 0;
  const pendingApprovals = waterSchemes?.filter(s => s.approvalStatus === 'Pending').length ?? 0;
  const loading = loadingSchemes || loadingIssues;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Panchayats</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? <Loader2 className="h-6 w-6 animate-spin" /> : panchayats}</div>
            <p className="text-xs text-muted-foreground">under supervision</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
            <CheckSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? <Loader2 className="h-6 w-6 animate-spin" /> : pendingApprovals}</div>
            <p className="text-xs text-muted-foreground">schemes awaiting review</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Water Schemes</CardTitle>
            <Droplets className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? <Loader2 className="h-6 w-6 animate-spin" /> : totalSchemes}</div>
            <p className="text-xs text-muted-foreground">across all panchayats</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Open Issues</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? <Loader2 className="h-6 w-6 animate-spin" /> : openIssues}</div>
            <p className="text-xs text-muted-foreground">out of {totalIssues} total issues</p>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Welcome, Official</CardTitle>
          <CardDescription>
            Oversee regional water management, analyze data dashboards, and coordinate across panchayats.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p>This dashboard provides a high-level overview of the water supply status in your block/district. You have schemes to review. Use the navigation to see details.</p>
           <div className="flex gap-4 mt-4">
              <Button asChild>
                <Link href="/block-official/approvals">
                  Review Schemes <ArrowUpRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="secondary">
                <Link href="/block-official/analytics">
                  View Analytics <ArrowUpRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
