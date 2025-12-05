'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useUser, useFirestore, useDoc } from '@/firebase';
import type { UserProfile, WaterTest } from '@/lib/data';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

const testSchema = z.object({
  ward: z.string().min(1, 'Ward/Location is required.'),
  locationType: z.enum(['source', 'tank', 'pipeline', 'household']),
  pH: z.coerce.number(),
  turbidity: z.coerce.number().min(0),
  chlorine: z.coerce.number().min(0),
  tds: z.coerce.number().min(0),
  iron: z.coerce.number().min(0),
  fluoride: z.coerce.number().min(0),
  nitrate: z.coerce.number().min(0),
  coliform: z.enum(['true', 'false']).transform((val) => val === 'true'),
  hardness: z.coerce.number().min(0),
  alkalinity: z.coerce.number().min(0),
  chloride: z.coerce.number().min(0),
  arsenic: z.coerce.number().min(0),
  h2s: z.string(),
});

type WaterQualityFormValues = z.infer<typeof testSchema>;

// BIS 10500:2012 Standards (Acceptable Limit, Permissible Limit)
const STANDARDS = {
  pH: { acceptable: [6.5, 8.5], permissible: [6.5, 8.5] },
  turbidity: { acceptable: 1, permissible: 5 }, // NTU
  chlorine: { acceptable: 0.2, permissible: 1.0 }, // mg/L (residual)
  tds: { acceptable: 500, permissible: 2000 }, // mg/L
  hardness: { acceptable: 200, permissible: 600 }, // mg/L as CaCO3
  alkalinity: { acceptable: 200, permissible: 600 }, // mg/L as CaCO3
  chloride: { acceptable: 250, permissible: 1000 }, // mg/L
  iron: { acceptable: 0.3, permissible: 1.0 }, // mg/L
  fluoride: { acceptable: 1.0, permissible: 1.5 }, // mg/L
  nitrate: { acceptable: 45, permissible: 45 }, // mg/L
  coliform: { acceptable: false, permissible: false }, // Should be absent
};

const evaluateWaterQuality = (data: WaterQualityFormValues) => {
    let status: 'safe' | 'unsafe' | 'attention-needed' = 'safe';
    const flaggedParameters: string[] = [];

    if (data.pH < STANDARDS.pH.acceptable[0] || data.pH > STANDARDS.pH.acceptable[1]) {
        flaggedParameters.push(`pH (${data.pH})`);
        status = 'attention-needed';
    }
    if (data.turbidity > STANDARDS.turbidity.acceptable) {
        flaggedParameters.push(`Turbidity (${data.turbidity} NTU)`);
        status = 'attention-needed';
    }
    if (data.chlorine < STANDARDS.chlorine.acceptable) {
        flaggedParameters.push(`Chlorine (${data.chlorine} mg/L)`);
        status = 'attention-needed';
    }
    if (data.tds > STANDARDS.tds.acceptable) {
        flaggedParameters.push(`TDS (${data.tds} mg/L)`);
        status = 'attention-needed';
    }
    if (data.coliform === true) {
        flaggedParameters.push('Coliform (Present)');
        status = 'unsafe';
    }
    
    // If any parameter exceeds permissible limits, it's unsafe
    if (data.turbidity > STANDARDS.turbidity.permissible || data.tds > STANDARDS.tds.permissible || data.iron > STANDARDS.iron.permissible) {
        status = 'unsafe';
    }

    return { status, flaggedParameters };
}


export function WaterQualityLogForm({ onTestLogged }: { onTestLogged: (test: WaterTest) => void }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { user } = useUser();
  const { data: profile } = useDoc<UserProfile>(user ? `users/${user.uid}` : null);
  const firestore = useFirestore();

  const form = useForm<WaterQualityFormValues>({
    resolver: zodResolver(testSchema),
    defaultValues: {
      ward: 'Main Tank Outlet',
      locationType: 'tank',
      pH: 7.4,
      turbidity: 0.8,
      chlorine: 0.6,
      tds: 250,
      iron: 0.1,
      fluoride: 0.8,
      nitrate: 10,
      coliform: false,
      hardness: 180,
      alkalinity: 150,
      chloride: 100,
      arsenic: 0.005,
      h2s: 'No color change',
    },
  });

  const onSubmit = async (values: WaterQualityFormValues) => {
    if (!firestore || !user || !profile) {
      toast({
        title: 'Error',
        description: 'Not authenticated or profile missing.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    
    const { status, flaggedParameters } = evaluateWaterQuality(values);

    const testData: Omit<WaterTest, 'id'> = {
      ...values,
      panchayatId: profile.panchayat,
      operatorId: user.uid, // Assuming GP user is logging, can be changed
      testDate: serverTimestamp(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      status,
      flaggedParameters,
      reviewedByGp: false,
      reviewedByBe: false,
      remarks: '',
      samplePhotoUrl: '',
    };

    try {
      const collectionRef = collection(
        firestore,
        `panchayats/${profile.panchayat}/waterTests`
      );
      const docRef = await addDoc(collectionRef, testData);
      
      const optimisticNewTest: WaterTest = {
          ...testData,
          id: docRef.id,
          testDate: new Date(), // use local date for immediate feedback
      };

      toast({
        title: `Test Logged: Status ${status.toUpperCase()}`,
        description: `Water quality test for ${values.ward} has been submitted.`,
        variant: status === 'unsafe' ? 'destructive' : 'default',
      });
      onTestLogged(optimisticNewTest);
      form.reset();

    } catch (error) {
      console.error(error);
      const permissionError = new FirestorePermissionError({
        path: `panchayats/${profile.panchayat}/waterTests`,
        operation: 'create',
        requestResourceData: testData,
      });
      errorEmitter.emit('permission-error', permissionError);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Log Water Quality</CardTitle>
        <CardDescription>
          Enter results from the JJM Field Test Kit (FTK).
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="ward"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Test Location</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Main Tank, Ward 5 Tap" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <h4 className="text-sm font-medium pt-2">Core Parameters</h4>
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="pH" render={({ field }) => (
                  <FormItem>
                      <FormLabel>pH</FormLabel>
                      <FormControl><Input type="number" step="0.1" {...field} /></FormControl>
                  </FormItem>
              )} />
              <FormField control={form.control} name="turbidity" render={({ field }) => (
                  <FormItem>
                      <FormLabel>Turbidity (NTU)</FormLabel>
                      <FormControl><Input type="number" step="0.1" {...field} /></FormControl>
                  </FormItem>
              )} />
              <FormField control={form.control} name="hardness" render={({ field }) => (
                  <FormItem>
                      <FormLabel>Hardness (mg/L)</FormLabel>
                      <FormControl><Input type="number" step="1" {...field} /></FormControl>
                  </FormItem>
              )} />
              <FormField control={form.control} name="alkalinity" render={({ field }) => (
                  <FormItem>
                      <FormLabel>Alkalinity (mg/L)</FormLabel>
                      <FormControl><Input type="number" step="1" {...field} /></FormControl>
                  </FormItem>
              )} />
               <FormField control={form.control} name="chloride" render={({ field }) => (
                  <FormItem>
                      <FormLabel>Chloride (mg/L)</FormLabel>
                      <FormControl><Input type="number" step="1" {...field} /></FormControl>
                  </FormItem>
              )} />
               <FormField control={form.control} name="chlorine" render={({ field }) => (
                  <FormItem>
                      <FormLabel>Chlorine (mg/L)</FormLabel>
                      <FormControl><Input type="number" step="0.1" {...field} /></FormControl>
                  </FormItem>
              )} />
            </div>
             <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Log & Evaluate Data
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
