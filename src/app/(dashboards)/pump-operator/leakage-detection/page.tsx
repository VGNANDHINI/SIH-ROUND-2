'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useFirestore, useUser, useDoc, useDailyLeakChecks } from '@/firebase';
import { collection, addDoc, serverTimestamp, query, orderBy, limit, getDocs } from 'firebase/firestore';
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
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import type { UserProfile, DailyLeakCheck } from '@/lib/data';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const dailyCheckSchema = z.object({
  pump_hours_today: z.coerce.number().min(0, 'Pump hours cannot be negative.'),
  pump_hours_previous: z.coerce.number().min(0, 'Previous hours cannot be negative.'),
  tank_level_change: z.enum(['Increase', 'No change', 'Decrease']),
  pressure_level: z.enum(['High', 'Normal', 'Low']),
  flow_rate: z.enum(['Normal', 'Low']),
  complaints_count: z.coerce.number().min(0, 'Complaints count cannot be negative.'),
});

export default function LeakageDetectionPage() {
  const { user, loading: userLoading } = useUser();
  const { data: profile, loading: profileLoading } = useDoc<UserProfile>(user ? `users/${user.uid}` : null);
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastCheck, setLastCheck] = useState<DailyLeakCheck | null>(null);
  const [lastCheckLoading, setLastCheckLoading] = useState(true);
  const [result, setResult] = useState<{ severity: string, message: string } | null>(null);

  const form = useForm<z.infer<typeof dailyCheckSchema>>({
    resolver: zodResolver(dailyCheckSchema),
    defaultValues: {
      pump_hours_today: 8,
      pump_hours_previous: 0,
      tank_level_change: 'No change',
      pressure_level: 'Normal',
      flow_rate: 'Normal',
      complaints_count: 0,
    },
  });

  useEffect(() => {
    if (!firestore || !profile?.panchayat) {
      setLastCheckLoading(false);
      return;
    };
    
    const fetchLastCheck = async () => {
        setLastCheckLoading(true);
        const checksCollection = collection(firestore, 'daily_leak_checks');
        const q = query(checksCollection, orderBy('timestamp', 'desc'), limit(1));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
            const latestDoc = snapshot.docs[0].data() as DailyLeakCheck;
            setLastCheck(latestDoc);
            form.setValue('pump_hours_previous', latestDoc.pump_hours_today);
        }
        setLastCheckLoading(false);
    }
    
    fetchLastCheck();

  }, [firestore, profile, form]);


  const calculateLeakScore = (data: z.infer<typeof dailyCheckSchema>) => {
      let leakScore = 0;
      let { pump_hours_previous } = data;
      const { pump_hours_today, tank_level_change, pressure_level, flow_rate, complaints_count } = data;

      // Missing Data Handling
      if (!pump_hours_previous || pump_hours_previous === 0) {
          pump_hours_previous = pump_hours_today;
      }

      // Rule-Based Scoring
      if (pump_hours_today > (pump_hours_previous * 1.3) && tank_level_change === "No change") {
          leakScore += 3;
      }
      if (pressure_level === "Low" && flow_rate === "Low") {
          leakScore += 3;
      }
      if (complaints_count >= 3) {
          leakScore += 2;
      }
      if (pump_hours_today > pump_hours_previous && flow_rate === "Low") {
          leakScore += 2;
      }
      if (tank_level_change === "Decrease") {
          leakScore += 4;
      }

      // Result Classification
      let severity: 'red' | 'yellow' | 'green';
      let message: string;
      if (leakScore >= 7) {
          severity = 'red';
          message = "🔴 High leakage risk — Investigate immediately.";
      } else if (leakScore >= 3) {
          severity = 'yellow';
          message = "🟡 Possible leakage — Monitor and verify tomorrow.";
      } else {
          severity = 'green';
          message = "🟢 No leakage suspected — System normal.";
      }
      
      return { leakScore, severity, result_message: message };
  }

  const onSubmit = async (values: z.infer<typeof dailyCheckSchema>) => {
    if (!firestore || !user || !profile?.panchayat) {
        toast({ title: 'Error', description: 'User profile not loaded or missing panchayat.', variant: 'destructive'});
        return;
    }
    
    setIsSubmitting(true);
    setResult(null);

    const { leakScore, severity, result_message } = calculateLeakScore(values);

    const checkData = {
        ...values,
        timestamp: serverTimestamp(),
        gp_id: profile.panchayat,
        leak_score: leakScore,
        severity,
        result_message
    };

    try {
        const collectionRef = collection(firestore, 'daily_leak_checks');
        await addDoc(collectionRef, checkData);
        toast({ title: 'Success', description: 'Daily system check submitted successfully.'});
        setResult({ severity, message: result_message });
        form.reset({ ...form.getValues(), pump_hours_previous: values.pump_hours_today });

    } catch(err) {
        const permissionError = new FirestorePermissionError({
            path: 'daily_leak_checks',
            operation: 'create',
            requestResourceData: checkData
        });
        errorEmitter.emit('permission-error', permissionError);
    } finally {
        setIsSubmitting(false);
    }
  };

  const loading = userLoading || profileLoading || lastCheckLoading;

  return (
    <div className="space-y-6">
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle>Daily System Check</CardTitle>
          <CardDescription>
            Record daily water system status to detect potential leakages.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="pump_hours_today"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Total Pump Run Hours (Hrs)</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="pump_hours_previous"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Yesterday Pump Hours</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                </div>
                 <FormField
                  control={form.control}
                  name="tank_level_change"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tank Level Change</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Increase">Increase</SelectItem>
                          <SelectItem value="No change">No change</SelectItem>
                          <SelectItem value="Decrease">Decrease</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="pressure_level"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Pressure Level</FormLabel>
                          <FormControl>
                            <RadioGroup
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              className="flex space-x-4 pt-2"
                            >
                              <FormItem className="flex items-center space-x-2">
                                <FormControl><RadioGroupItem value="High" /></FormControl>
                                <FormLabel className="font-normal">High</FormLabel>
                              </FormItem>
                              <FormItem className="flex items-center space-x-2">
                                 <FormControl><RadioGroupItem value="Normal" /></FormControl>
                                <FormLabel className="font-normal">Normal</FormLabel>
                              </FormItem>
                              <FormItem className="flex items-center space-x-2">
                                <FormControl><RadioGroupItem value="Low" /></FormControl>
                                <FormLabel className="font-normal">Low</FormLabel>
                              </FormItem>
                            </RadioGroup>
                           </FormControl>
                           <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="flow_rate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Flow Rate</FormLabel>
                          <FormControl>
                            <RadioGroup
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              className="flex space-x-4 pt-2"
                            >
                              <FormItem className="flex items-center space-x-2">
                                <FormControl><RadioGroupItem value="Normal" /></FormControl>
                                <FormLabel className="font-normal">Normal</FormLabel>
                              </FormItem>
                              <FormItem className="flex items-center space-x-2">
                                <FormControl><RadioGroupItem value="Low" /></FormControl>
                                <FormLabel className="font-normal">Low</FormLabel>
                              </FormItem>
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                </div>
                 <FormField
                  control={form.control}
                  name="complaints_count"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>User Complaints Count</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Submit Daily Check
                </Button>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>
      
      {result && (
         <Alert variant={result.severity === 'red' ? 'destructive' : 'default'} className={
             result.severity === 'yellow' ? 'bg-yellow-100 dark:bg-yellow-900/30 border-yellow-400 dark:border-yellow-700 [&>svg]:text-yellow-600 dark:[&>svg]:text-yellow-400 text-yellow-800 dark:text-yellow-300' : ''
         }>
          <AlertTitle className="font-bold">System Status</AlertTitle>
          <AlertDescription>
            {result.message}
          </AlertDescription>
        </Alert>
      )}

    </div>
  );
}
