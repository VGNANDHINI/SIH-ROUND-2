import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { bills, type Bill } from "@/lib/data";
import { IndianRupee } from "lucide-react";

export default function BillingPage() {

    const getBadgeVariant = (status: Bill['status']) => {
        switch (status) {
            case 'Paid': return 'success';
            case 'Due': return 'secondary';
            case 'Overdue': return 'destructive';
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>My Bills</CardTitle>
                <CardDescription>View your billing history and pay outstanding bills.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Month</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Due Date</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {bills.map((bill) => (
                            <TableRow key={bill.id}>
                                <TableCell className="font-medium">{bill.month}</TableCell>
                                <TableCell>₹{bill.amount.toFixed(2)}</TableCell>
                                <TableCell>{bill.dueDate}</TableCell>
                                <TableCell>
                                    <Badge variant={getBadgeVariant(bill.status)}>{bill.status}</Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    {bill.status !== 'Paid' ? (
                                        <Button size="sm">
                                            <IndianRupee className="mr-2 h-4 w-4" /> Pay Now
                                        </Button>
                                    ) : (
                                        <Button size="sm" variant="outline" disabled>Paid</Button>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
