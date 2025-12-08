
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useFirestore, useUser, useDoc, useComplaints } from '@/firebase';
import { collection, addDoc, serverTimestamp, query, where, getDocs, Timestamp } from 'firebase/firestore';
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
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, AlertTriangle, Shield, CheckCircle } from 'lucide-react';
import type { UserProfile, DailyLeakCheck } from '@/lib/data';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const dailyCheckSchema = z.object({
  pumpHoursToday: z.coerce.number().min(0, 'Pump hours cannot be negative.'),
  pumpHoursYesterday: z.coerce.number().min(0, 'Previous hours cannot be negative.'),
  tankLevelChange: z.enum(['Increase', 'Decrease', 'No change']),
  pressureLevel: z.enum(['High', 'Normal', 'Low']),
  flowRate: z.enum(['High', 'Normal', 'Low']),
  userComplaintCount: z.coerce.number().min(0, 'Complaints count cannot be negative.'),
});

type DailyCheckValues = z.infer<typeof dailyCheckSchema>;

interface AnalysisResult {
    status: "No Leakage Detected – System Normal" | "Possible Leak – Monitor and Recheck" | "Leakage Confirmed – Start Location Prediction";
    leakageScore: number;
    predictedLocation?: string;
    confidenceLevel?: "High" | "Medium" | "Low";
    supportingIndicators: {
        tankLevelChange: string;
        pumpHoursDifference: number;
        pressure: string;
        flowRate: string;
        complaintClusterDetected: boolean;
    };
    recommendedAction?: string;
}


export default function LeakageDetectionPage() {
  const { user, loading: userLoading } = useUser();
  const { data: profile, loading: profileLoading } = useDoc<UserProfile>(user ? `users/${user.uid}` : null);
  const { data: complaints, loading: complaintsLoading } = useComplaints();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastCheckLoading, setLastCheckLoading] = useState(true);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);

  const form = useForm<DailyCheckValues>({
    resolver: zodResolver(dailyCheckSchema),
    defaultValues: {
      pumpHoursToday: 8,
      pumpHoursYesterday: 8,
      tankLevelChange: 'No change',
      pressureLevel: 'Normal',
      flowRate: 'Normal',
      userComplaintCount: 0,
    },
  });

  useEffect(() => {
    if (!firestore) {
      setLastCheckLoading(false);
      return;
    };
    
    const fetchLastCheck = async () => {
        setLastCheckLoading(true);
        const checksCollection = collection(firestore, 'daily_leak_checks');
        const q = query(checksCollection, where('gp_id', '==', profile?.panchayat), orderBy('timestamp', 'desc'), limit(1));
        
        try {
            const snapshot = await getDocs(q);
            if (!snapshot.empty) {
                const latestDoc = snapshot.docs[0].data() as DailyLeakCheck;
                form.setValue('pumpHoursYesterday', latestDoc.pump_hours_today);
            }
        } catch (error) {
            console.error("Failed to fetch last leak check:", error);
        } finally {
            setLastCheckLoading(false);
        }
    }
    
    if (profile?.panchayat) {
        fetchLastCheck();
    } else if (!profileLoading) {
        setLastCheckLoading(false);
    }

  }, [firestore, profile, form, profileLoading]);

  const runLeakageAnalysis = (data: DailyCheckValues): AnalysisResult => {
      let leakageScore = 0;
      const { pumpHoursToday, pumpHoursYesterday, pressureLevel, flowRate, tankLevelChange, userComplaintCount } = data;
      
      if (pumpHoursToday > pumpHoursYesterday) leakageScore += 3;
      if (pressureLevel === "Low") leakageScore += 3;
      if (flowRate === "Low") leakageScore += 2;
      if (tankLevelChange === "Decrease") leakageScore += 4;
      if (userComplaintCount >= 3) leakageScore += 4;

      let status: AnalysisResult['status'];
      if (leakageScore <= 3) status = "No Leakage Detected – System Normal";
      else if (leakageScore >= 4 && leakageScore <= 6) status = "Possible Leak – Monitor and Recheck";
      else status = "Leakage Confirmed – Start Location Prediction";

      let predictedLocation: string | undefined;
      let confidenceLevel: AnalysisResult['confidenceLevel'];
      let recommendedAction: string | undefined;

      if (leakageScore >= 7) {
          // Rule 1: Major Line Leakage
          if (pumpHoursToday > pumpHoursYesterday && pressureLevel === 'Low' && flowRate === 'Low' && tankLevelChange === 'Decrease') {
              predictedLocation = "Main Pipeline near Supply Tank";
              confidenceLevel = "High";
          }
          // Rule 2: Valve or Junction Leakage
          else if (pressureLevel === 'Low' && flowRate === 'Normal' && tankLevelChange === 'No change') {
              predictedLocation = "Valve Zone or Junction Point";
              confidenceLevel = "Medium";
          }
          // Rule 3: Complaint Clustering
          else if (userComplaintCount >= 3) {
             predictedLocation = "Street or ward with highest complaint count";
             confidenceLevel = "High";
          }
           // Rule 5: Tank Leakage
          else if (tankLevelChange === 'Decrease' && (pumpHoursToday - pumpHoursYesterday < 1) && userComplaintCount === 0) {
              predictedLocation = "Tank outlet or overflow line";
              confidenceLevel = "Medium";
          }
          // Rule 4: Default Underground Leakage
          else {
             predictedLocation = "Underground main line between pump house and first distribution node";
             confidenceLevel = "Medium";
          }

          recommendedAction = `Inspect ${predictedLocation}, close nearest valve, and check pipeline.`;
      }
      
      const result: AnalysisResult = {
          status,
          leakageScore,
          supportingIndicators: {
              tankLevelChange,
              pumpHoursDifference: pumpHoursToday - pumpHoursYesterday,
              pressure: pressureLevel,
              flowRate,
              complaintClusterDetected: userComplaintCount >= 3,
          },
      };

      if (predictedLocation) {
          result.predictedLocation = predictedLocation;
          result.confidenceLevel = confidenceLevel;
          result.recommendedAction = recommendedAction;
      }
      
      return result;
  }

  const onSubmit = async (values: DailyCheckValues) => {
    if (!firestore || !user || !profile?.panchayat) {
        toast({ title: 'Error', description: 'User profile not loaded or missing panchayat.', variant: 'destructive'});
        return;
    }
    
    setIsSubmitting(true);
    const result = runLeakageAnalysis(values);
    setAnalysisResult(result);

    const checkData = {
        ...values,
        ...result,
        timestamp: serverTimestamp(),
        gp_id: profile.panchayat,
        operator_id: user.uid,
    };

    try {
        const collectionRef = collection(firestore, 'leakage_report');
        await addDoc(collectionRef, checkData);
        toast({ title: 'Success', description: 'Daily system check submitted successfully.'});
        form.reset({ ...form.getValues(), pumpHoursYesterday: values.pumpHoursToday });

    } catch(err) {
        const permissionError = new FirestorePermissionError({
            path: 'leakage_report',
            operation: 'create',
            requestResourceData: checkData
        });
        errorEmitter.emit('permission-error', permissionError);
    } finally {
        setIsSubmitting(false);
    }
  };

  const getResultIcon = () => {
      if (!analysisResult) return null;
      if (analysisResult.status.startsWith("No Leakage")) return <CheckCircle className="h-6 w-6 text-green-500"/>
      if (analysisResult.status.startsWith("Possible Leak")) return <Shield className="h-6 w-6 text-yellow-500"/>
      if (analysisResult.status.startsWith("Leakage Confirmed")) return <AlertTriangle className="h-6 w-6 text-red-500"/>
      return null;
  }
  
  const loading = userLoading || profileLoading || lastCheckLoading;

  return (
    <div className="grid lg:grid-cols-2 gap-8 items-start">
      <Card>
        <CardHeader>
          <CardTitle>Leakage Detection System</CardTitle>
          <CardDescription>
            Enter daily parameters to analyze system health and detect potential leaks.
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
                      name="pumpHoursToday"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Total Pump Run Hours (Today)</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.5" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="pumpHoursYesterday"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Yesterday's Pump Hours</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.5" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                </div>
                 <FormField
                  control={form.control}
                  name="tankLevelChange"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tank Level Change (with pump off)</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger><SelectValue /></SelectTrigger>
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
                        name="pressureLevel"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Pressure Level</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                <SelectContent>
                                    <SelectItem value="High">High</SelectItem>
                                    <SelectItem value="Normal">Normal</SelectItem>
                                    <SelectItem value="Low">Low</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                     <FormField
                        control={form.control}
                        name="flowRate"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Flow Rate</FormLabel>
                             <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                <SelectContent>
                                    <SelectItem value="High">High</SelectItem>
                                    <SelectItem value="Normal">Normal</SelectItem>
                                    <SelectItem value="Low">Low</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
                 <FormField
                  control={form.control}
                  name="userComplaintCount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New Complaints (last 24h)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Analyze System Health
                </Button>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>
      
      <Card className="sticky top-24">
        <CardHeader>
            <CardTitle>Analysis Result</CardTitle>
            <CardDescription>The system's analysis will appear here after submission.</CardDescription>
        </CardHeader>
        <CardContent className="min-h-[300px]">
            {isSubmitting ? <div className="flex items-center justify-center h-full"><Loader2 className="h-8 w-8 animate-spin text-primary"/></div> : 
            analysisResult ? (
                 <div className="space-y-4">
                    <div className="flex items-center gap-3 p-4 rounded-lg bg-muted">
                        {getResultIcon()}
                        <div>
                            <p className="font-bold text-lg">{analysisResult.status}</p>
                            <p className="text-sm text-muted-foreground">Leakage Score: {analysisResult.leakageScore}</p>
                        </div>
                    </div>

                    {analysisResult.predictedLocation && (
                        <div>
                            <h3 className="font-semibold">Predicted Location</h3>
                            <p>{analysisResult.predictedLocation} (Confidence: {analysisResult.confidenceLevel})</p>
                        </div>
                    )}
                     {analysisResult.recommendedAction && (
                        <div>
                            <h3 className="font-semibold">Recommended Action</h3>
                            <p className="text-destructive">{analysisResult.recommendedAction}</p>
                        </div>
                    )}
                 </div>
            ) : 
            <div className="flex items-center justify-center h-full text-muted-foreground"><p>Submit the form to see the result.</p></div>
            }
        </CardContent>
      </Card>
    </div>
  );
}
