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
import { Button } from '@/components/ui/button';
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
import { useOperators, useFirestore } from '@/firebase';
import { collection, addDoc, doc, setDoc, deleteDoc } from 'firebase/firestore';
import type { Operator } from '@/lib/data';
import { Edit, PlusCircle, Trash2, Loader2, Users } from 'lucide-react';
import React, { useState } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export default function OperatorManagementPage() {
  const { data: operators, loading } = useOperators();
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [currentOperator, setCurrentOperator] = useState<Partial<Operator> | null>(null);
  const firestore = useFirestore();

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!firestore) return;

    const formData = new FormData(e.currentTarget);
    const newOperatorData: Omit<Operator, 'id'> = {
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      phone: formData.get('phone') as string,
      state: formData.get('state') as string,
      district: formData.get('district') as string,
      block: formData.get('block') as string,
      panchayat: formData.get('panchayat') as string,
    };

    if (currentOperator?.id) {
      const docRef = doc(firestore, 'operators', currentOperator.id);
      setDoc(docRef, newOperatorData, { merge: true }).catch(
        async (serverError) => {
          const permissionError = new FirestorePermissionError({
            path: docRef.path,
            operation: 'update',
            requestResourceData: newOperatorData,
          });
          errorEmitter.emit('permission-error', permissionError);
        }
      );
    } else {
      const collectionRef = collection(firestore, 'operators');
      addDoc(collectionRef, newOperatorData).catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
          path: collectionRef.path,
          operation: 'create',
          requestResourceData: newOperatorData,
        });
        errorEmitter.emit('permission-error', permissionError);
      });
    }
    setDialogOpen(false);
    setCurrentOperator(null);
  };

  const handleDelete = (id: string) => {
    if (!firestore) return;
    const docRef = doc(firestore, 'operators', id);
    deleteDoc(docRef).catch(async (serverError) => {
      const permissionError = new FirestorePermissionError({
        path: docRef.path,
        operation: 'delete',
      });
      errorEmitter.emit('permission-error', permissionError);
    });
  };

  return (
    <>
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <div>
            <CardTitle>Operator Management</CardTitle>
            <CardDescription>
              Add, edit, and manage pump operators in your panchayat.
            </CardDescription>
          </div>
          <Button
            onClick={() => {
              setCurrentOperator({});
              setDialogOpen(true);
            }}
          >
            <PlusCircle className="mr-2 h-4 w-4" /> Add New Operator
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
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Panchayat</TableHead>
                  <TableHead>Block</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {operators?.map((op) => (
                  <TableRow key={op.id}>
                    <TableCell className="font-medium">{op.name}</TableCell>
                    <TableCell>{op.email}</TableCell>
                    <TableCell>{op.phone}</TableCell>
                    <TableCell>{op.panchayat}</TableCell>
                    <TableCell>{op.block}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setCurrentOperator(op);
                          setDialogOpen(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(op.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {currentOperator?.id ? 'Edit Operator' : 'Add New Operator'}
            </DialogTitle>
            <DialogDescription>
              Fill in the details for the operator.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSave}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Name
                </Label>
                <Input
                  id="name"
                  name="name"
                  defaultValue={currentOperator?.name}
                  className="col-span-3"
                  required
                />
              </div>
               <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="email" className="text-right">
                  Email
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  defaultValue={currentOperator?.email}
                  className="col-span-3"
                  required
                />
              </div>
               <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="phone" className="text-right">
                  Phone
                </Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  defaultValue={currentOperator?.phone}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="panchayat" className="text-right">
                  Panchayat
                </Label>
                <Input
                  id="panchayat"
                  name="panchayat"
                  defaultValue={currentOperator?.panchayat}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="block" className="text-right">
                  Block
                </Label>
                <Input
                  id="block"
                  name="block"
                  defaultValue={currentOperator?.block}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="district" className="text-right">
                  District
                </Label>
                <Input
                  id="district"
                  name="district"
                  defaultValue={currentOperator?.district}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="state" className="text-right">
                  State
                </Label>
                <Input
                  id="state"
                  name="state"
                  defaultValue={currentOperator?.state}
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
              <Button type="submit">Save changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

    