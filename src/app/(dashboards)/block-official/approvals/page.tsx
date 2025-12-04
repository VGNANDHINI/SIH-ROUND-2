'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
import { useWaterSchemes, useFirestore } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';
import type { WaterScheme } from '@/lib/data';
import { Check, X, Loader2 } from 'lucide-react';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export default function SchemeApprovalsPage() {
  const { data: schemes, loading } = useWaterSchemes();
  const firestore = useFirestore();

  const handleApproval = (
    scheme: WaterScheme,
    approvalStatus: 'Approved' | 'Rejected'
  ) => {
    if (!firestore) return;

    const docRef = doc(firestore, 'waterSchemes', scheme.id);
    const updatedData = { ...scheme, approvalStatus };

    setDoc(docRef, updatedData, { merge: true }).catch(async (serverError) => {
      const permissionError = new FirestorePermissionError({
        path: docRef.path,
        operation: 'update',
        requestResourceData: updatedData,
      });
      errorEmitter.emit('permission-error', permissionError);
    });
  };

  const getApprovalBadgeVariant = (status: WaterScheme['approvalStatus']) => {
    switch (status) {
      case 'Approved':
        return 'success';
      case 'Pending':
        return 'secondary';
      case 'Rejected':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Scheme Approvals</CardTitle>
        <CardDescription>
          Review and approve or reject water schemes submitted by Gram
          Panchayats.
        </CardDescription>
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
                <TableHead>Scheme Name</TableHead>
                <TableHead>Village</TableHead>
                <TableHead>Approval Status</TableHead>
                <TableHead>Coverage</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {schemes?.map((scheme) => (
                <TableRow key={scheme.id}>
                  <TableCell className="font-medium">{scheme.name}</TableCell>
                  <TableCell>{scheme.village}</TableCell>
                  <TableCell>
                    <Badge variant={getApprovalBadgeVariant(scheme.approvalStatus)}>
                      {scheme.approvalStatus}
                    </Badge>
                  </TableCell>
                  <TableCell>{scheme.coverage}%</TableCell>
                  <TableCell>{scheme.lastUpdated}</TableCell>
                  <TableCell className="text-right space-x-2">
                    {scheme.approvalStatus === 'Pending' ? (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleApproval(scheme, 'Approved')}
                          className="text-green-600 border-green-600 hover:bg-green-50 hover:text-green-700"
                        >
                          <Check className="mr-2 h-4 w-4" />
                          Approve
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleApproval(scheme, 'Rejected')}
                          className="text-red-600 border-red-600 hover:bg-red-50 hover:text-red-700"
                        >
                          <X className="mr-2 h-4 w-4" />
                          Reject
                        </Button>
                      </>
                    ) : (
                      <span className="text-xs text-muted-foreground">Reviewed</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
