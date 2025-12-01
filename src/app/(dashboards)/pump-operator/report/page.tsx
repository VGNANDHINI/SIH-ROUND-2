"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Upload } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useFirestore } from "@/firebase";
import { collection, addDoc } from "firebase/firestore";

const reportSchema = z.object({
    pumpId: z.string().min(1, "Pump ID is required"),
    location: z.string().min(1, "Location is required"),
    description: z.string().min(10, "Please provide a detailed description (min 10 characters)."),
    image: z.any().optional(),
});

export default function ReportIssuePage() {
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();
    const firestore = useFirestore();

    const form = useForm<z.infer<typeof reportSchema>>({
        resolver: zodResolver(reportSchema),
        defaultValues: {
            pumpId: "",
            location: "",
            description: "",
        },
    });

    async function onSubmit(values: z.infer<typeof reportSchema>) {
        if (!firestore) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Firestore is not initialized.",
            });
            return;
        }
        setIsLoading(true);
        
        try {
            await addDoc(collection(firestore, "pumpIssues"), {
                ...values,
                reportedAt: new Date().toISOString().split('T')[0],
                status: 'Open'
            });

            toast({
                title: "Issue Reported",
                description: `Successfully reported issue for pump ${values.pumpId}.`,
            });
            form.reset();
        } catch (error) {
            console.error("Error reporting issue: ", error);
            toast({
                variant: "destructive",
                title: "Uh oh! Something went wrong.",
                description: "Could not report the issue. Please try again.",
            });
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <Card className="max-w-2xl mx-auto">
            <CardHeader>
                <CardTitle>Report a Pump Issue</CardTitle>
                <CardDescription>Fill out the form below to report an issue with a water pump.</CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <FormField
                            control={form.control}
                            name="pumpId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Pump ID</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g., PMP-RG-01" {...field} />
                                    </FormControl>
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
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Issue Description</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Describe the issue in detail..." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="image"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Upload Image (Optional)</FormLabel>
                                    <FormControl>
                                         <div className="flex items-center justify-center w-full">
                                            <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-card hover:bg-muted">
                                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                    <Upload className="w-8 h-8 mb-3 text-muted-foreground" />
                                                    <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                                                    <p className="text-xs text-muted-foreground">PNG, JPG or GIF (MAX. 800x400px)</p>
                                                </div>
                                                <Input id="dropzone-file" type="file" className="hidden" {...field} />
                                            </label>
                                        </div> 
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <Button type="submit" disabled={isLoading} className="w-full">
                             {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...</> : "Submit Report"}
                        </Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}
