
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useUser, useFirestore, useDoc } from '@/firebase';
import type { UserProfile } from '@/lib/data';
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
import { Loader2, AlertTriangle, ShieldCheck, CheckCircle } from 'lucide-react';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';

const testSchema = z.object({
  source_name: z.string().min(1, 'Source name is required.'),
  ph: z.coerce.number(),
  tds: z.coerce.number(),
  turbidity: z.coerce.number(),
  chlorine: z.coerce.number(),
  bacteria_present: z.boolean(),
  location: z.string().min(1, 'Test location is required.'),
  sample_by: z.string().optional(),
  test_kit: z.enum(['Manual', 'Digital']),
  remark: z.string().optional(),
});

type WaterQualityFormValues = z.infer<typeof testSchema>;

type TestResult = {
  qualityScore: number;
  status: '✅ Safe Drinking Water' | '⚠ Needs Attention' | '❌ Unsafe';
  recommendedAction: string;
};

export default function OperatorWaterQualityPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<TestResult | null>(null);
  const { toast } = useToast();
  const { user, loading: userLoading } = useUser();
  const { data: profile, loading: profileLoading } = useDoc<UserProfile>(
    user ? `users/${user.uid}` : null
  );
  const firestore = useFirestore();
  const loading = userLoading || profileLoading;

  const form = useForm<WaterQualityFormValues>({
    resolver: zodResolver(testSchema),
    defaultValues: {
      source_name: 'Main Borewell',
      ph: 7.2,
      tds: 350,
      turbidity: 1.2,
      chlorine: 0.5,
      bacteria_present: false,
      location: 'Village',
      test_kit: 'Manual',
      sample_by: '',
      remark: '',
    },
  });
  
  const calculateResult = (data: WaterQualityFormValues): TestResult => {
    let qualityScore = 0;
    if (data.ph < 6.5 || data.ph > 8.5) qualityScore += 2;
    if (data.tds > 500) qualityScore += 3;
    if (data.turbidity > 5) qualityScore += 4;
    if (data.chlorine < 0.2 || data.chlorine > 1) qualityScore += 2;
    if (data.bacteria_present) qualityScore += 5;

    let status: TestResult['status'];
    if (qualityScore >= 7) status = '❌ Unsafe';
    else if (qualityScore >= 3) status = '⚠ Needs Attention';
    else status = '✅ Safe Drinking Water';

    let recommendedAction = '';
    if (data.bacteria_present) {
        recommendedAction = "Immediate chlorination + stop supply + health alert";
    } else if (data.chlorine < 0.2) {
        recommendedAction = "Increase chlorination immediately";
    } else if (data.turbidity > 5) {
        recommendedAction = "Check sedimentation tank and clean filters";
    } else if (qualityScore >= 7) {
        recommendedAction = "Stop supply immediately and report to authority";
    } else if (qualityScore >= 3) {
        recommendedAction = "Apply corrective action and retest within 24–48 hours";
    } else {
        recommendedAction = "Water is safe — continue routine monitoring";
    }
    
    return { qualityScore, status, recommendedAction };
  }

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
    setResult(null);
    
    const testResult = calculateResult(values);

    const logData = {
      ...values,
      gp_id: profile.panchayat,
      timestamp: serverTimestamp(),
      bacteria_present: values.bacteria_present ? 'Yes' : 'No',
      quality_score: testResult.qualityScore,
      status: testResult.status,
      recommended_action: testResult.recommendedAction
    };

    try {
      const collectionRef = collection(firestore, 'water_quality_logs');
      await addDoc(collectionRef, logData);
      setResult(testResult);
      toast({ title: 'Success', description: 'Water quality test submitted.' });
    } catch (error) {
      console.error(error);
       const permissionError = new FirestorePermissionError({
        path: 'water_quality_logs',
        operation: 'create',
        requestResourceData: logData,
      });
      errorEmitter.emit('permission-error', permissionError);
      toast({
        title: 'Submission Failed',
        description: 'Could not submit the test. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
    const getResultIcon = (status?: string) => {
        if (!status) return null;
        if (status.includes('Unsafe')) return <AlertTriangle className="h-10 w-10 text-red-500" />;
        if (status.includes('Attention')) return <ShieldCheck className="h-10 w-10 text-yellow-500" />;
        return <CheckCircle className="h-10 w-10 text-green-500" />;
    };

  return (
    <div className="grid lg:grid-cols-2 gap-8 items-start">
      <Card>
        <CardHeader>
          <CardTitle>Water Quality Test Log</CardTitle>
          <CardDescription>
            Enter results from your field test kit.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Loader2 className="h-6 w-6 animate-spin" />
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="source_name" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Source Name</FormLabel>
                            <FormControl><Input placeholder="e.g., Main Borewell" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                    <FormField control={form.control} name="location" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Test Location</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                <SelectContent>
                                    <SelectItem value="Village">Village</SelectItem>
                                    <SelectItem value="Tank">Tank</SelectItem>
                                    <SelectItem value="Tap">Tap</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )} />
                </div>
                <div className="grid grid-cols-3 gap-4">
                     <FormField control={form.control} name="ph" render={({ field }) => (
                        <FormItem>
                            <FormLabel>pH Level</FormLabel>
                            <FormControl><Input type="number" step="0.1" {...field} /></FormControl>
                        </FormItem>
                    )} />
                     <FormField control={form.control} name="tds" render={({ field }) => (
                        <FormItem>
                            <FormLabel>TDS (ppm)</FormLabel>
                            <FormControl><Input type="number" step="1" {...field} /></FormControl>
                        </FormItem>
                    )} />
                     <FormField control={form.control} name="turbidity" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Turbidity (NTU)</FormLabel>
                            <FormControl><Input type="number" step="0.1" {...field} /></FormControl>
                        </FormItem>
                    )} />
                </div>
                 <div className="grid grid-cols-2 gap-4">
                     <FormField control={form.control} name="chlorine" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Chlorine (ppm)</FormLabel>
                            <FormControl><Input type="number" step="0.1" {...field} /></FormControl>
                        </FormItem>
                    )} />
                     <FormField
                        control={form.control}
                        name="bacteria_present"
                        render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm mt-2">
                                <div className="space-y-0.5">
                                    <FormLabel>Bacteria Present</FormLabel>
                                </div>
                                <FormControl>
                                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                                </FormControl>
                            </FormItem>
                        )}
                        />
                </div>
                 <div className="grid grid-cols-2 gap-4">
                      <FormField control={form.control} name="sample_by" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Sample Taken By</FormLabel>
                            <FormControl><Input placeholder="Your name" {...field} /></FormControl>
                        </FormItem>
                    )} />
                     <FormField control={form.control} name="test_kit" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Test Kit Type</FormLabel>
                             <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                <SelectContent>
                                    <SelectItem value="Manual">Manual</SelectItem>
                                    <SelectItem value="Digital">Digital</SelectItem>
                                </SelectContent>
                            </Select>
                        </FormItem>
                    )} />
                 </div>
                 <FormField control={form.control} name="remark" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Remark</FormLabel>
                        <FormControl><Textarea placeholder="Any additional observations..." {...field} /></FormControl>
                    </FormItem>
                )} />

                <Button type="submit" disabled={isSubmitting} className="w-full">
                  {isSubmitting && (<Loader2 className="mr-2 h-4 w-4 animate-spin" />)}
                  Submit Water Test
                </Button>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>

      <Card className="sticky top-24">
        <CardHeader>
            <CardTitle>Test Result</CardTitle>
            <CardDescription>The analysis of your submitted data will appear here.</CardDescription>
        </CardHeader>
        <CardContent className="min-h-[300px] flex items-center justify-center">
             {isSubmitting ? <Loader2 className="h-8 w-8 animate-spin text-primary"/> : (
                result ? (
                    <div className="text-center space-y-4">
                        {getResultIcon(result.status)}
                        <div>
                            <p className="text-sm text-muted-foreground">Water Status</p>
                            <p className="font-bold text-xl">{result.status}</p>
                        </div>
                         <div>
                            <p className="text-sm text-muted-foreground">Quality Score</p>
                            <p className="text-4xl font-bold">{result.qualityScore}</p>
                        </div>
                        <div>
                             <p className="text-sm text-muted-foreground">Recommendation</p>
                             <p className="font-semibold text-lg">{result.recommendedAction}</p>
                        </div>
                    </div>
                ) : (
                    <p className="text-muted-foreground">Submit the form to see the result.</p>
                )
            )}
        </CardContent>
      </Card>
    </div>
  );
}
