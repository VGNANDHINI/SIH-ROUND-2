
'use client';

import { useState, useMemo } from 'react';
import { useComplaints, useFirestore, useUser } from '@/firebase';
import type { Complaint } from '@/lib/data';
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
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Check, X, Eye } from 'lucide-react';
import { doc, setDoc } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';

export default function WorkVerificationPage() {
  const { data: allComplaints, loading: complaintsLoading } = useComplaints();
  const { user, loading: userLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [isRejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [isPhotoDialogOpen, setPhotoDialogOpen] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const complaintsToVerify = useMemo(() => {
    if (!allComplaints) return [];
    return allComplaints.filter(c => c.status === 'Pending Verification');
  }, [allComplaints]);

  const loading = complaintsLoading || userLoading;

  const handleAction = (complaint: Complaint, action: 'approve' | 'reject') => {
    setSelectedComplaint(complaint);
    if (action === 'reject') {
      setRejectDialogOpen(true);
    } else {
      handleConfirmApproval(complaint);
    }
  };
  
  const handleConfirmApproval = (complaint: Complaint) => {
    if (!firestore || !user) return;
    setIsUpdating(true);
    const complaintRef = doc(firestore, 'complaints', complaint.id);
    const updatedData = { 
        ...complaint, 
        status: 'Resolved' as const,
        verifiedBy: user.email,
        rejectionReason: '', // Clear previous rejection reason if any
    };

    // Remove id before sending to firestore
    const { id, ...finalData } = updatedData;

    setDoc(complaintRef, finalData, { merge: true })
        .then(() => toast({ title: "Work Approved", description: "The complaint has been marked as resolved." }))
        .catch(async (serverError) => {
             const permissionError = new FirestorePermissionError({ path: complaintRef.path, operation: 'update', requestResourceData: finalData });
             errorEmitter.emit('permission-error', permissionError);
        })
        .finally(() => setIsUpdating(false));
  }

  const handleConfirmRejection = () => {
    if (!firestore || !selectedComplaint || !user) return;
    setIsUpdating(true);
    const complaintRef = doc(firestore, 'complaints', selectedComplaint.id);
    const updatedData = {
        ...selectedComplaint,
        status: 'In Progress' as const,
        rejectionReason: rejectionReason,
        verifiedBy: user.email,
        taskStartedAt: null, // Reset timer
        taskCompletedAt: null,
    };
    
    // Remove id before sending to firestore
    const { id, ...finalData } = updatedData;

    setDoc(complaintRef, finalData, { merge: true })
      .then(() => {
        toast({ variant: "destructive", title: "Work Rejected", description: "The complaint has been sent back to the operator." });
      })
      .catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({ path: complaintRef.path, operation: 'update', requestResourceData: finalData });
        errorEmitter.emit('permission-error', permissionError);
      })
      .finally(() => {
        setIsUpdating(false);
        setRejectDialogOpen(false);
        setSelectedComplaint(null);
        setRejectionReason('');
      });
  };
  
  const openPhoto = (complaint: Complaint) => {
      setSelectedComplaint(complaint);
      setPhotoDialogOpen(true);
  }
  
  const getStatusBadgeVariant = (status: Complaint['status']) => {
    switch (status) {
      case 'Open': return 'destructive';
      case 'In Progress': return 'secondary';
      case 'Pending Verification': return 'default';
      case 'Resolved': return 'success';
      default: return 'outline';
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Complaint Work Verification</CardTitle>
          <CardDescription>
            Review and verify the resolution work submitted by pump operators.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Panchayat</TableHead>
                  <TableHead>Issue / Address</TableHead>
                  <TableHead>Operator</TableHead>
                  <TableHead>Action Taken</TableHead>
                  <TableHead>Completed At</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {complaintsToVerify.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center h-24">No complaints are pending verification.</TableCell></TableRow>
                ) : (
                  complaintsToVerify.map((complaint) => (
                    <TableRow key={complaint.id}>
                      <TableCell>{complaint.userPanchayat}</TableCell>
                      <TableCell>
                         <div className="font-medium">{complaint.issueType}</div>
                         <div className="text-xs text-muted-foreground">{complaint.address}</div>
                      </TableCell>
                      <TableCell>{complaint.assignedOperatorName}</TableCell>
                      <TableCell className="max-w-xs truncate">{complaint.actionTaken}</TableCell>
                      <TableCell>{complaint.taskCompletedAt ? new Date((complaint.taskCompletedAt as any).seconds * 1000).toLocaleString() : 'N/A'}</TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button variant="outline" size="sm" onClick={() => openPhoto(complaint)} disabled={!complaint.resolutionPhotoUrl}><Eye className="mr-2 h-4 w-4"/>View Photo</Button>
                        <Button variant="outline" size="sm" className="text-green-600 border-green-600 hover:bg-green-50 hover:text-green-700" onClick={() => handleAction(complaint, 'approve')}><Check className="mr-2 h-4 w-4"/>Approve</Button>
                        <Button variant="outline" size="sm" className="text-red-600 border-red-600 hover:bg-red-50 hover:text-red-700" onClick={() => handleAction(complaint, 'reject')}><X className="mr-2 h-4 w-4"/>Reject</Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      
      <Dialog open={isRejectDialogOpen} onOpenChange={setRejectDialogOpen}>
          <DialogContent>
              <DialogHeader>
                  <DialogTitle>Reject Resolution</DialogTitle>
                  <DialogDescription>Please provide a reason for rejecting this work. The operator will be notified.</DialogDescription>
              </DialogHeader>
              <div className="py-4">
                  <Textarea placeholder="e.g., The leak is still visible. Please fix it properly." value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} rows={4}/>
              </div>
              <DialogFooter>
                  <Button variant="ghost" onClick={() => setRejectDialogOpen(false)}>Cancel</Button>
                  <Button variant="destructive" onClick={handleConfirmRejection} disabled={!rejectionReason || isUpdating}>
                      {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                      Confirm Rejection
                  </Button>
              </DialogFooter>
          </DialogContent>
      </Dialog>

      <Dialog open={isPhotoDialogOpen} onOpenChange={setPhotoDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Resolution Photo</DialogTitle>
            <DialogDescription>Image submitted by {selectedComplaint?.assignedOperatorName} for complaint at {selectedComplaint?.address}.</DialogDescription>
          </DialogHeader>
          <div className="my-4">
            {selectedComplaint?.resolutionPhotoUrl ? (
                <Image src={selectedComplaint.resolutionPhotoUrl} alt="Resolution photo" width={800} height={600} className="rounded-md object-contain"/>
            ) : <p className="text-muted-foreground">No photo available.</p>}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
