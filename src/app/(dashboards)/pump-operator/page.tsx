
"use client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useComplaints, useUser } from "@/firebase";
import type { Complaint } from "@/lib/data";
import { AlertCircle, FileQuestion, Wrench, Loader2 } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";

export default function PumpOperatorDashboard() {
    const { user, loading: userLoading } = useUser();
    const { data: allComplaints, loading: complaintsLoading } = useComplaints();

    const assignedComplaints = useMemo(() => {
        if (!user || !allComplaints) return [];
        return allComplaints.filter(c => c.operatorEmail === user.email);
    }, [user, allComplaints]);
    
    const openComplaintsCount = assignedComplaints.filter(c => c.status === 'In Progress').length;
    const loading = userLoading || complaintsLoading;

    const getBadgeVariant = (status: Complaint['status']) => {
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
                        <CardTitle className="text-sm font-medium">Total Assigned Complaints</CardTitle>
                        <AlertCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{loading ? <Loader2 className="h-6 w-6 animate-spin" /> : assignedComplaints.length}</div>
                        <p className="text-xs text-muted-foreground">in total</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pending Tasks</CardTitle>
                        <Wrench className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{loading ? <Loader2 className="h-6 w-6 animate-spin" /> : openComplaintsCount}</div>
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
                    <CardTitle>My Assigned Complaints</CardTitle>
                    <CardDescription>Here are the complaints assigned to you.</CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                         <div className="flex justify-center items-center h-48">
                            <Loader2 className="h-8 w-8 animate-spin" />
                        </div>
                    ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Issue Type</TableHead>
                                <TableHead>Address</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Reported At</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {assignedComplaints.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center h-24">You have no complaints assigned to you.</TableCell>
                                </TableRow>
                            ) : (
                                assignedComplaints.map((complaint) => (
                                    <TableRow key={complaint.id}>
                                        <TableCell className="font-medium">{complaint.issueType}</TableCell>
                                        <TableCell>{complaint.address}</TableCell>
                                        <TableCell className="max-w-xs truncate">{complaint.description}</TableCell>
                                        <TableCell><Badge variant={getBadgeVariant(complaint.status)}>{complaint.status}</Badge></TableCell>
                                        <TableCell>{complaint.reportedAt ? new Date((complaint.reportedAt as any).seconds * 1000).toLocaleDateString() : 'N/A'}</TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

