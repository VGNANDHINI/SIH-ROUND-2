
"use client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useComplaints, useUser, useFirestore } from "@/firebase";
import type { Complaint } from "@/lib/data";
import { AlertCircle, FileQuestion, Wrench, Loader2, Play, Square, Timer } from "lucide-react";
import Link from "next/link";
import { useState, useMemo, useEffect } from "react";
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";
import { useToast } from "@/hooks/use-toast";

const useTimer = (startTime: Date | null) => {
    const [elapsedTime, setElapsedTime] = useState('00:00:00');

    useEffect(() => {
        if (!startTime) {
            setElapsedTime('00:00:00');
            return;
        };

        const interval = setInterval(() => {
            const now = new Date();
            const diff = now.getTime() - startTime.getTime();

            const hours = Math.floor(diff / (1000 * 60 * 60)).toString().padStart(2, '0');
            const minutes = Math.floor((diff / (1000 * 60)) % 60).toString().padStart(2, '0');
            const seconds = Math.floor((diff / 1000) % 60).toString().padStart(2, '0');

            setElapsedTime(`${hours}:${minutes}:${seconds}`);
        }, 1000);

        return () => clearInterval(interval);
    }, [startTime]);

    return elapsedTime;
}


const TimerDisplay = ({ complaint }: { complaint: Complaint }) => {
    const startTime = useMemo(() => {
        if (complaint.taskStartedAt && !complaint.taskCompletedAt) {
            return new Date((complaint.taskStartedAt as any).seconds * 1000);
        }
        return null;
    }, [complaint.taskStartedAt, complaint.taskCompletedAt]);

    const elapsedTime = useTimer(startTime);

    if (!startTime) return null;

    return (
        <div className="flex items-center text-sm text-muted-foreground">
            <Timer className="mr-1 h-4 w-4" />
            {elapsedTime}
        </div>
    );
};


export default function PumpOperatorDashboard() {
    const { user, loading: userLoading } = useUser();
    const { data: allComplaints, loading: complaintsLoading } = useComplaints();
    const firestore = useFirestore();
    const { toast } = useToast();

    const [isResolveDialogOpen, setResolveDialogOpen] = useState(false);
    const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
    const [actionTaken, setActionTaken] = useState('');
    const [isUpdating, setIsUpdating] = useState(false);

    const assignedComplaints = useMemo(() => {
        if (!user || !allComplaints) return [];
        return allComplaints.filter(c => c.operatorEmail === user.email);
    }, [user, allComplaints]);
    
    const openComplaintsCount = assignedComplaints.filter(c => c.status === 'In Progress').length;
    const loading = userLoading || complaintsLoading;

    const handleStartTask = (complaint: Complaint) => {
        if (!firestore) return;
        const complaintRef = doc(firestore, 'complaints', complaint.id);
        const updatedData = { ...complaint, taskStartedAt: serverTimestamp() };

        setDoc(complaintRef, updatedData, { merge: true }).catch(async (serverError) => {
            const permissionError = new FirestorePermissionError({
                path: complaintRef.path,
                operation: 'update',
                requestResourceData: updatedData,
            });
            errorEmitter.emit('permission-error', permissionError);
        });
    };

    const handleResolveClick = (complaint: Complaint) => {
        setSelectedComplaint(complaint);
        setResolveDialogOpen(true);
    };

    const handleConfirmResolution = () => {
        if (!firestore || !selectedComplaint) return;
        setIsUpdating(true);
        const complaintRef = doc(firestore, 'complaints', selectedComplaint.id);
        const updatedData = {
            ...selectedComplaint,
            status: 'Resolved' as const,
            taskCompletedAt: serverTimestamp(),
            actionTaken,
        };

        setDoc(complaintRef, updatedData, { merge: true })
            .then(() => {
                toast({ title: "Task Resolved", description: "Complaint has been marked as resolved." });
            })
            .catch(async (serverError) => {
                 const permissionError = new FirestorePermissionError({
                    path: complaintRef.path,
                    operation: 'update',
                    requestResourceData: updatedData,
                });
                errorEmitter.emit('permission-error', permissionError);
            })
            .finally(() => {
                setIsUpdating(false);
                setResolveDialogOpen(false);
                setSelectedComplaint(null);
                setActionTaken('');
            });
    };

    const getBadgeVariant = (status: Complaint['status']) => {
        switch (status) {
            case 'Open': return 'destructive';
            case 'In Progress': return 'secondary';
            case 'Resolved': return 'success';
        }
    };

    return (
        <>
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
                                    <TableHead>Issue / Address</TableHead>
                                    <TableHead>Description</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Reported At</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
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
                                            <TableCell>
                                                <div className="font-medium">{complaint.issueType}</div>
                                                <div className="text-xs text-muted-foreground">{complaint.address}</div>
                                            </TableCell>
                                            <TableCell className="max-w-xs truncate">{complaint.description}</TableCell>
                                            <TableCell>
                                                <div className="flex flex-col gap-1 items-start">
                                                    <Badge variant={getBadgeVariant(complaint.status)}>{complaint.status}</Badge>
                                                    <TimerDisplay complaint={complaint} />
                                                </div>
                                            </TableCell>
                                            <TableCell>{complaint.reportedAt ? new Date((complaint.reportedAt as any).seconds * 1000).toLocaleDateString() : 'N/A'}</TableCell>
                                            <TableCell className="text-right space-x-2">
                                                {complaint.status === 'In Progress' && !complaint.taskStartedAt && (
                                                    <Button variant="outline" size="sm" onClick={() => handleStartTask(complaint)}>
                                                        <Play className="mr-2 h-4 w-4"/> Start Task
                                                    </Button>
                                                )}
                                                 {complaint.status === 'In Progress' && complaint.taskStartedAt && (
                                                    <Button variant="destructive" size="sm" onClick={() => handleResolveClick(complaint)}>
                                                        <Square className="mr-2 h-4 w-4"/> Mark as Resolved
                                                    </Button>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                        )}
                    </CardContent>
                </Card>
            </div>
            
            <Dialog open={isResolveDialogOpen} onOpenChange={setResolveDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Resolve Complaint</DialogTitle>
                        <DialogDescription>
                            Describe the action you took to resolve this issue. This will mark the task as complete.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Textarea 
                            placeholder="e.g., Replaced the faulty motor..."
                            value={actionTaken}
                            onChange={(e) => setActionTaken(e.target.value)}
                            rows={4}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setResolveDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleConfirmResolution} disabled={!actionTaken || isUpdating}>
                            {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                            Confirm Resolution
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
