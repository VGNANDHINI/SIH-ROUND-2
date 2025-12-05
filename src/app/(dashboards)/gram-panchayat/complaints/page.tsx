
'use client';

import { useMemo, useState } from 'react';
import { useComplaints, useDoc, useUser, useOperators, useFirestore } from '@/firebase';
import type { Complaint, UserProfile, Operator } from '@/lib/data';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, UserCheck, AlertTriangle, Flame, ShieldAlert, CheckCircle } from 'lucide-react';
import { doc, setDoc } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useToast } from '@/hooks/use-toast';

// --- Priority Engine Logic ---

// Risk multipliers for different issue types
const riskMultipliers: Record<Complaint['issueType'], number> = {
    "Dirty water": 10,
    "No water": 8,
    "Leakage": 6,
    "Motor off": 5,
    "Low pressure": 2,
    "Others": 1,
};

// Estimated households affected for different issue types
const hhAffected: Record<Complaint['issueType'], number> = {
    "Dirty water": 100, // Assumes main line contamination
    "No water": 50,    // Assumes a major pump/line failure
    "Leakage": 20,     // Assumes a significant leak
    "Motor off": 50,
    "Low pressure": 10, // Affects a smaller cluster of houses
    "Others": 5,
};

const getHoursOverdue = (reportedAt: any): number => {
    if (!reportedAt) return 0;
    // Firestore timestamps need to be converted to JS Date objects
    const reportedDate = reportedAt.toDate ? reportedAt.toDate() : new Date(reportedAt);
    const now = new Date();
    const diffInMs = now.getTime() - reportedDate.getTime();
    return Math.floor(diffInMs / (1000 * 60 * 60));
};

const calculatePriority = (complaint: Complaint) => {
    const hoursOverdue = getHoursOverdue(complaint.reportedAt);
    const risk = riskMultipliers[complaint.issueType] || 1;
    const affected = hhAffected[complaint.issueType] || 5;

    // Adjusted the multipliers to better fit the 0-100 scale.
    const score = (affected * 0.5) + (hoursOverdue * 1) + (risk * 5);
    return Math.min(Math.round(score), 100); // Cap score at 100
};

const getPriorityInfo = (score: number) => {
    if (score >= 85) return { icon: <Flame className="h-5 w-5 text-red-600" />, label: "PRIORITISE FIRST", recommendation: "FIX NOW! Drop everything. This impacts many households.", color: "text-red-600", bgColor: "bg-red-50 dark:bg-red-900/20" };
    if (score >= 60) return { icon: <ShieldAlert className="h-5 w-5 text-orange-500" />, label: "Urgent", recommendation: "Fix within 2 hours. Call for assistance if needed.", color: "text-orange-500", bgColor: "bg-orange-50 dark:bg-orange-900/20" };
    if (score >= 30) return { icon: <AlertTriangle className="h-5 w-5 text-yellow-500" />, label: "Soon", recommendation: "Address this today before the evening supply.", color: "text-yellow-500", bgColor: "bg-yellow-50 dark:bg-yellow-900/20" };
    return { icon: <CheckCircle className="h-5 w-5 text-green-600" />, label: "Later", recommendation: "Can wait. Check on this tomorrow.", color: "text-green-600", bgColor: "bg-green-50 dark:bg-green-900/20" };
};


// --- Component ---

export default function ViewComplaintsPage() {
  const { user, loading: userLoading } = useUser();
  const { data: currentUserProfile, loading: profileLoading } = useDoc<UserProfile>(user ? `users/${user.uid}` : null);
  const { data: allComplaints, loading: complaintsLoading } = useComplaints();
  const { data: allOperators, loading: operatorsLoading } = useOperators();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [isAssignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [selectedOperatorId, setSelectedOperatorId] = useState<string | null>(null);
  const [isAssigning, setIsAssigning] = useState(false);


  const prioritizedComplaints = useMemo(() => {
    if (!currentUserProfile || !allComplaints) return [];
    
    const panchayatComplaints = allComplaints.filter(
      (complaint) => complaint.userPanchayat === currentUserProfile.panchayat && complaint.status !== 'Resolved'
    );
    
    return panchayatComplaints
        .map(c => ({ ...c, priority: calculatePriority(c) }))
        .sort((a, b) => b.priority - a.priority);

  }, [currentUserProfile, allComplaints]);
  
  const availableOperators = useMemo(() => {
    if (!selectedComplaint || !allOperators) return [];
    return allOperators.filter(op => op.panchayat === selectedComplaint.userPanchayat);
  }, [selectedComplaint, allOperators]);


  const loading = userLoading || profileLoading || complaintsLoading || operatorsLoading;
  
  const handleAssignClick = (complaint: Complaint) => {
    setSelectedComplaint(complaint);
    setAssignDialogOpen(true);
  };
  
  const handleConfirmAssignment = async () => {
    if (!firestore || !selectedComplaint || !selectedOperatorId) return;

    const operator = allOperators?.find(op => op.id === selectedOperatorId);
    if (!operator) return;

    setIsAssigning(true);

    const complaintRef = doc(firestore, 'complaints', selectedComplaint.id);

    // Create a new object without the priority field for Firestore
    const { priority, ...complaintData } = selectedComplaint;

    const updatedData = {
        ...complaintData,
        status: 'In Progress',
        assignedTo: operator.id,
        assignedOperatorName: operator.name,
        operatorEmail: operator.email,
    };

    setDoc(complaintRef, updatedData, { merge: true })
      .then(() => {
        toast({
            title: "Complaint Assigned",
            description: `Assigned to ${operator.name}. Status updated to "In Progress".`
        });
      })
      .catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
          path: complaintRef.path,
          operation: 'update',
          requestResourceData: updatedData,
        });
        errorEmitter.emit('permission-error', permissionError);
        toast({
            variant: "destructive",
            title: "Assignment Failed",
            description: "Could not update the complaint. Please try again."
        });
      })
      .finally(() => {
        setIsAssigning(false);
        setAssignDialogOpen(false);
        setSelectedComplaint(null);
        setSelectedOperatorId(null);
      });
  };


  const getStatusBadgeVariant = (status: Complaint['status']) => {
    switch (status) {
      case 'Open': return 'destructive';
      case 'In Progress': return 'secondary';
      case 'Resolved': return 'success';
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Prioritized Complaints Inbox</CardTitle>
          <CardDescription>
            Review and manage complaints submitted by residents in your panchayat, sorted by urgency.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : prioritizedComplaints.length === 0 ? (
             <div className="text-center py-12 text-muted-foreground">
                <CheckCircle className="mx-auto h-12 w-12" />
                <h3 className="mt-4 text-lg font-medium">All Clear!</h3>
                <p>There are no open complaints in your panchayat.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {prioritizedComplaints.map((complaint) => {
                  const priorityInfo = getPriorityInfo(complaint.priority);
                  return (
                    <Card key={complaint.id} className={`shadow-sm ${priorityInfo.bgColor}`}>
                        <CardContent className="p-4">
                            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
                                <div className="md:col-span-3 flex items-start gap-4">
                                    <div className="pt-1">{priorityInfo.icon}</div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`font-bold text-sm ${priorityInfo.color}`}>{priorityInfo.label}</span>
                                            <Badge variant={getStatusBadgeVariant(complaint.status)}>{complaint.status}</Badge>
                                        </div>
                                        <p className="font-semibold">{complaint.issueType} at {complaint.address}</p>
                                        <p className="text-sm text-muted-foreground">{complaint.description}</p>
                                    </div>
                                </div>
                                <div className="md:col-span-2 flex flex-col md:flex-row items-start md:items-center justify-end gap-4">
                                     <div className="text-left md:text-right">
                                        <p className={`font-bold text-lg ${priorityInfo.color}`}>{complaint.priority} pts</p>
                                        <p className="text-xs text-muted-foreground">{getHoursOverdue(complaint.reportedAt)} hours ago</p>
                                    </div>
                                    {complaint.status === 'Open' ? (
                                        <Button size="sm" onClick={() => handleAssignClick(complaint)}>
                                            <UserCheck className="mr-2 h-4 w-4" />
                                            Assign
                                        </Button>
                                    ) : (
                                        <div className="text-xs text-center p-2 rounded-md bg-background/50">
                                            <p className="font-medium">Assigned To:</p>
                                            <p className="text-muted-foreground">{complaint.assignedOperatorName}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className={`mt-3 pl-10 text-sm ${priorityInfo.color}`}>
                                👉 {priorityInfo.recommendation}
                            </div>
                        </CardContent>
                    </Card>
                  )
              })}
            </div>
          )}
        </CardContent>
      </Card>
      
      <Dialog open={isAssignDialogOpen} onOpenChange={setAssignDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Assign Operator</DialogTitle>
              <DialogDescription>
                Select an operator to assign to this complaint. Only operators in the same panchayat are shown.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              {availableOperators.length > 0 ? (
                <Select onValueChange={setSelectedOperatorId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an operator" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableOperators.map(op => (
                      <SelectItem key={op.id} value={op.id}>{op.name} ({op.email})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No operators found for this Panchayat. Please add one in the Operator Management section.
                </p>
              )}
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setAssignDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleConfirmAssignment} disabled={!selectedOperatorId || isAssigning || availableOperators.length === 0}>
                {isAssigning ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                Confirm Assignment
              </Button>
            </DialogFooter>
          </DialogContent>
      </Dialog>
    </>
  );
}
