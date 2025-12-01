import { collection, writeBatch, getDocs, doc, getFirestore } from "firebase/firestore";
import { app } from "@/firebase/config";

// NOTE: This file is used to seed the database with initial data.
// It is not used in the application otherwise.

export type WaterScheme = {
  id: string;
  name: string;
  village: string;
  status: 'Active' | 'Inactive' | 'Under Maintenance';
  coverage: number; // percentage
  lastUpdated: string;
};

export const waterSchemes: WaterScheme[] = [
  { id: 'WS001', name: 'Nal Jal Yojana', village: 'Ramgarh', status: 'Active', coverage: 95, lastUpdated: '2024-05-15' },
  { id: 'WS002', name: 'Swajal Dhara', village: 'Sitapur', status: 'Active', coverage: 88, lastUpdated: '2024-05-20' },
  { id: 'WS003', name: 'Har Ghar Jal', village: 'Laxmangarh', status: 'Under Maintenance', coverage: 100, lastUpdated: '2024-05-10' },
  { id: 'WS004', name: 'Gramin Jal Aapurti', village: 'Krishnanagar', status: 'Inactive', coverage: 40, lastUpdated: '2023-11-01' },
  { id: 'WS005', name: 'Jeevan Dhara', village: 'Gopalpur', status: 'Active', coverage: 92, lastUpdated: '2024-05-18' },
];


export type PumpIssue = {
  id: string;
  pumpId: string;
  location: string;
  description: string;
  reportedAt: string;
  status: 'Open' | 'In Progress' | 'Resolved';
};

export const pumpIssues: PumpIssue[] = [
    { id: 'I001', pumpId: 'PMP-RG-01', location: 'Ramgarh, Near School', description: 'Low water pressure.', reportedAt: '2024-05-22', status: 'Open' },
    { id: 'I002', pumpId: 'PMP-SP-03', location: 'Sitapur, Market Area', description: 'Motor not starting.', reportedAt: '2024-05-21', status: 'In Progress' },
    { id: 'I003', pumpId: 'PMP-LG-02', location: 'Laxmangarh, West Block', description: 'Leaking pipe.', reportedAt: '2024-05-19', status: 'Resolved' },
];

export type Bill = {
    id: string;
    month: string;
    amount: number;
    dueDate: string;
    status: 'Paid' | 'Due' | 'Overdue';
};

export const bills: Bill[] = [
    { id: 'B001', month: 'April 2024', amount: 150, dueDate: '2024-05-15', status: 'Paid'},
    { id: 'B002', month: 'May 2024', amount: 150, dueDate: '2024-06-15', status: 'Due'},
];

export const analyticsData = {
    waterConsumption: [
        { month: "Jan", consumption: 450 },
        { month: "Feb", consumption: 480 },
        { month: "Mar", consumption: 520 },
        { month: "Apr", consumption: 580 },
        { month: "May", consumption: 620 },
        { month: "Jun", consumption: 670 },
    ],
    issueStatus: [
        { name: 'Open', value: 5, fill: 'var(--color-open)' },
        { name: 'In Progress', value: 3, fill: 'var(--color-progress)' },
        { name: 'Resolved', value: 12, fill: 'var(--color-resolved)' },
    ],
    schemeCoverage: [
        { name: "Ramgarh", coverage: 95 },
        { name: "Sitapur", coverage: 88 },
        { name: "Laxmangarh", coverage: 100 },
        { name: "Krishnanagar", coverage: 40 },
        { name: "Gopalpur", coverage: 92 },
    ]
};

async function seedDatabase() {
    const db = getFirestore(app);
    
    async function collectionIsEmpty(collectionName: string) {
        const collectionRef = collection(db, collectionName);
        const snapshot = await getDocs(collectionRef);
        return snapshot.empty;
    }

    try {
        const batch = writeBatch(db);

        if (await collectionIsEmpty('waterSchemes')) {
            console.log('Seeding waterSchemes...');
            waterSchemes.forEach((scheme) => {
                const docRef = doc(db, "waterSchemes", scheme.id);
                batch.set(docRef, scheme);
            });
        }

        if (await collectionIsEmpty('pumpIssues')) {
            console.log('Seeding pumpIssues...');
            pumpIssues.forEach((issue) => {
                const docRef = doc(db, "pumpIssues", issue.id);
                batch.set(docRef, issue);
            });
        }

        if (await collectionIsEmpty('bills')) {
            console.log('Seeding bills...');
            bills.forEach((bill) => {
                const docRef = doc(db, "bills", bill.id);
                batch.set(docRef, bill);
            });
        }
        
        await batch.commit();
        console.log("Database seeded successfully!");

    } catch (error) {
        console.error("Error seeding database: ", error);
    }
}

// Call this function to seed the db when the app starts if needed,
// but be careful not to call it on every render.
// seedDatabase();
