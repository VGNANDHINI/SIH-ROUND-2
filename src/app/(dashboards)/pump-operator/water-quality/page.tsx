
'use client';
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useUser, useFirestore, useDoc, useWaterQualityTests } from "@/firebase";
import { UserProfile, WaterTest } from "@/lib/data";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Send, ListCollapse } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const testSchema = z.object({
  ward: z.string().min(1, "Ward is required."),
  locationType: z.enum(["source", "tank", "pipeline", "household"]),
  pH: z.coerce.number().min(0).max(14),
  turbidity: z.coerce.number().min(0),
  chlorine: z.coerce.number().min(0),
  tds: z.coerce.number().min(0),
  iron: z.coerce.number().min(0),
  fluoride: z.coerce.number().min(0),
  nitrate: z.coerce.number().min(0),
  coliform: z.enum(["true", "false"]).transform(val => val === "true"),
  remarks: z.string().optional(),
});

export default function OperatorWaterQualityPage() {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();
    const { user, loading: userLoading } = useUser();
    const { data: profile, loading: profileLoading } = useDoc<UserProfile>(user ? `users/${user.uid}` : null);
    const firestore = useFirestore();
    const { data: tests, loading: testsLoading } = useWaterQualityTests(profile?.panchayat || 'default');
    
    const loading = userLoading || profileLoading;

    const form = useForm<z.infer<typeof testSchema>>({
        resolver: zodResolver(testSchema),
        defaultValues: {
            ward: "",
            locationType: "household",
            pH: 7.2,
            turbidity: 0.5,
            chlorine: 0.5,
            tds: 250,
            iron: 0.1,
            fluoride: 0.5,
            nitrate: 10,
            coliform: false,
        }
    });

    const onSubmit = async (values: z.infer<typeof testSchema>) => {
        if (!firestore || !user || !profile) {
            toast({ title: "Error", description: "Not authenticated or profile missing.", variant: "destructive"});
            return;
        }

        setIsSubmitting(true);
        try {
            const testData = {
                ...values,
                panchayatId: profile.panchayat,
                operatorId: user.uid,
                testDate: serverTimestamp(),
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                // These will be filled by the cloud function
                status: 'attention-needed', 
                flaggedParameters: [],
                reviewedByGp: false,
                reviewedByBe: false,
            };

            const collectionRef = collection(firestore, `panchayats/${profile.panchayat}/waterTests`);
            await addDoc(collectionRef, testData);

            toast({ title: "Success", description: "Water quality test submitted."});
            form.reset();
        } catch (error) {
            console.error(error);
            toast({ title: "Submission Failed", description: "Could not submit the test. Please try again.", variant: "destructive"});
        } finally {
            setIsSubmitting(false);
        }
    }
    
    const getStatusVariant = (status: WaterTest['status']) => {
        switch (status) {
            case 'safe': return 'success';
            case 'unsafe': return 'destructive';
            case 'attention-needed': return 'secondary';
            default: return 'outline';
        }
    }

    return (
        <div className="grid lg:grid-cols-2 gap-8 items-start">
            <Card>
                <CardHeader>
                    <CardTitle>Log New Water Quality Test</CardTitle>
                    <CardDescription>Enter results from a JJM Field Test Kit (FTK).</CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : (
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                               <div className="grid grid-cols-2 gap-4">
                                     <FormField control={form.control} name="ward" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Ward</FormLabel>
                                            <FormControl><Input placeholder="e.g., Ward 5" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                     <FormField control={form.control} name="locationType" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Location Type</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                                <SelectContent>
                                                    <SelectItem value="source">Source</SelectItem>
                                                    <SelectItem value="tank">Tank</SelectItem>
                                                    <SelectItem value="pipeline">Pipeline</SelectItem>
                                                    <SelectItem value="household">Household</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                               </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField control={form.control} name="pH" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>pH</FormLabel>
                                            <FormControl><Input type="number" step="0.1" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                    <FormField control={form.control} name="turbidity" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Turbidity (NTU)</FormLabel>
                                            <FormControl><Input type="number" step="0.1" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                     <FormField control={form.control} name="chlorine" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Chlorine (mg/L)</FormLabel>
                                            <FormControl><Input type="number" step="0.1" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                     <FormField control={form.control} name="tds" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>TDS (mg/L)</FormLabel>
                                            <FormControl><Input type="number" step="1" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                </div>
                                <FormField control={form.control} name="coliform" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Coliform Bacteria</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={String(field.value)}>
                                            <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                            <SelectContent>
                                                <SelectItem value="false">Absent</SelectItem>
                                                <SelectItem value="true">Present</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <Button type="submit" disabled={isSubmitting} className="w-full">
                                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                                    Submit Test
                                </Button>
                            </form>
                        </Form>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>My Recent Tests</CardTitle>
                    <CardDescription>Your last 10 submitted water quality tests.</CardDescription>
                </CardHeader>
                <CardContent>
                {testsLoading ? (
                    <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Ward</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                           {tests && tests.filter(t => t.operatorId === user?.uid).slice(0, 10).map(test => (
                               <TableRow key={test.id}>
                                   <TableCell>{test.testDate ? new Date((test.testDate as any).seconds * 1000).toLocaleDateString() : 'N/A'}</TableCell>
                                   <TableCell>{test.ward}</TableCell>
                                   <TableCell><Badge variant={getStatusVariant(test.status)}>{test.status}</Badge></TableCell>
                               </TableRow>
                           ))}
                           {tests?.filter(t => t.operatorId === user?.uid).length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={3} className="text-center h-24">You haven't submitted any tests yet.</TableCell>
                                </TableRow>
                           )}
                        </TableBody>
                    </Table>
                )}
                </CardContent>
            </Card>
        </div>
    )
}

    