
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { detectLeakage } from '@/ai/flows/leakage-detection-flow';
import { LeakageDetectionInputSchema, type LeakageDetectionOutput } from '@/ai/flows/leakage-detection-flow.types';
import { Separator } from '@/components/ui/separator';
import { z } from 'zod';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type FormValues = z.infer<typeof LeakageDetectionInputSchema>;

export default function LeakageDiagnosticsPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<LeakageDetectionOutput | null>(null);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(LeakageDetectionInputSchema),
    defaultValues: {
      pressure_value: 8,
      pressure_baseline: 12,
      flow_rate: 150,
      flow_baseline: 100,
      reservoir_drop_rate: 20,
      expected_drop_rate: 10,
      complaints_count: 4,
      past_leak_history: true,
      tail_end_pressure: 0.4,
      is_critical_zone: false,
    },
  });

  async function onSubmit(values: FormValues) {
    setIsLoading(true);
    setResult(null);

    try {
      const diagnosis = await detectLeakage(values);
      setResult(diagnosis);
      toast({
        title: 'Analysis Complete',
        description: `Leakage status determined as ${diagnosis.leakage_status}.`,
      });
    } catch (error: any) {
      console.error('Leakage analysis failed:', error);
      toast({
        variant: 'destructive',
        title: 'Analysis Failed',
        description: error.message || 'An unexpected error occurred.',
      });
    } finally {
      setIsLoading(false);
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'LOW':
        return 'bg-green-500';
      case 'MEDIUM':
        return 'bg-yellow-500';
      case 'HIGH':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="grid lg:grid-cols-2 gap-8 items-start">
      <Card>
        <CardHeader>
          <CardTitle>Leakage Diagnostics</CardTitle>
          <CardDescription>
            Enter field data to get an AI-powered leakage analysis.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <h3 className="font-semibold text-lg">Pressure & Flow</h3>
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="pressure_value" render={({ field }) => (
                  <FormItem> <FormLabel>Current Pressure (PSI)</FormLabel> <FormControl> <Input type="number" step="0.1" {...field} /> </FormControl> <FormMessage /> </FormItem>
                )}/>
                <FormField control={form.control} name="pressure_baseline" render={({ field }) => (
                  <FormItem> <FormLabel>Baseline Pressure (PSI)</FormLabel> <FormControl> <Input type="number" step="0.1" {...field} /> </FormControl> <FormMessage /> </FormItem>
                )}/>
                <FormField control={form.control} name="flow_rate" render={({ field }) => (
                  <FormItem> <FormLabel>Current Flow (LPM)</FormLabel> <FormControl> <Input type="number" {...field} /> </FormControl> <FormMessage /> </FormItem>
                )}/>
                <FormField control={form.control} name="flow_baseline" render={({ field }) => (
                  <FormItem> <FormLabel>Baseline Flow (LPM)</FormLabel> <FormControl> <Input type="number" {...field} /> </FormControl> <FormMessage /> </FormItem>
                )}/>
              </div>

              <h3 className="font-semibold text-lg pt-4">Reservoir & Complaints</h3>
              <div className="grid grid-cols-2 gap-4">
                 <FormField control={form.control} name="reservoir_drop_rate" render={({ field }) => (
                    <FormItem> <FormLabel>Reservoir Drop (L/hr)</FormLabel> <FormControl> <Input type="number" {...field} /> </FormControl> <FormMessage /> </FormItem>
                )}/>
                <FormField control={form.control} name="expected_drop_rate" render={({ field }) => (
                    <FormItem> <FormLabel>Expected Drop (L/hr)</FormLabel> <FormControl> <Input type="number" {...field} /> </FormControl> <FormMessage /> </FormItem>
                )}/>
                 <FormField control={form.control} name="complaints_count" render={({ field }) => (
                    <FormItem> <FormLabel>24h Complaints</FormLabel> <FormControl> <Input type="number" {...field} /> </FormControl> <FormMessage /> </FormItem>
                )}/>
                 <FormField control={form.control} name="tail_end_pressure" render={({ field }) => (
                    <FormItem> <FormLabel>Tail-End Pressure (bar)</FormLabel> <FormControl> <Input type="number" step="0.1" {...field} /> </FormControl> <FormMessage /> </FormItem>
                )}/>
              </div>
              
              <div className="grid grid-cols-2 gap-4 pt-4">
                <FormField
                  control={form.control}
                  name="past_leak_history"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          Past leak history?
                        </FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="is_critical_zone"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          Is this a critical zone?
                        </FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
              </div>
              
              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Analyze for Leaks
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card className="sticky top-24">
        <CardHeader>
          <CardTitle>AI Leakage Report</CardTitle>
          <CardDescription>
            The analysis results will appear here after you submit the data.
          </CardDescription>
        </CardHeader>
        <CardContent className="min-h-[400px]">
          {isLoading ? (
            <div className="flex h-full items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : result ? (
            <div className="space-y-6 text-sm">
                <div className="text-center space-y-2">
                    <p className="text-muted-foreground">Leakage Status</p>
                    <div className="flex justify-center items-center gap-2">
                        <div className={cn("w-4 h-4 rounded-full", getStatusColor(result.leakage_status))}></div>
                        <p className="font-bold text-2xl">{result.leakage_status}</p>
                    </div>
                    <p className="text-muted-foreground font-mono">Score: {result.leak_score.toFixed(2)}</p>
                </div>
                <Separator />
                <div>
                    <h3 className="font-semibold text-base mb-2">Triggered Rules</h3>
                    <div className="flex flex-wrap gap-2">
                        {result.triggered_rules.map(rule => <Badge key={rule} variant="secondary">{rule}</Badge>)}
                    </div>
                </div>
                <Separator />
                <div>
                    <h3 className="font-semibold text-base mb-2">Reasoning</h3>
                    <p className="text-muted-foreground whitespace-pre-wrap">{result.reasoning}</p>
                </div>
                <Separator />
                <div>
                    <h3 className="font-semibold text-base mb-2">Recommended Actions</h3>
                    <p className="text-muted-foreground whitespace-pre-wrap">{result.recommended_actions}</p>
                </div>
            </div>
          ) : (
             <div className="flex h-full items-center justify-center text-muted-foreground">
                <p>No analysis performed yet.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
