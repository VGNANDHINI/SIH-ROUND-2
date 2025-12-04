'use client';

import { useMemo, useState } from 'react';
import { useComplaints, useDoc, useUser } from '@/firebase';
import type { Complaint, UserProfile } from '@/lib/data';
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
import { Loader2 } from 'lucide-react';

export default function ViewComplaintsPage() {
  const { user, loading: userLoading } = useUser();
  const { data: currentUserProfile, loading: profileLoading } = useDoc<UserProfile>(user ? `users/${user.uid}` : null);
  const { data: allComplaints, loading: complaintsLoading } = useComplaints();

  const filteredComplaints = useMemo(() => {
    if (!currentUserProfile || !allComplaints) return [];
    return allComplaints.filter(
      (complaint) => complaint.userPanchayat === currentUserProfile.panchayat
    );
  }, [currentUserProfile, allComplaints]);

  const loading = userLoading || profileLoading || complaintsLoading;
  
  const getStatusBadgeVariant = (status: Complaint['status']) => {
    switch (status) {
      case 'Open': return 'destructive';
      case 'In Progress': return 'secondary';
      case 'Resolved': return 'success';
    }
  };

  return (
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
                <TableHead>Description</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Reported At</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredComplaints.length === 0 ? (
                <TableRow>
                    <TableCell colSpan={6} className="text-center h-24">No complaints found for your panchayat.</TableCell>
                </TableRow>
              ) : (
                filteredComplaints.map((complaint) => (
                  <TableRow key={complaint.id}>
                    <TableCell className="font-medium">{complaint.issueType}</TableCell>
                    <TableCell>{complaint.address}</TableCell>
                    <TableCell className="max-w-xs truncate">{complaint.description}</TableCell>
                    <TableCell>{complaint.contactNumber}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(complaint.status)}>{complaint.status}</Badge>
                    </TableCell>
                    <TableCell>
                        {complaint.reportedAt ? new Date((complaint.reportedAt as any).seconds * 1000).toLocaleDateString() : 'N/A'}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
