'use client';

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
import { Switch } from '@/components/ui/switch';
import { useCollection } from '@/firebase/firestore/use-collection';
import { useFirestore, useUser } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { BookMarked, Loader2 } from 'lucide-react';
import type { WaterSupply } from '@/lib/data';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function PumpControlPage() {
  const {
    data: waterSupply,
    loading,
  } = useCollection<WaterSupply>('waterSupply');
  const firestore = useFirestore();
  const { user } = useUser();

  const handleToggle = (pump: WaterSupply) => {
    if (!firestore || !user) return;

    const newStatus = pump.status === 'On' ? 'Off' : 'On';
    const docRef = doc(firestore, 'waterSupply', pump.id);

    const updatedData = {
      ...pump,
      status: newStatus,
      lastChangedBy: user.email,
      lastChangedAt: new Date().toISOString(),
    };

    setDoc(docRef, updatedData, { merge: true }).catch(
      async (serverError) => {
        const permissionError = new FirestorePermissionError({
          path: docRef.path,
          operation: 'update',
          requestResourceData: updatedData,
        });
        errorEmitter.emit('permission-error', permissionError);
      }
    );
  };

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <div>
          <CardTitle>Pump Control Center</CardTitle>
          <CardDescription>
            Monitor and control the operational status of water pumps in real-time.
          </CardDescription>
        </div>
        <Button asChild>
          <Link href="/gram-panchayat/log-book">
            <BookMarked className="mr-2 h-4 w-4" /> View Log Book
          </Link>
        </Button>
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
                <TableHead>Pump ID</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Changed By</TableHead>
                <TableHead>Last Changed At</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {waterSupply?.map((pump) => (
                <TableRow key={pump.id}>
                  <TableCell className="font-medium">{pump.pumpId}</TableCell>
                  <TableCell>{pump.location}</TableCell>
                  <TableCell>
                    <span
                      className={`font-semibold ${
                        pump.status === 'On'
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}
                    >
                      {pump.status}
                    </span>
                  </TableCell>
                  <TableCell>{pump.lastChangedBy}</TableCell>
                  <TableCell>
                    {pump.lastChangedAt ? new Date(pump.lastChangedAt).toLocaleString() : 'N/A'}
                  </TableCell>
                  <TableCell className="text-right">
                    <Switch
                      checked={pump.status === 'On'}
                      onCheckedChange={() => handleToggle(pump)}
                      aria-label={`Toggle pump ${pump.pumpId}`}
                    />
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
