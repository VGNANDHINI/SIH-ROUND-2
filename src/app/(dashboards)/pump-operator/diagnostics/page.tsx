
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
  FormDescription,
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
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  diagnoseWaterNetwork,
  DiagnoseWaterNetworkInput,
  DiagnoseWaterNetworkOutput,
} from '@/ai/flows/diagnose-water-network';
import { Separator } from '@/components/ui/separator';

const complaintTypes = [
  { id: 'low pressure', label: 'Low Pressure' },
  { id: 'dirty water', label: 'Dirty Water' },
  { id: 'no water', label: 'No Water' },
  { id: 'bad smell', label: 'Bad Smell' },
] as const;

const formSchema = z.object({
  pressure_value: z.coerce.number().min(0, 'Pressure must be a positive number.'),
  flow_rate: z.coerce.number().min(0, 'Flow rate must be a positive number.'),
  chlorine_level: z.coerce.number().min(0, 'Chlorine must be a positive number.'),
  turbidity_level: z.coerce.number().min(0, 'Turbidity must be a positive number.'),
  reservoir_drop_rate: z.coerce.number().min(0, 'Rate must be a positive number.'),
  pump_status: z.enum(['running', 'stopped']),
  complaints_count: z.coerce.number().int().min(0, 'Complaints must be a positive integer.'),
  complaint_types: z.array(z.string()).refine((value) => value.some((item) => item), {
      message: 'You have to select at least one complaint type.',
    }),
  sewage_line_nearby: z.boolean().default(false),
  past_leak_history: z.enum(['yes', 'no']),
});

type FormValues = z.infer<typeof formSchema>;

export default function DiagnosticsPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<DiagnoseWaterNetworkOutput | null>(null);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      pressure_value: 15,
      flow_rate: 100,
      chlorine_level: 0.5,
      turbidity_level: 1,
      reservoir_drop_rate: 5,
      pump_status: 'running',
      complaints_count: 0,
      complaint_types: [],
      sewage_line_nearby: false,
      past_leak_history: 'no',
    },
  });

  async function onSubmit(values: FormValues) {
    setIsLoading(true);
    setResult(null);

    const inputForApi: DiagnoseWaterNetworkInput = values;

    try {
      const diagnosis = await diagnoseWaterNetwork(inputForApi);
      setResult(diagnosis);
    } catch (error: any) {
      console.error('Diagnostic analysis failed:', error);
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
          case 'NORMAL': return 'text-green-600';
          case 'LEAKAGE': return 'text-red-600';
          case 'LOW': return 'text-yellow-600';
          case 'HIGH': return 'text-red-600';
          case 'PRESENT': return 'text-red-600';
          case 'SUSPECTED': return 'text-yellow-600';
          case 'NOT_PRESENT': return 'text-green-600';
          default: return 'text-foreground';
      }
  }

  return (
    <div className="grid lg:grid-cols-2 gap-8 items-start">
      <Card>
        <CardHeader>
          <CardTitle>Water Network Diagnostics</CardTitle>
          <CardDescription>
            Enter field data to get an AI-powered analysis of your water network's health.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="pressure_value" render={({ field }) => (
                    <FormItem> <FormLabel>Pressure (PSI)</FormLabel> <FormControl> <Input type="number" step="0.1" {...field} /> </FormControl> <FormMessage /> </FormItem>
                )}/>
                <FormField control={form.control} name="flow_rate" render={({ field }) => (
                    <FormItem> <FormLabel>Flow Rate (LPM)</FormLabel> <FormControl> <Input type="number" {...field} /> </FormControl> <FormMessage /> </FormItem>
                )}/>
                <FormField control={form.control} name="chlorine_level" render={({ field }) => (
                    <FormItem> <FormLabel>Chlorine (ppm)</FormLabel> <FormControl> <Input type="number" step="0.1" {...field} /> </FormControl> <FormMessage /> </FormItem>
                )}/>
                <FormField control={form.control} name="turbidity_level" render={({ field }) => (
                    <FormItem> <FormLabel>Turbidity (NTU)</FormLabel> <FormControl> <Input type="number" step="0.1" {...field} /> </FormControl> <FormMessage /> </FormItem>
                )}/>
                 <FormField control={form.control} name="reservoir_drop_rate" render={({ field }) => (
                    <FormItem> <FormLabel>Reservoir Drop (L/hr)</FormLabel> <FormControl> <Input type="number" {...field} /> </FormControl> <FormMessage /> </FormItem>
                )}/>
                 <FormField control={form.control} name="complaints_count" render={({ field }) => (
                    <FormItem> <FormLabel>Complaints Count</FormLabel> <FormControl> <Input type="number" {...field} /> </FormControl> <FormMessage /> </FormItem>
                )}/>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <FormField control={form.control} name="pump_status" render={({ field }) => (
                    <FormItem> <FormLabel>Pump Status</FormLabel> <Select onValueChange={field.onChange} defaultValue={field.value}> <FormControl> <SelectTrigger> <SelectValue /> </SelectTrigger> </FormControl> <SelectContent> <SelectItem value="running">Running</SelectItem> <SelectItem value="stopped">Stopped</SelectItem> </SelectContent> </Select> <FormMessage /> </FormItem>
                )}/>
                 <FormField control={form.control} name="past_leak_history" render={({ field }) => (
                    <FormItem> <FormLabel>Past Leak History?</FormLabel> <Select onValueChange={field.onChange} defaultValue={field.value}> <FormControl> <SelectTrigger> <SelectValue /> </SelectTrigger> </FormControl> <SelectContent> <SelectItem value="no">No</SelectItem> <SelectItem value="yes">Yes</SelectItem> </SelectContent> </Select> <FormMessage /> </FormItem>
                )}/>
              </div>
              
              <FormField control={form.control} name="complaint_types" render={() => (
                <FormItem>
                    <div className="mb-4"> <FormLabel>Complaint Types</FormLabel> <FormDescription>Select all that apply.</FormDescription> </div>
                    {complaintTypes.map((item) => (
                    <FormField key={item.id} control={form.control} name="complaint_types" render={({ field }) => {
                        return ( <FormItem key={item.id} className="flex flex-row items-start space-x-3 space-y-0">
                                <FormControl> <Checkbox checked={field.value?.includes(item.id)} onCheckedChange={(checked) => { return checked ? field.onChange([...field.value, item.id]) : field.onChange( field.value?.filter( (value) => value !== item.id ) ); }} /> </FormControl>
                                <FormLabel className="font-normal">{item.label}</FormLabel>
                            </FormItem> );
                        }} />
                    ))}
                    <FormMessage />
                </FormItem>
              )}/>

              <FormField control={form.control} name="sewage_line_nearby" render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl> <Checkbox checked={field.value} onCheckedChange={field.onChange} /> </FormControl>
                    <div className="space-y-1 leading-none"> <FormLabel>Is there a sewage line nearby?</FormLabel> </div>
                </FormItem>
              )}/>
              
              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Analyze Network Health
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card className="sticky top-24">
        <CardHeader>
          <CardTitle>AI Diagnostic Report</CardTitle>
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
                <div className="grid grid-cols-3 gap-4 text-center">
                    <div> <p className="text-muted-foreground">Pressure</p> <p className={`font-bold text-lg ${getStatusColor(result.pressure_status)}`}>{result.pressure_status}</p> </div>
                    <div> <p className="text-muted-foreground">Leakage</p> <p className={`font-bold text-lg ${getStatusColor(result.leakage_status)}`}>{result.leakage_status}</p> </div>
                    <div> <p className="text-muted-foreground">Contamination</p> <p className={`font-bold text-lg ${getStatusColor(result.sewage_contamination_status)}`}>{result.sewage_contamination_status}</p> </div>
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
