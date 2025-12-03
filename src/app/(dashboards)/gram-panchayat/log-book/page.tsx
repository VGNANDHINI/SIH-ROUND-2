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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { usePumpLogs, useUser } from '@/firebase';
import { useFirestore } from '@/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import type { PumpLog } from '@/lib/data';
import { PlusCircle, Loader2 } from 'lucide-react';
import React, { useState } from 'react';
import { format } from 'date-fns';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export default function LogBookPage() {
  const { data: logs, loading, setData: setLogs } = usePumpLogs();
  const [isDialogOpen, setDialogOpen] = useState(false);
  const firestore = useFirestore();
  const { user } = useUser();

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!firestore || !user) return;

    const formData = new FormData(e.currentTarget);
    const newLogData: Omit<PumpLog, 'id' | 'timestamp'> = {
      pumpId: formData.get('pumpId') as string,
      status: formData.get('status') as PumpLog['status'],
      waterSupplied: Number(formData.get('waterSupplied')),
      operatorName: user.displayName || user.email || 'Unknown User',
    };
    
    // Optimistically update the UI
    const optimisticLog: PumpLog = {
      id: `temp-${Date.now()}`,
      ...newLogData,
      timestamp: new Date().toISOString()
    };
    setLogs(currentLogs => [optimisticLog, ...(currentLogs || [])]);


    const collectionRef = collection(firestore, 'pumpLogs');
    
    addDoc(collectionRef, {
        ...newLogData,
        timestamp: serverTimestamp() // Use server-side timestamp
    }).catch(async (serverError) => {
        // If there's an error, roll back the optimistic update
        setLogs(currentLogs => currentLogs?.filter(log => log.id !== optimisticLog.id) || []);
        const permissionError = new FirestorePermissionError({
            path: collectionRef.path,
            operation: 'create',
            requestResourceData: newLogData,
        });
        errorEmitter.emit('permission-error', permissionError);
    });

    setDialogOpen(false);
  };

  return (
    <>
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <div>
            <CardTitle>Pump Log Book</CardTitle>
            <CardDescription>
              Record and view pump operations and water supply.
            </CardDescription>
          </div>
          <Button onClick={() => setDialogOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add New Log
          </Button>
        </CardHeader>
        <CardContent>
          {loading && !logs ? (
            <div className="flex justify-center items-center h-48">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Pump ID</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Water Supplied (Liters)</TableHead>
                  <TableHead>Operator</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs
                  ?.sort(
                    (a, b) => {
                      const dateA = a.timestamp && (a.timestamp as any).toDate ? (a.timestamp as any).toDate() : new Date(a.timestamp as string);
                      const dateB = b.timestamp && (b.timestamp as any).toDate ? (b.timestamp as any).toDate() : new Date(b.timestamp as string);
                      return dateB.getTime() - dateA.getTime();
                    }
                  )
                  .map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        {(log.timestamp as any)?.toDate ? format(
                          (log.timestamp as any).toDate(),
                          'PPp'
                        ) : 'Just now...'}
                      </TableCell>
                      <TableCell className="font-medium">{log.pumpId}</TableCell>
                      <TableCell>
                        <Badge
                          variant={log.status === 'On' ? 'success' : 'secondary'}
                        >
                          {log.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {log.waterSupplied.toLocaleString()}
                      </TableCell>
                      <TableCell>{log.operatorName}</TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New Log Entry</DialogTitle>
            <DialogDescription>
              Fill in the details of the pump operation. The timestamp will be
              recorded automatically.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSave}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="pumpId" className="text-right">
                  Pump ID
                </Label>
                <Input
                  id="pumpId"
                  name="pumpId"
                  defaultValue="PMP-RG-01"
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="status" className="text-right">
                  Status
                </Label>
                <Select name="status" defaultValue="On" required>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="On">On</SelectItem>
                    <SelectItem value="Off">Off</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="waterSupplied" className="text-right">
                  Water Supplied (L)
                </Label>
                <Input
                  id="waterSupplied"
                  name="waterSupplied"
                  type="number"
                  defaultValue="5000"
                  className="col-span-3"
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Save Log</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
