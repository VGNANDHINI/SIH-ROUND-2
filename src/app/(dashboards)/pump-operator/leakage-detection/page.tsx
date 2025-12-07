
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useFirestore, useUser, useDoc, useCollection } from '@/firebase';
import type { UserProfile, DailyLeakCheck } from '@/lib/data';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
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
import { Button } from '@/components/ui/button';
import { Loader2, AlertTriangle, CheckCircle, ShieldQuestion } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';


const checkSchema = z.object({
  pump_hours_today: z.coerce.number().min(0, 'Pump hours must be a positive number.'),
  pump_hours_previous: z.coerce.number().min(0),
  tank_level_change: z.enum(['Increase', 'No change', 'Decrease']),
  pressure_level: z.enum(['High', 'Normal', 'Low']),
  flow_rate: z.enum(['Normal', 'Low']),
  complaints_count: z.coerce.number().int().min(0),
});

type FormValues = z.infer<typeof checkSchema>;

export default function LeakageDetectionPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{ score: number, severity: string, message: string } | null>(null);
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user, loading: userLoading } = useUser();
  const { data: profile, loading: profileLoading } = useDoc<UserProfile>(user ? `users/${user.uid}` : null);
  const { data: previousChecks, loading: checksLoading } = useCollection<DailyLeakCheck>(
    profile?.panchayat ? `daily_leak_checks?orderBy=timestamp,desc&limit=1&where=gp_id,==,${profile.panchayat}` : null
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(checkSchema),
    defaultValues: {
      pump_hours_today: 8,
      pump_hours_previous: 7.5,
      tank_level_change: 'No change',
      pressure_level: 'Normal',
      flow_rate: 'Normal',
      complaints_count: 1,
    },
  });

  useEffect(() => {
    if (previousChecks && previousChecks.length > 0) {
      form.setValue('pump_hours_previous', previousChecks[0].pump_hours_today);
    }
  }, [previousChecks, form]);


  const calculateLeakScore = (values: FormValues) => {
    let leakScore = 0;
    let { pump_hours_previous } = values;

    // Missing Data Handling
    if (!pump_hours_previous || pump_hours_previous === 0) {
        pump_hours_previous = values.pump_hours_today;
    }
    
    // Rule-Based Scoring
    if (values.pump_hours_today > (pump_hours_previous * 1.3) && values.tank_level_change === "No change") {
        leakScore += 3;
    }
    if (values.pressure_level === "Low" && values.flow_rate === "Low") {
        leakScore += 3;
    }
    if (values.complaints_count >= 3) {
        leakScore += 2;
    }
    if (values.pump_hours_today > pump_hours_previous && values.flow_rate === "Low") {
        leakScore += 2;
    }
    if (values.tank_level_change === "Decrease") {
        leakScore += 4;
    }

    // Result Classification
    let severity = "green";
    let message = "🟢 No leakage suspected — System normal.";
    
    if (leakScore >= 7) {
        severity = "red";
        message = "🔴 High leakage risk — Investigate immediately.";
    } else if (leakScore >= 3) {
        severity = "yellow";
        message = "🟡 Possible leakage — Monitor and verify tomorrow.";
    }

    return { score: leakScore, severity, message };
  }

  async function onSubmit(values: FormValues) {
    if (!firestore || !profile) return;
    setIsLoading(true);
    setResult(null);

    const { score, severity, message } = calculateLeakScore(values);

    const checkData = {
        ...values,
        timestamp: serverTimestamp(),
        gp_id: profile.panchayat,
        leak_score: score,
        severity,
        result_message: message,
    }

    try {
        const collectionRef = collection(firestore, 'daily_leak_checks');
        await addDoc(collectionRef, checkData);
        setResult({ score, severity, message });
        toast({
            title: 'Daily Check Submitted',
            description: `Leak score calculated: ${score}. Status: ${severity.toUpperCase()}`,
        });
    } catch (error: any) {
        console.error('Failed to submit daily check:', error);
        const permissionError = new FirestorePermissionError({ path: 'daily_leak_checks', operation: 'create', requestResourceData: checkData });
        errorEmitter.emit('permission-error', permissionError);
    } finally {
        setIsLoading(false);
    }
  }

  const getResultCardClass = (severity: string) => {
    switch (severity) {
        case 'red': return 'border-red-500 bg-red-50 dark:bg-red-900/20';
        case 'yellow': return 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20';
        case 'green': return 'border-green-500 bg-green-50 dark:bg-green-900/20';
        default: return '';
    }
  }
  const getResultIcon = (severity: string) => {
    switch(severity) {
        case 'red': return <AlertTriangle className="h-10 w-10 text-red-500" />;
        case 'yellow': return <ShieldQuestion className="h-10 w-10 text-yellow-500" />;
        case 'green': return <CheckCircle className="h-10 w-10 text-green-500" />;
        default: return null;
    }
  }


  return (
    <div className="grid lg:grid-cols-2 gap-8 items-start">
      <Card>
        <CardHeader>
          <CardTitle>Daily System Check</CardTitle>
          <CardDescription>
            Enter today's water system status to calculate the leak risk.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="pump_hours_today" render={({ field }) => (
                    <FormItem> <FormLabel>Total Pump Run Hours (Hrs)</FormLabel> <FormControl> <Input type="number" step="0.1" {...field} /> </FormControl> <FormMessage /> </FormItem>
                    )}/>
                    <FormField control={form.control} name="pump_hours_previous" render={({ field }) => (
                    <FormItem> <FormLabel>Yesterday Pump Hours</FormLabel> <FormControl> <Input type="number" step="0.1" {...field} /> </FormControl> <FormMessage /> </FormItem>
                    )}/>
                </div>

                <FormField
                    control={form.control}
                    name="tank_level_change"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Tank Level Change</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                            <SelectTrigger><SelectValue placeholder="Select change..." /></SelectTrigger>
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

                <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="pressure_level" render={({ field }) => (
                        <FormItem className="space-y-3">
                            <FormLabel>Pressure Level</FormLabel>
                            <FormControl>
                                <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex space-x-2">
                                    <FormItem className="flex items-center space-x-2 space-y-0">
                                        <FormControl><RadioGroupItem value="High" /></FormControl>
                                        <FormLabel className="font-normal">High</FormLabel>
                                    </FormItem>
                                    <FormItem className="flex items-center space-x-2 space-y-0">
                                        <FormControl><RadioGroupItem value="Normal" /></FormControl>
                                        <FormLabel className="font-normal">Normal</FormLabel>
                                    </FormItem>
                                    <FormItem className="flex items-center space-x-2 space-y-0">
                                        <FormControl><RadioGroupItem value="Low" /></FormControl>
                                        <FormLabel className="font-normal">Low</FormLabel>
                                    </FormItem>
                                </RadioGroup>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}/>
                    <FormField control={form.control} name="flow_rate" render={({ field }) => (
                        <FormItem className="space-y-3">
                            <FormLabel>Flow Rate</FormLabel>
                            <FormControl>
                                <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex space-x-2">
                                    <FormItem className="flex items-center space-x-2 space-y-0">
                                        <FormControl><RadioGroupItem value="Normal" /></FormControl>
                                        <FormLabel className="font-normal">Normal</FormLabel>
                                    </FormItem>
                                    <FormItem className="flex items-center space-x-2 space-y-0">
                                        <FormControl><RadioGroupItem value="Low" /></FormControl>
                                        <FormLabel className="font-normal">Low</FormLabel>
                                    </FormItem>
                                </RadioGroup>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}/>
                </div>

                <FormField control={form.control} name="complaints_count" render={({ field }) => (
                    <FormItem> <FormLabel>User Complaints Count (24h)</FormLabel> <FormControl> <Input type="number" {...field} /> </FormControl> <FormMessage /> </FormItem>
                )}/>
              
              <Button type="submit" disabled={isLoading || userLoading || profileLoading} className="w-full">
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Submit Daily Check
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card className={cn("sticky top-24", result ? getResultCardClass(result.severity) : '')}>
        <CardHeader>
          <CardTitle>Leakage Detection Result</CardTitle>
          <CardDescription>
            The analysis results will appear here after submission.
          </CardDescription>
        </CardHeader>
        <CardContent className="min-h-[200px] flex flex-col items-center justify-center text-center">
          {isLoading ? (
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
          ) : result ? (
            <div className="space-y-4">
                {getResultIcon(result.severity)}
                <p className="text-2xl font-bold">Leak Score: {result.score}</p>
                <p className="text-lg font-medium">{result.message}</p>
            </div>
          ) : (
             <div className="text-muted-foreground">
                <p>No analysis performed yet.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
