
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
import { Loader2, UserCheck } from 'lucide-react';
import { doc, setDoc } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useToast } from '@/hooks/use-toast';

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


  const filteredComplaints = useMemo(() => {
    if (!currentUserProfile || !allComplaints) return [];
    return allComplaints.filter(
      (complaint) => complaint.userPanchayat === currentUserProfile.panchayat
    );
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

    const updatedData = {
        ...selectedComplaint,
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
          <CardTitle>Complaints Inbox</CardTitle>
          <CardDescription>
            Review and manage complaints submitted by residents in your panchayat.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Issue Type</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead>Reported At</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredComplaints.length === 0 ? (
                  <TableRow>
                      <TableCell colSpan={7} className="text-center h-24">No complaints found for your panchayat.</TableCell>
                  </TableRow>
                ) : (
                  filteredComplaints.map((complaint) => (
                    <TableRow key={complaint.id}>
                      <TableCell className="font-medium">{complaint.issueType}</TableCell>
                      <TableCell className="max-w-xs truncate">{complaint.address}</TableCell>
                      <TableCell>{complaint.contactNumber}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(complaint.status)}>{complaint.status}</Badge>
                      </TableCell>
                      <TableCell>{complaint.assignedOperatorName || 'N/A'}</TableCell>
                      <TableCell>
                          {complaint.reportedAt ? new Date((complaint.reportedAt as any).seconds * 1000).toLocaleDateString() : 'N/A'}
                      </TableCell>
                      <TableCell className="text-right">
                          {complaint.status === 'Open' && (
                              <Button variant="outline" size="sm" onClick={() => handleAssignClick(complaint)}>
                                <UserCheck className="mr-2 h-4 w-4" />
                                Assign
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

