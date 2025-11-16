"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { suggestPumpMaintenance, SuggestPumpMaintenanceOutput } from "@/ai/flows/suggest-pump-maintenance";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const maintenanceSchema = z.object({
  lastServiceDate: z.string().min(1, "Last service date is required. Use YYYY-MM-DD format."),
  failureRate: z.coerce.number().min(0).max(1, "Failure rate must be between 0 and 1."),
  operatingHours: z.coerce.number().min(1, "Operating hours must be at least 1.").max(24, "Operating hours cannot exceed 24."),
  pumpType: z.string().min(1, "Pump type is required."),
  location: z.string().min(1, "Location is required."),
});

export function MaintenanceForm() {
  const [suggestion, setSuggestion] = useState<SuggestPumpMaintenanceOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof maintenanceSchema>>({
    resolver: zodResolver(maintenanceSchema),
    defaultValues: {
      lastServiceDate: new Date().toISOString().split('T')[0],
      failureRate: 0.05,
      operatingHours: 8,
      pumpType: "Submersible",
      location: "Village Well",
    },
  });

  async function onSubmit(values: z.infer<typeof maintenanceSchema>) {
    setIsLoading(true);
    setSuggestion(null);
    try {
      const result = await suggestPumpMaintenance(values);
      setSuggestion(result);
    } catch (error) {
      console.error("Failed to get maintenance suggestion:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to generate maintenance suggestion. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="grid lg:grid-cols-2 gap-8 items-start">
      <Card>
        <CardHeader>
          <CardTitle>Suggest Maintenance Schedule</CardTitle>
          <CardDescription>Fill in the pump details to get an AI-powered maintenance suggestion.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="pumpType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pump Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                       <FormControl>
                          <SelectTrigger><SelectValue placeholder="Select pump type" /></SelectTrigger>
                       </FormControl>
                       <SelectContent>
                          <SelectItem value="Submersible">Submersible Pump</SelectItem>
                          <SelectItem value="Centrifugal">Centrifugal Pump</SelectItem>
                          <SelectItem value="Hand Pump">Hand Pump</SelectItem>
                          <SelectItem value="Solar Pump">Solar Pump</SelectItem>
                       </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Ramgarh, Near School" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lastServiceDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Service Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="operatingHours"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Daily Operating Hours</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="failureRate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Failure Rate (0.0 to 1.0)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...</> : "Get Suggestion"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
      <Card className="sticky top-24">
        <CardHeader>
          <CardTitle>Suggested Schedule</CardTitle>
          <CardDescription>The AI-recommended maintenance plan will appear here.</CardDescription>
        </CardHeader>
        <CardContent className="min-h-[300px]">
          {isLoading && <div className="flex items-center justify-center h-full"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}
          {suggestion && (
            <div className="space-y-4 text-sm">
              <div>
                <h3 className="font-semibold text-base mb-2">Suggested Maintenance Schedule</h3>
                <div className="prose prose-sm max-w-none text-muted-foreground whitespace-pre-wrap">{suggestion.suggestedMaintenanceSchedule}</div>
              </div>
               <hr className="my-4"/>
              <div>
                <h3 className="font-semibold text-base mb-2">Reasoning</h3>
                <p className="text-muted-foreground">{suggestion.reasoning}</p>
              </div>
            </div>
          )}
          {!isLoading && !suggestion && <div className="flex items-center justify-center h-full text-muted-foreground"><p>No suggestion generated yet.</p></div>}
        </CardContent>
      </Card>
    </div>
  );
}
