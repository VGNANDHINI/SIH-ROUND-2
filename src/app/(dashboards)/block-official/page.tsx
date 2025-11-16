import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { pumpIssues, waterSchemes } from "@/lib/data";
import { ArrowUpRight, CheckCircle, Droplets, Users, AlertCircle } from "lucide-react";
import Link from "next/link";

export default function BlockOfficialDashboard() {
  const totalSchemes = waterSchemes.length;
  const panchayats = [...new Set(waterSchemes.map(s => s.village))].length; // Assuming village is a proxy for panchayat here
  const totalIssues = pumpIssues.length;
  const openIssues = pumpIssues.filter(i => i.status === 'Open').length;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Panchayats</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{panchayats}</div>
            <p className="text-xs text-muted-foreground">under supervision</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Water Schemes</CardTitle>
            <Droplets className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSchemes}</div>
            <p className="text-xs text-muted-foreground">across all panchayats</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Open Issues</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{openIssues}</div>
            <p className="text-xs text-muted-foreground">out of {totalIssues} total issues</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Go to Analytics</CardTitle>
          </CardHeader>
          <CardContent>
             <Button asChild>
              <Link href="/block-official/analytics">
                View Analytics <ArrowUpRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
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
          <p>This dashboard provides a high-level overview of the water supply status in your block/district. For detailed insights and visualizations, please proceed to the Analytics section.</p>
        </CardContent>
      </Card>
    </div>
  );
}
