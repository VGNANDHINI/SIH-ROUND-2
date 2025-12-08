

import { collection, writeBatch, getDocs, doc, getFirestore, Timestamp } from "firebase/firestore";
import { app } from "@/firebase/config";

// NOTE: This file is used to seed the database with initial data.
// It is not used in the application otherwise.

export type WaterScheme = {
  id: string;
  name: string;
  village: string;
  status: 'Active' | 'Inactive' | 'Under Maintenance';
  approvalStatus: 'Pending' | 'Approved' | 'Rejected';
  coverage: number; // percentage
  lastUpdated: string;
};

export const waterSchemes: WaterScheme[] = [
  { id: 'WS001', name: 'Nal Jal Yojana', village: 'Ramgarh', status: 'Active', approvalStatus: 'Approved', coverage: 95, lastUpdated: '2024-05-15' },
  { id: 'WS002', name: 'Swajal Dhara', village: 'Sitapur', status: 'Active', approvalStatus: 'Approved', coverage: 88, lastUpdated: '2024-05-20' },
  { id: 'WS003', name: 'Har Ghar Jal', village: 'Laxmangarh', status: 'Under Maintenance', approvalStatus: 'Pending', coverage: 100, lastUpdated: '2024-05-10' },
  { id: 'WS004', name: 'Gramin Jal Aapurti', village: 'Krishnanagar', status: 'Inactive', approvalStatus: 'Rejected', coverage: 40, lastUpdated: '2023-11-01' },
  { id: 'WS005', name: 'Jeevan Dhara', village: 'Gopalpur', status: 'Active', approvalStatus: 'Pending', coverage: 92, lastUpdated: '2024-05-18' },
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

export type PumpLog = {
  id: string;
  operatorId: string;
  startTime: any;
  endTime: any;
  duration?: number;
  waterSupplied?: number;
  energyConsumed?: number;
  confirmedWaterLevel?: number | null;
  tankName?: string;
};


export const pumpLogs: Omit<PumpLog, 'id' | 'startTime' | 'endTime'>[] = [
    { operatorId: 'op-123', duration: 3600, waterSupplied: 5000, energyConsumed: 2.5, confirmedWaterLevel: 80 },
];

export type WaterSupply = {
    id: string;
    pumpId: string;
    location: string;
    status: 'On' | 'Off';
    lastChangedBy: string | null;
    lastChangedAt: string | null;
}

export const waterSupplyData: WaterSupply[] = [
    { id: 'PMP-RG-01', pumpId: 'PMP-RG-01', location: 'Ramgarh, Near School', status: 'Off', lastChangedBy: 'system', lastChangedAt: '2024-01-01T10:00:00Z' },
    { id: 'PMP-SP-03', pumpId: 'PMP-SP-03', location: 'Sitapur, Market Area', status: 'On', lastChangedBy: 'system', lastChangedAt: '2024-01-01T10:00:00Z' },
    { id: 'PMP-LG-02', pumpId: 'PMP-LG-02', location: 'Laxmangarh, West Block', status: 'Off', lastChangedBy: 'system', lastChangedAt: '2024-01-01T10:00:00Z' },
]

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

export type Operator = {
    id: string;
    name: string;
    email: string;
    phone: string;
    state: string;
    district: string;
    block: string;
    panchayat: string;
};

export type Complaint = {
  id: string;
  issueType: "No water" | "Low pressure" | "Dirty water" | "Leakage" | "Motor off" | "Others";
  address: string;
  photoUrl?: string;
  resolutionPhotoUrl?: string;
  description: string;
  contactNumber: string;
  reportedAt: any;
  status: 'Open' | 'In Progress' | 'Pending Verification' | 'Resolved';
  userId: string;
  userPanchayat: string;
  userBlock: string;
  userDistrict: string;
  userState: string;
  assignedTo?: string;
  assignedOperatorName?: string;
  operatorEmail?: string;
  taskStartedAt?: any;
  taskCompletedAt?: any;
  actionTaken?: string;
  verifiedBy?: string;
  rejectionReason?: string;
  gpsLocation?: { lat: number; lng: number };
};

export type UserProfile = {
  id: string;
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  phoneNumber?: string;
  createdAt: any;
  state: string;
  district: string;
  block: string;
  panchayat: string;
  pumpName?: string;
  pumpCategory?: string;
  pumpDischargeRate?: number;
  motorHorsepower?: number;
  tankHeight?: number;
  tankBaseArea?: number;
  distributionNetworkDetails?: string;
  role?: 'gram-panchayat' | 'pump-operator' | 'village-resident' | 'block-official';
}

export type WaterTest = {
    id: string;
    panchayatId: string;
    operatorId: string;
    ward: string;
    locationType: "source" | "tank" | "pipeline" | "household";
    pH: number;
    turbidity: number;
    chlorine: number;
    tds: number;
    iron: number;
    fluoride: number;
    nitrate: number;
    coliform: boolean;
    samplePhotoUrl?: string;
    testDate: any;
    status: "safe" | "unsafe" | "attention-needed";
    flaggedParameters: string[];
    remarks: string;
    reviewedByGp: boolean;
    reviewedByBe: boolean;
    createdAt: any;
    updatedAt: any;
};

export type SopLibraryItem = {
    id: string;
    title: string;
    description: string;
    category: 'Pumping' | 'Pipeline' | 'Chlorination' | 'Safety' | 'General O&M';
    fileType: 'video' | 'image' | 'pdf';
    fileUrl: string;
    thumbnailUrl: string;
    tags: string[];
};

export type DailyChecklist = {
  id: string;
  date: string;
  operatorId: string;
  panchayatId: string;
  pumpData?: {
    totalRuntime: number;
    estimatedVolume: number;
    confirmed: boolean;
  };
  tankLevels?: {
    startOfDay: number;
    endOfDay: number;
  };
  waterQuality?: {
    chlorine: number;
    turbidity: number;
    needsAttention: boolean;
  };
  valveOperations?: {
    valveId: string;
    operation: 'opened' | 'closed';
    timestamp: any;
  }[];
  pipelineInspection?: {
    status: 'OK' | 'Minor Issue' | 'Major Issue';
    photoUrl?: string;
    description?: string;
  };
  motorInspection?: {
    status: 'OK' | 'Minor Issue' | 'Major Issue';
    volts?: number;
    amps?: number;
  };
  sourceStatus?: {
    availability: 'Adequate' | 'Low' | 'No Water';
    rechargeTime?: number;
  };
  wardSupply?: {
    wardId: string;
    startTime: string;
    stopTime: string;
    duration: number;
  }[];
  preventiveMaintenance?: {
    lubrication: boolean;
    panelCleaned: boolean;
    valveMovementTested: boolean;
    pressureChecked: boolean;
  };
  observations?: {
    notes: string;
    photoUrl?: string;
  };
  completedPercentage: number;
  status: 'Pending' | 'Submitted' | 'Requires Review';
}

export type WaterTank = {
  id: string;
  tankId: string;
  name: string;
  capacity: number;
  currentLevel: number;
  lastUpdated: any;
}

export type LeakageAlert = {
    id: string;
    Timestamp: any;
    Sensor_ID: string;
    Pressure: number;
    Flow_Rate: number;
    Temperature: number;
    Leak_Status: 0 | 1;
    Burst_Status: 0 | 1;
    Leakage_Alerts: string;
};
