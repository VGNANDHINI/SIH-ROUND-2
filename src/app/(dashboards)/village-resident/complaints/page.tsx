
'use client';

import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload } from 'lucide-react';
import { useFirestore, useUser, useDoc, useComplaints } from '@/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import type { UserProfile, Complaint } from '@/lib/data';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

const complaintSchema = z.object({
  issueType: z.string().min(1, 'Please select an issue type.'),
  address: z.string().min(5, 'Address must be at least 5 characters long.'),
  description: z
    .string()
    .min(10, 'Description must be at least 10 characters long.'),
  contactNumber: z.string().min(10, 'Please enter a valid contact number.'),
  photo: z.any().optional(),
});

export default function RegisterComplaintPage() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user, loading: userLoading } = useUser();
  const { data: userProfile, loading: userProfileLoading } = useDoc<UserProfile>(
    user ? `users/${user.uid}` : null
  );
  const { data: allComplaints, loading: complaintsLoading } = useComplaints();

  const userComplaints = useMemo(() => {
    if (!user || !allComplaints) return [];
    return allComplaints.filter(c => c.userId === user.uid).sort((a,b) => (b.reportedAt as any) - (a.reportedAt as any));
  }, [user, allComplaints]);


  const form = useForm<z.infer<typeof complaintSchema>>({
    resolver: zodResolver(complaintSchema),
    defaultValues: {
      issueType: '',
      address: '',
      description: '',
      contactNumber: userProfile?.phoneNumber || '',
    },
  });

  // Keep default values in sync with user profile
  useState(() => {
      if (userProfile?.phoneNumber) {
          form.setValue('contactNumber', userProfile.phoneNumber);
      }
  });


  async function onSubmit(values: z.infer<typeof complaintSchema>) {
    if (!firestore || !user) {
      toast({
        variant: 'destructive',
        title: 'Authentication Error',
        description: 'You must be logged in to file a complaint.',
      });
      return;
    }

    setIsLoading(true);

    const { photo, ...restOfValues } = values;

    const complaintData = {
      ...restOfValues,
      photoUrl: '', // Placeholder for photo upload logic
      reportedAt: serverTimestamp(),
      status: 'Open' as const,
      userId: user.uid,
      // User profile data might be loading, so provide defaults
      userPanchayat: userProfile?.panchayat || 'N/A',
      userBlock: userProfile?.block || 'N/A',
      userDistrict: userProfile?.district || 'N/A',
      userState: userProfile?.state || 'N/A',
    };

    const collectionRef = collection(firestore, 'complaints');

    addDoc(collectionRef, complaintData)
      .then(() => {
        toast({
          title: 'Complaint Registered',
          description: 'Your complaint has been successfully submitted.',
        });
        form.reset();
      })
      .catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
          path: collectionRef.path,
          operation: 'create',
          requestResourceData: complaintData,
        });
        errorEmitter.emit('permission-error', permissionError);
        toast({
            variant: 'destructive',
            title: 'Failed to Register Complaint',
            description: 'An error occurred. Please try again.',
        })
      })
      .finally(() => {
        setIsLoading(false);
      });
  }

  const loading = userLoading || userProfileLoading;
  
  const getStatusBadgeVariant = (status: Complaint['status']) => {
    switch (status) {
      case 'Open': return 'destructive';
      case 'In Progress': return 'secondary';
      case 'Resolved': return 'success';
      default: return 'outline';
    }
  };

  return (
    <div className="space-y-8">
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle>Register a Complaint</CardTitle>
          <CardDescription>
            Please provide the details of your issue. This will be sent to your
            local Gram Panchayat official.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin"/></div> : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="issueType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Issue Type</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select an issue type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="No water">No water</SelectItem>
                          <SelectItem value="Low pressure">Low pressure</SelectItem>
                          <SelectItem value="Dirty water">Dirty water</SelectItem>
                          <SelectItem value="Leakage">Leakage</SelectItem>
                          <SelectItem value="Motor off">Motor off</SelectItem>
                          <SelectItem value="Others">Others</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address / Ward / Landmark</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Near the old temple" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                  control={form.control}
                  name="contactNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Number</FormLabel>
                      <FormControl>
                        <Input placeholder="Your contact number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Short Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe the issue in detail..."
                        className="resize-none"
                        rows={4}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="photo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Upload Photo (Optional)</FormLabel>
                    <FormControl>
                      <div className="flex items-center justify-center w-full">
                        <label
                          htmlFor="dropzone-file"
                          className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-card hover:bg-muted"
                        >
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <Upload className="w-8 h-8 mb-3 text-muted-foreground" />
                            <p className="mb-2 text-sm text-muted-foreground">
                              <span className="font-semibold">Click to upload</span>{' '}
                              or drag and drop
                            </p>
                            <p className="text-xs text-muted-foreground">
                              PNG or JPG
                            </p>
                          </div>
                          <Input
                            id="dropzone-file"
                            type="file"
                            className="hidden"
                            {...field}
                            onChange={(e) => field.onChange(e.target.files)}
                          />
                        </label>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isLoading || loading} className="w-full">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...
                  </>
                ) : (
                  'Submit Complaint'
                )}
              </Button>
            </form>
          </Form>
          )}
        </CardContent>
      </Card>
      
      <Separator />

      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle>My Complaint History</CardTitle>
          <CardDescription>Track the status of your submitted complaints here.</CardDescription>
        </CardHeader>
        <CardContent>
          {complaintsLoading ? (
             <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin"/></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reported On</TableHead>
                  <TableHead>Issue</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {userComplaints.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">
                      You have not submitted any complaints yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  userComplaints.map(complaint => (
                    <TableRow key={complaint.id}>
                      <TableCell>{complaint.reportedAt ? new Date((complaint.reportedAt as any).seconds * 1000).toLocaleDateString() : 'N/A'}</TableCell>
                      <TableCell className="font-medium">{complaint.issueType}</TableCell>
                      <TableCell>{complaint.address}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(complaint.status)}>{complaint.status}</Badge>
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
  );
}
