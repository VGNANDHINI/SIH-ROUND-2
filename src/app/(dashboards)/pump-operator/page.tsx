import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { pumpIssues, type PumpIssue } from "@/lib/data";
import { AlertCircle, ArrowUpRight, CheckCircle, FileQuestion, Wrench } from "lucide-react";
import Link from "next/link";

export default function PumpOperatorDashboard() {
    const openIssues = pumpIssues.filter(i => i.status === 'Open').length;

    const getBadgeVariant = (status: PumpIssue['status']) => {
        switch (status) {
            case 'Open': return 'destructive';
            case 'In Progress': return 'secondary';
            case 'Resolved': return 'success';
        }
    };

    return (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Issues</CardTitle>
                        <AlertCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{pumpIssues.length}</div>
                        <p className="text-xs text-muted-foreground">in total</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Open Issues</CardTitle>
                        <Wrench className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{openIssues}</div>
                        <p className="text-xs text-muted-foreground">requiring attention</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
                        <FileQuestion className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                       <Button asChild size="sm">
                           <Link href="/pump-operator/report">Report New Issue</Link>
                       </Button>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Recent Issues</CardTitle>
                    <CardDescription>A list of recently reported pump issues.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Pump ID</TableHead>
                                <TableHead>Location</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Reported At</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {pumpIssues.slice(0, 5).map((issue) => (
                                <TableRow key={issue.id}>
                                    <TableCell className="font-medium">{issue.pumpId}</TableCell>
                                    <TableCell>{issue.location}</TableCell>
                                    <TableCell><Badge variant={getBadgeVariant(issue.status)}>{issue.status}</Badge></TableCell>
                                    <TableCell>{issue.reportedAt}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
