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
  pH: { good: [6.5, 8.5], attention: [6.0, 9.0] },
  turbidity: { good: 1, acceptable: 5 }, // NTU
  tds: { good: 500, acceptable: 2000 }, // mg/L
  chloride: { good: 250, acceptable: 1000 }, // mg/L
  chlorine: { good: [0.2, 0.5] }, // mg/L
  coliform: { good: false }, // Should be absent
  nitrate: { good: 45 }, // mg/L
  fluoride: { good: [0.6, 1.2], attention: 1.5 }, // mg/L
  iron: { good: 0.3 }, // mg/L
};

const evaluateWaterQuality = (data: WaterQualityFormValues) => {
    const flaggedParameters: string[] = [];
    let isUnsafe = false;
    let needsAttention = false;

    // pH
    if (data.pH < STANDARDS.pH.good[0] || data.pH > STANDARDS.pH.good[1]) {
        if (data.pH < STANDARDS.pH.attention[0] || data.pH > STANDARDS.pH.attention[1]) {
            isUnsafe = true;
            flaggedParameters.push(`pH (${data.pH})`);
        } else {
            needsAttention = true;
            flaggedParameters.push(`pH (${data.pH})`);
        }
    }
    
    // Turbidity
    if (data.turbidity > STANDARDS.turbidity.good) {
        if (data.turbidity > STANDARDS.turbidity.acceptable) {
            isUnsafe = true;
        } else {
            needsAttention = true;
        }
        flaggedParameters.push(`Turbidity (${data.turbidity} NTU)`);
    }

    // TDS
    if (data.tds > STANDARDS.tds.good) {
        if (data.tds > STANDARDS.tds.acceptable) {
            isUnsafe = true;
        } else {
            needsAttention = true;
        }
        flaggedParameters.push(`TDS (${data.tds} mg/L)`);
    }

    // Chloride
    if (data.chloride > STANDARDS.chloride.good) {
        if (data.chloride > STANDARDS.chloride.acceptable) {
            isUnsafe = true;
        } else {
            needsAttention = true;
        }
        flaggedParameters.push(`Chloride (${data.chloride} mg/L)`);
    }
    
    // Residual Chlorine
    if (data.chlorine < STANDARDS.chlorine.good[0] || data.chlorine > STANDARDS.chlorine.good[1]) {
        isUnsafe = true;
        flaggedParameters.push(`Chlorine (${data.chlorine} mg/L)`);
    }

    // Coliform
    if (data.coliform !== STANDARDS.coliform.good) {
        isUnsafe = true;
        flaggedParameters.push('Coliform (Present)');
    }

    // Nitrate
    if (data.nitrate > STANDARDS.nitrate.good) {
        isUnsafe = true;
        flaggedParameters.push(`Nitrate (${data.nitrate} mg/L)`);
    }

    // Fluoride
    if (data.fluoride < STANDARDS.fluoride.good[0] || data.fluoride > STANDARDS.fluoride.good[1]) {
        if (data.fluoride > STANDARDS.fluoride.attention) {
             isUnsafe = true;
        } else {
            needsAttention = true;
        }
        flaggedParameters.push(`Fluoride (${data.fluoride} mg/L)`);
    }

    // Iron
    if (data.iron > STANDARDS.iron.good) {
        isUnsafe = true;
        flaggedParameters.push(`Iron (${data.iron} mg/L)`);
    }

    let status: 'safe' | 'unsafe' | 'attention-needed';
    if (isUnsafe) {
        status = 'unsafe';
    } else if (needsAttention) {
        status = 'attention-needed';
    } else {
        status = 'safe';
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
        description: flaggedParameters.length > 0 
            ? `Flagged: ${flaggedParameters.join(', ')}`
            : `Water quality for ${values.ward} is safe.`,
        variant: status === 'unsafe' ? 'destructive' : (status === 'attention-needed' ? 'default' : 'success'),
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
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
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
              <FormField control={form.control} name="iron" render={({ field }) => (
                  <FormItem>
                      <FormLabel>Iron (mg/L)</FormLabel>
                      <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                  </FormItem>
              )} />
              <FormField control={form.control} name="nitrate" render={({ field }) => (
                  <FormItem>
                      <FormLabel>Nitrate (mg/L)</FormLabel>
                      <FormControl><Input type="number" step="1" {...field} /></FormControl>
                  </FormItem>
              )} />
              <FormField control={form.control} name="fluoride" render={({ field }) => (
                  <FormItem>
                      <FormLabel>Fluoride (mg/L)</FormLabel>
                      <FormControl><Input type="number" step="0.1" {...field} /></FormControl>
                  </FormItem>
              )} />
            </div>
             <h4 className="text-sm font-medium pt-2">Optional Parameters</h4>
             <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                 <FormField control={form.control} name="tds" render={({ field }) => (
                      <FormItem>
                          <FormLabel>TDS (mg/L)</FormLabel>
                          <FormControl><Input type="number" step="1" {...field} /></FormControl>
                      </FormItem>
                  )} />
                  <FormField control={form.control} name="arsenic" render={({ field }) => (
                      <FormItem>
                          <FormLabel>Arsenic (mg/L)</FormLabel>
                          <FormControl><Input type="number" step="0.001" {...field} /></FormControl>
                      </FormItem>
                  )} />
                   <FormField control={form.control} name="coliform" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Coliform Bacteria</FormLabel>
                             <Select onValueChange={field.onChange} defaultValue={String(field.value)}>
                                <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                <SelectContent>
                                    <SelectItem value="false">Absent</SelectItem>
                                    <SelectItem value="true">Present</SelectItem>
                                </SelectContent>
                            </Select>
                        </FormItem>
                    )} />
             </div>
             <FormField
              control={form.control}
              name="h2s"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>H₂S Vial Test Result</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., No color change" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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
