'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
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
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { analyzeWaterQualityIssue, AnalyzeWaterQualityOutput } from '@/ai/flows/water-quality-issue-analysis';

const analysisSchema = z.object({
  anomalies: z.string().min(10, 'Please describe the anomalies in more detail.'),
  historicalData: z.string().min(10, 'Please provide some historical context.'),
  externalFactors: z.string().min(5, 'Please mention any external factors.'),
});

export function AiAnalysisForm() {
  const [analysisResult, setAnalysisResult] = useState<AnalyzeWaterQualityOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof analysisSchema>>({
    resolver: zodResolver(analysisSchema),
    defaultValues: {
      anomalies:
        'Water at Hamlet 1 tap has a slightly yellow tint and pH has dropped to 6.7. This was noticed today morning.',
      historicalData:
        'Normal pH: 7.2-7.6, Turbidity: <1 NTU, Chlorine: 0.5-1.0 ppm, TDS: <300 ppm. No such issues in the last 6 months.',
      externalFactors:
        'There was heavy rainfall 2 days ago. Some construction work is happening near the pipeline route to Hamlet 1.',
    },
  });

  async function onSubmit(values: z.infer<typeof analysisSchema>) {
    setIsLoading(true);
    setAnalysisResult(null);
    try {
      const result = await analyzeWaterQualityIssue(values);
      setAnalysisResult(result);
    } catch (error: any) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'AI Analysis Failed',
        description:
          error.message || 'An unexpected error occurred. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="sticky top-24">
      <CardHeader>
        <CardTitle>AI-Powered Issue Analysis</CardTitle>
        <CardDescription>
          Describe a water quality issue to get potential causes and suggested
          actions from our AI assistant.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="anomalies"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Recent Anomalies</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe the specific issue you've observed."
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="historicalData"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Historical/Normal Data</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Provide normal operating ranges."
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="externalFactors"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>External Factors</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="e.g., rainfall, construction, etc."
                      rows={2}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Get AI Analysis
            </Button>
          </form>
        </Form>
        <div className="mt-6 min-h-[100px]">
          {isLoading && (
            <div className="flex items-center justify-center pt-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}
          {analysisResult ? (
            <div className="space-y-4 text-sm">
                <div>
                    <h3 className="font-semibold text-base mb-2">Potential Causes</h3>
                    <div className="prose prose-sm max-w-none text-muted-foreground whitespace-pre-wrap">{analysisResult.potentialCauses}</div>
                </div>
                <hr className="my-4"/>
                <div>
                    <h3 className="font-semibold text-base mb-2">Suggested Actions</h3>
                    <div className="prose prose-sm max-w-none text-muted-foreground whitespace-pre-wrap">{analysisResult.suggestedActions}</div>
                </div>
            </div>
          ) : (
            !isLoading && <p className="text-center text-muted-foreground pt-10">Your analysis results will appear here.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
