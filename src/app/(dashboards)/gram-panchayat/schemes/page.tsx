"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useWaterSchemes, useFirestore } from "@/firebase";
import { collection, addDoc, doc, setDoc, deleteDoc } from "firebase/firestore";
import type { WaterScheme } from "@/lib/data";
import { Edit, PlusCircle, Trash2, Loader2 } from "lucide-react";
import React, { useState } from "react";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";

export default function SchemesPage() {
  const { data: schemes, loading } = useWaterSchemes();
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [currentScheme, setCurrentScheme] = useState<Partial<WaterScheme> | null>(null);
  const firestore = useFirestore();

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!firestore) return;

    const formData = new FormData(e.currentTarget);
    const newSchemeData: Omit<WaterScheme, 'id'> = {
      name: formData.get('name') as string,
      village: formData.get('village') as string,
      status: formData.get('status') as WaterScheme['status'],
      coverage: Number(formData.get('coverage')),
      lastUpdated: new Date().toISOString().split('T')[0],
      approvalStatus: 'Pending',
    };

    if (currentScheme?.id) {
      const docRef = doc(firestore, "waterSchemes", currentScheme.id);
      setDoc(docRef, newSchemeData, { merge: true }).catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: docRef.path,
            operation: 'update',
            requestResourceData: newSchemeData,
        });
        errorEmitter.emit('permission-error', permissionError);
      });
    } else {
      const collectionRef = collection(firestore, "waterSchemes");
      addDoc(collectionRef, newSchemeData).catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: collectionRef.path,
            operation: 'create',
            requestResourceData: newSchemeData,
        });
        errorEmitter.emit('permission-error', permissionError);
      });
    }
    setDialogOpen(false);
    setCurrentScheme(null);
  };
  
  const handleDelete = (id: string) => {
    if(!firestore) return;
    const docRef = doc(firestore, "waterSchemes", id);
    deleteDoc(docRef).catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: docRef.path,
            operation: 'delete',
        });
        errorEmitter.emit('permission-error', permissionError);
    });
  }

  const getBadgeVariant = (status: WaterScheme['status']) => {
    switch (status) {
      case 'Active':
        return 'success';
      case 'Under Maintenance':
        return 'secondary';
      case 'Inactive':
        return 'destructive';
      default:
        return 'outline';
    }
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
    <>
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <div>
            <CardTitle>Water Supply Schemes</CardTitle>
            <CardDescription>Manage water supply schemes in your panchayat.</CardDescription>
          </div>
          <Button onClick={() => { setCurrentScheme({ status: 'Active' }); setDialogOpen(true); }}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add New Scheme
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
                <TableHead>Scheme Name</TableHead>
                <TableHead>Village</TableHead>
                <TableHead>Status</TableHead>
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
                    <Badge variant={getBadgeVariant(scheme.status)}>{scheme.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getApprovalBadgeVariant(scheme.approvalStatus)}>{scheme.approvalStatus}</Badge>
                  </TableCell>
                  <TableCell>{scheme.coverage}%</TableCell>
                  <TableCell>{scheme.lastUpdated}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => { setCurrentScheme(scheme); setDialogOpen(true); }}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(scheme.id)}>
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
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{currentScheme?.id ? 'Edit Scheme' : 'Add New Scheme'}</DialogTitle>
            <DialogDescription>
              {currentScheme?.id ? 'Update the details of the water scheme.' : 'Fill in the details for the new water scheme.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSave}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">Name</Label>
                <Input id="name" name="name" defaultValue={currentScheme?.name} className="col-span-3" required />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="village" className="text-right">Village</Label>
                <Input id="village" name="village" defaultValue={currentScheme?.village} className="col-span-3" required />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="status" className="text-right">Status</Label>
                <Select name="status" defaultValue={currentScheme?.status}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                    <SelectItem value="Under Maintenance">Under Maintenance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="coverage" className="text-right">Coverage (%)</Label>
                <Input id="coverage" name="coverage" type="number" defaultValue={currentScheme?.coverage} className="col-span-3" required />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button type="submit">Save changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
