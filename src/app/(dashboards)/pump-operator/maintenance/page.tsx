
'use client';

import { useState } from 'react';
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
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Loader2, AlertTriangle, ShieldCheck, CheckCircle } from 'lucide-react';
import { useFirestore, useUser, useDoc } from '@/firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import type { UserProfile } from '@/lib/data';

const maintenanceCheckSchema = z.object({
  pump_age_years: z.coerce.number().min(0, 'Pump age cannot be negative.'),
  avg_running_hours: z.coerce
    .number()
    .min(0, 'Average running hours cannot be negative.'),
  breakdown_count_90_days: z.coerce
    .number()
    .min(0, 'Breakdown count cannot be negative.'),
  repeat_issue: z.boolean(),
  electricity_trend: z.enum(['Increase', 'Same', 'Decrease']).optional(),
  flow_trend: z.enum(['Stable', 'Gradual Drop', 'Sudden Drop']),
  last_maintenance: z.date().optional(),
});

type MaintenanceCheckForm = z.infer<typeof maintenanceCheckSchema>;

type CheckResult = {
  riskScore: number;
  severity: 'green' | 'yellow' | 'red';
  recommendedAction: string;
};

export default function MaintenancePage() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<CheckResult | null>(null);
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();
  const { data: profile } = useDoc<UserProfile>(user ? `users/${user.uid}` : null);


  const form = useForm<MaintenanceCheckForm>({
    resolver: zodResolver(maintenanceCheckSchema),
    defaultValues: {
      pump_age_years: 2,
      avg_running_hours: 6,
      breakdown_count_90_days: 1,
      repeat_issue: false,
      flow_trend: 'Stable',
    },
  });

  const calculateRisk = (data: MaintenanceCheckForm): CheckResult => {
    let riskScore = 0;

    // Scoring Rules
    if (data.pump_age_years > 5) riskScore += 4;
    else if (data.pump_age_years > 3) riskScore += 2;

    if (data.avg_running_hours > 6) riskScore += 3;
    if (data.breakdown_count_90_days >= 2) riskScore += 3;
    if (data.repeat_issue) riskScore += 3;

    if (data.flow_trend === 'Gradual Drop') riskScore += 2;
    else if (data.flow_trend === 'Sudden Drop') riskScore += 3;
    
    if (data.electricity_trend === 'Increase' && data.flow_trend !== 'Stable') riskScore += 3;

    // Severity Classification
    let severity: 'green' | 'yellow' | 'red';
    if (riskScore >= 9) severity = 'red';
    else if (riskScore >= 5) severity = 'yellow';
    else severity = 'green';
    
    // Recommended Action Logic
    let recommendedAction: string;
    if (riskScore >= 9 && data.breakdown_count_90_days >= 3) {
      recommendedAction = "🔴 Recommend pump replacement or full servicing";
    } else if (riskScore >= 6) {
      recommendedAction = "🟡 Schedule lubrication, cleaning, or valve inspection";
    } else if (data.flow_trend === 'Sudden Drop') {
      recommendedAction = "⚠️ Clean filters or flush pipeline";
    } else {
      recommendedAction = "🟢 System healthy — no maintenance needed";
    }

    return { riskScore, severity, recommendedAction };
  };

  async function onSubmit(values: MaintenanceCheckForm) {
    if (!firestore || !user?.uid || !profile) {
        toast({ title: 'Error', description: 'User profile not loaded.', variant: 'destructive'});
        return;
    }

    setIsLoading(true);
    setResult(null);

    const checkResult = calculateRisk(values);
    
    const logData = {
        ...values,
        ...checkResult,
        gp_id: profile.panchayat,
        timestamp: serverTimestamp(),
    };

    try {
        const collectionRef = collection(firestore, 'predictive_maintenance_logs');
        await addDoc(collectionRef, logData);
        setResult(checkResult);
        toast({ title: 'Success', description: 'Maintenance check submitted successfully.' });

    } catch (err) {
        const permissionError = new FirestorePermissionError({
            path: 'predictive_maintenance_logs',
            operation: 'create',
            requestResourceData: logData
        });
        errorEmitter.emit('permission-error', permissionError);
    } finally {
        setIsLoading(false);
    }
  }

  const getResultIcon = (severity?: string) => {
    switch(severity) {
        case 'red': return <AlertTriangle className="h-10 w-10 text-red-500" />;
        case 'yellow': return <ShieldCheck className="h-10 w-10 text-yellow-500" />;
        default: return <CheckCircle className="h-10 w-10 text-green-500" />;
    }
  }

  return (
    <div className="grid lg:grid-cols-2 gap-8 items-start">
      <Card>
        <CardHeader>
          <CardTitle>Pump Maintenance Log</CardTitle>
          <CardDescription>
            Submit a daily maintenance check to estimate pump health and get
            recommendations.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                        control={form.control}
                        name="pump_age_years"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Pump Age (Years)</FormLabel>
                            <FormControl>
                                <Input type="number" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="avg_running_hours"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Pump Run Hours (Avg per day)</FormLabel>
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
                    name="breakdown_count_90_days"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Breakdown Count (last 90 days)</FormLabel>
                        <FormControl>
                            <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                <FormField
                    control={form.control}
                    name="repeat_issue"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                        <div className="space-y-0.5">
                            <FormLabel>Repeat Issue Reported</FormLabel>
                             <FormMessage />
                        </div>
                        <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                        </FormItem>
                    )}
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <FormField
                        control={form.control}
                        name="electricity_trend"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Electricity Consumption</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                    <SelectContent>
                                        <SelectItem value="Increase">Increase</SelectItem>
                                        <SelectItem value="Same">Same</SelectItem>
                                        <SelectItem value="Decrease">Decrease</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="flow_trend"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Flow Rate Trend</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                    <SelectContent>
                                        <SelectItem value="Stable">Stable</SelectItem>
                                        <SelectItem value="Gradual Drop">Gradual Drop</SelectItem>
                                        <SelectItem value="Sudden Drop">Sudden Drop</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
                 <FormField
                    control={form.control}
                    name="last_maintenance"
                    render={({ field }) => (
                        <FormItem className="flex flex-col">
                        <FormLabel>Last Maintenance Date</FormLabel>
                        <Popover>
                            <PopoverTrigger asChild>
                            <FormControl>
                                <Button
                                variant={"outline"}
                                className={cn(
                                    "w-full pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                )}
                                >
                                {field.value ? (
                                    format(field.value, "PPP")
                                ) : (
                                    <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                            </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date) =>
                                date > new Date() || date < new Date("1900-01-01")
                                }
                                initialFocus
                            />
                            </PopoverContent>
                        </Popover>
                        <FormMessage />
                        </FormItem>
                    )}
                />

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Submit Maintenance Check
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
      
      <Card className="sticky top-24">
        <CardHeader>
            <CardTitle>Maintenance Recommendation</CardTitle>
            <CardDescription>The system's recommendation based on your inputs will appear here.</CardDescription>
        </CardHeader>
        <CardContent className="min-h-[300px] flex items-center justify-center">
            {isLoading ? <Loader2 className="h-8 w-8 animate-spin text-primary"/> : (
                result ? (
                    <div className="text-center space-y-4">
                        {getResultIcon(result.severity)}
                        <div>
                            <p className="text-sm text-muted-foreground">Risk Score</p>
                            <p className="text-4xl font-bold">{result.riskScore}</p>
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
