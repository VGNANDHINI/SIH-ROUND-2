
'use client';
import { useState, useRef } from 'react';
import { useUser, useDoc, useComplaints, usePumpLogs, useWaterQualityTests } from '@/firebase';
import type { UserProfile } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, FileDown } from 'lucide-react';
import { KpiCards } from './_components/kpi-cards';
import { RepairIncidentsChart } from './_components/repair-incidents-chart';
import { WaterQualitySummary } from './_components/water-quality-summary';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export default function PublicTransparencyReportPage() {
    const { user, loading: userLoading } = useUser();
    const { data: profile, loading: profileLoading } = useDoc<UserProfile>(user ? `users/${user.uid}` : null);
    
    const { data: allComplaints, loading: complaintsLoading } = useComplaints();
    const { data: allPumpLogs, loading: pumpLogsLoading } = usePumpLogs();
    const { data: allWaterTests, loading: testsLoading } = useWaterQualityTests(profile?.panchayat ?? 'default');

    const [timeframe, setTimeframe] = useState('weekly');
    const [isDownloading, setIsDownloading] = useState(false);
    const reportRef = useRef<HTMLDivElement>(null);

    const loading = userLoading || profileLoading || complaintsLoading || pumpLogsLoading || testsLoading;

    const handleDownloadPdf = () => {
        if (loading || !allComplaints) {
            return;
        }
        setIsDownloading(true);

        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 15;

        // 1. Header
        doc.setFontSize(20);
        doc.setFont('helvetica', 'bold');
        doc.text('JalShakthi Public Report', pageWidth / 2, margin, { align: 'center' });

        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.text(`Panchayat: ${profile?.panchayat || 'N/A'}`, margin, margin + 10);
        doc.text(`Date: ${new Date().toLocaleDateString()}`, pageWidth - margin, margin + 10, { align: 'right' });
        doc.text(`Time Period: This Month`, margin, margin + 15);
        doc.line(margin, margin + 20, pageWidth - margin, margin + 20);

        // 2. Summary Section
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Monthly Summary', margin, margin + 30);

        const totalComplaints = allComplaints.length;
        const resolved = allComplaints.filter(c => c.status === 'Resolved').length;
        const pending = totalComplaints - resolved;
        const waterSuppliedKL = (allPumpLogs?.reduce((acc, log) => acc + (log.waterSupplied || 0), 0) || 0) / 1000;
        
        const summaryText = `Total Complaints: ${totalComplaints}\nResolved: ${resolved}\nPending: ${pending}\nTotal Water Supplied: ${waterSuppliedKL.toFixed(2)} kL`;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(summaryText, margin, margin + 36);

        // 3. Detailed Table
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Detailed Complaint Table', margin, margin + 60);

        const tableColumn = ["ID", "Issue Type", "Address", "Status", "Reported On"];
        const tableRows: (string | null)[][] = [];

        allComplaints.slice(0, 20).forEach(complaint => { // Limit rows for visibility
            const complaintData = [
                complaint.id.substring(0, 5) + '...',
                complaint.issueType,
                complaint.address,
                complaint.status,
                complaint.reportedAt ? new Date((complaint.reportedAt as any).seconds * 1000).toLocaleDateString() : 'N/A'
            ];
            tableRows.push(complaintData);
        });

        (doc as any).autoTable({
            head: [tableColumn],
            body: tableRows,
            startY: margin + 66,
            theme: 'striped',
            headStyles: { fillColor: [22, 163, 74] },
        });
        
        // 4. Footer
        const pageCount = (doc as any).internal.getNumberOfPages();
        for(let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(10);
            doc.text(`Page ${i} of ${pageCount}`, pageWidth - margin, pageHeight - 10, { align: 'right' });
            doc.text(`Printed by: ${user?.displayName || 'N/A'}`, margin, pageHeight - 10);
        }

        doc.save('JalShakthi-Public-Report.pdf');
        setIsDownloading(false);
    };


    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                <div>
                    <h1 className="text-2xl font-bold font-headline">Public Transparency Report</h1>
                    <p className="text-muted-foreground">
                        An overview of water supply operations for {profile?.panchayat ?? 'your panchayat'}.
                    </p>
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                    <Select value={timeframe} onValueChange={setTimeframe}>
                        <SelectTrigger className="w-full md:w-[180px]">
                            <SelectValue placeholder="Select timeframe" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="weekly">This Week</SelectItem>
                            <SelectItem value="monthly">This Month</SelectItem>
                            <SelectItem value="quarterly">This Quarter</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button variant="outline" onClick={handleDownloadPdf} disabled={isDownloading}>
                        {isDownloading ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <FileDown className="mr-2 h-4 w-4" />
                        )}
                        Download PDF
                    </Button>
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="h-10 w-10 animate-spin" />
                </div>
            ) : (
                <div className="space-y-8" ref={reportRef}>
                    <KpiCards
                        complaints={allComplaints}
                        pumpLogs={allPumpLogs}
                        waterTests={allWaterTests}
                        loading={loading}
                    />

                    <div className="grid lg:grid-cols-2 gap-8">
                        <RepairIncidentsChart complaints={allComplaints} />
                        <WaterQualitySummary waterTests={allWaterTests} />
                    </div>
                </div>
            )}
        </div>
    );
}
