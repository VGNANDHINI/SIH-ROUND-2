import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { bills } from "@/lib/data";
import { ArrowUpRight, Droplet, FileText, IndianRupee } from "lucide-react";
import Link from "next/link";

export default function VillageResidentDashboard() {
  const dueBill = bills.find(b => b.status === 'Due');
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Water Status</CardTitle>
            <Droplet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Available</div>
            <p className="text-xs text-muted-foreground">Supply is normal in your area</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Bill</CardTitle>
            <IndianRupee className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dueBill ? `₹${dueBill.amount}` : "₹0"}
            </div>
            <p className="text-xs text-muted-foreground">{dueBill ? `Due on ${dueBill.dueDate}` : "All bills paid"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="flex flex-col space-y-2">
            <Button asChild size="sm" className="w-full">
              <Link href="/village-resident/billing">Pay Bill</Link>
            </Button>
            <Button asChild size="sm" variant="outline" className="w-full">
              <Link href="/village-resident/availability">Check Availability</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

       <Card>
        <CardHeader>
          <CardTitle>Welcome, Resident</CardTitle>
          <CardDescription>
            Your portal for all water-related services in your village.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p>Here you can check water supply status, view and pay your bills, and receive important notifications.</p>
        </CardContent>
      </Card>
    </div>
  );
}
