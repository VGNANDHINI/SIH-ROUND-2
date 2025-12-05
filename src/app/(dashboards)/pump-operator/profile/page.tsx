
'use client';

import { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useUser, useDoc, useFirestore } from '@/firebase';
import type { UserProfile } from '@/lib/data';
import { Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Form,
  FormControl,
  FormDescription,
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
import { doc, setDoc } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

const profileSchema = z.object({
  pumpName: z.string().min(1, 'Pump name is required.'),
  pumpCategory: z.string().min(1, 'Please select a pump category.'),
  pumpDischargeRate: z.coerce.number().min(1, 'Discharge rate is required.'),
  motorHorsepower: z.coerce.number().min(0.5, 'Motor HP is required.'),
  tankHeight: z.coerce.number().min(1, 'Tank height is required.'),
  tankBaseArea: z.coerce.number().min(1, 'Tank base area is required.'),
  distributionNetworkDetails: z.string().optional(),
});

export default function OperatorProfilePage() {
  const { user, loading: userLoading } = useUser();
  const {
    data: profile,
    loading: profileLoading,
  } = useDoc<UserProfile>(user ? `users/${user.uid}` : null);
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      pumpName: '',
      pumpCategory: '',
      pumpDischargeRate: 0,
      motorHorsepower: 0,
      tankHeight: 0,
      tankBaseArea: 0,
      distributionNetworkDetails: '',
    },
  });
  
  useEffect(() => {
    if (profile) {
      form.reset({
        pumpName: profile.pumpName || '',
        pumpCategory: profile.pumpCategory || '',
        pumpDischargeRate: profile.pumpDischargeRate || 0,
        motorHorsepower: profile.motorHorsepower || 0,
        tankHeight: profile.tankHeight || 0,
        tankBaseArea: profile.tankBaseArea || 0,
        distributionNetworkDetails: profile.distributionNetworkDetails || '',
      });
    }
  }, [profile, form]);


  const onSubmit = async (values: z.infer<typeof profileSchema>) => {
    if (!firestore || !user) {
        toast({ title: "Error", description: "You are not signed in.", variant: "destructive"});
        return;
    }

    setIsSaving(true);
    const userDocRef = doc(firestore, 'users', user.uid);
    
    setDoc(userDocRef, values, { merge: true })
        .then(() => {
            toast({ title: "Profile Saved", description: "Your infrastructure profile has been updated." });
        })
        .catch((serverError) => {
            const permissionError = new FirestorePermissionError({
                path: userDocRef.path,
                operation: 'update',
                requestResourceData: values,
            });
            errorEmitter.emit('permission-error', permissionError);
        })
        .finally(() => {
            setIsSaving(false);
        });

  };

  const loading = userLoading || profileLoading;

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Operator Infrastructure Profile</CardTitle>
        <CardDescription>
          Set pump and tank parameters. These values are crucial for automatic
          calculation of water production, energy usage, and tank levels.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <FormField
                  control={form.control}
                  name="pumpCategory"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pump Category</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a pump category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="submersible">
                            Submersible Pump
                          </SelectItem>
                          <SelectItem value="open-well">
                            Open Well / Shallow Submersible
                          </SelectItem>
                          <SelectItem value="surface-centrifugal">
                            Surface Centrifugal Pump
                          </SelectItem>
                          <SelectItem value="monoblock">
                            Monoblock Pump
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Select the category that best fits your pump.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="pumpName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pump Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Main Well Pump" {...field} />
                      </FormControl>
                      <FormDescription>
                        Give a unique name to this pump.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="pumpDischargeRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pump Discharge Rate</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="150" {...field} />
                      </FormControl>
                      <FormDescription>
                        The rate at which the pump moves water, in Liters per
                        Minute (LPM).
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="motorHorsepower"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Motor Horsepower (HP)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.5" placeholder="5" {...field} />
                      </FormControl>
                      <FormDescription>
                        The horsepower of the pump's motor.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="tankHeight"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tank Height</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.1" placeholder="3" {...field} />
                      </FormControl>
                      <FormDescription>
                        Total height of the main tank, in meters.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="tankBaseArea"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tank Base Area</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.1" placeholder="10.5" {...field} />
                      </FormControl>
                      <FormDescription>
                        Surface area of the tank's base, in sq. meters.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="distributionNetworkDetails"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Distribution Network Details</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="e.g., 3 main distribution lines, 150 household connections..."
                          {...field}
                          rows={3}
                        />
                      </FormControl>
                       <FormDescription>
                        Briefly describe the distribution network.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Button type="submit" disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                Save Profile
              </Button>
            </form>
          </Form>
        )}
      </CardContent>
    </Card>
  );
}
