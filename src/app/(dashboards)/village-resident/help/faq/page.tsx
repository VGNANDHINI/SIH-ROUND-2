
'use client';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import Link from "next/link";

const faqs = [
    {
        question: "How is our water quality measured?",
        answer: "Trained operators use a Field Test Kit (FTK) to regularly test for parameters like pH, turbidity, chlorine levels, and bacteria. The results are logged in the app and reviewed by officials."
    },
    {
        question: "What is the tank cleaning schedule?",
        answer: "Overhead tanks are scheduled for cleaning once every three months to ensure water purity. Specific dates will be announced in the community updates section."
    },
    {
        question: "How does the leakage repair process work?",
        answer: "Once you report a leak, the Gram Panchayat assigns an operator. The operator visits the site, repairs the leak, and uploads a photo of the completed work for verification."
    },
    {
        question: "When is the pump operated each day?",
        answer: "Pumping is typically done twice a day to fill the main tanks. You can view the exact supply timings for your area in the 'Water Supply Schedule' on your dashboard."
    },
    {
        question: "How do I raise an issue or complaint?",
        answer: "Go to the 'Register Complaint' section in the app. Select the issue type, enter your address and a short description, and submit. You can also upload a photo."
    },
    {
        question: "How can I track the status of my complaint?",
        answer: "In the 'Register Complaint' section, you can see a history of your submitted complaints and their current status (Open, In Progress, or Resolved)."
    }
];

export default function FaqPage() {
    return (
        <div>
            <div className="mb-8">
                <Link href="/village-resident/help" className="text-sm text-primary hover:underline">
                    &larr; Back to Help & Support
                </Link>
                <h1 className="text-3xl font-bold mt-2">Frequently Asked Questions</h1>
                <p className="text-muted-foreground">Find answers to common questions about your water supply.</p>
            </div>
            
            <Accordion type="single" collapsible className="w-full max-w-3xl mx-auto">
                {faqs.map((faq, index) => (
                    <AccordionItem value={`item-${index}`} key={index}>
                        <AccordionTrigger className="text-lg text-left">{faq.question}</AccordionTrigger>
                        <AccordionContent className="text-base text-muted-foreground">
                            {faq.answer}
                        </AccordionContent>
                    </AccordionItem>
                ))}
            </Accordion>
        </div>
    );
}
