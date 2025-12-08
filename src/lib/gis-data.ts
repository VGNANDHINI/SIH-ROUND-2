

import { Timestamp } from "firebase/firestore";

export type State = { id: string; name: string; center: { lat: number; lng: number; }; zoom: number; };
export type District = { id: string; name: string; center: { lat: number; lng: number; }; zoom: number; };
export type Mandal = { id: string; name: string; center: { lat: number; lng: number; }; zoom: number; };
export type Panchayat = { id: string; name: string; center: { lat: number; lng: number; }; zoom: number; };
export type Habitation = { id: string; name: string; };

export type Pipeline = {
    id: string;
    type: "Rising Main" | "Distribution";
    material: string;
    diameter: number;
    path: { lat: number; lng: number; }[];
    length: number;
    villageServed: string;
};

export type Marker = {
    id: string;
    type: "Pump" | "Tank" | "Valve" | "Alert" | "Operator" | "Complaint" | "Pump Fault" | "Leak Cluster";
    label: string;
    position: { lat: number; lng: number; };
    data?: any;
};

// Seed Data for Tamil Nadu -> Chengalpattu -> Kattankolathur -> Anjur

export const states: Omit<State, 'id'>[] = [
    { name: 'Tamil Nadu', center: { lat: 11.1271, lng: 78.6569 }, zoom: 7 }
];

export const districts: { [key: string]: Omit<District, 'id'>[] } = {
    'tamil-nadu': [
        { name: 'Chengalpattu', center: { lat: 12.684, lng: 79.983 }, zoom: 11 },
        { name: 'Chennai', center: { lat: 13.0827, lng: 80.2707 }, zoom: 11 },
        { name: 'Coimbatore', center: { lat: 11.0168, lng: 76.9558 }, zoom: 11 },
        { name: 'Madurai', center: { lat: 9.9252, lng: 78.1198 }, zoom: 11 },
        { name: 'Kanyakumari', center: { lat: 8.0883, lng: 77.5385 }, zoom: 11 },
    ]
};

export const mandals: { [key: string]: Omit<Mandal, 'id'>[] } = {
    'chengalpattu': [
        { name: 'Kattankolathur', center: { lat: 12.82, lng: 80.05 }, zoom: 13 }
    ]
};

export const panchayats: { [key: string]: Omit<Panchayat, 'id'>[] } = {
    'kattankolathur': [
        { name: 'Anjur', center: { lat: 12.826, lng: 80.045 }, zoom: 15 }
    ]
};


export const pipelines: Omit<Pipeline, 'id'>[] = [
    {
        id: 'anjur-rm-01',
        type: 'Rising Main',
        material: 'DI',
        diameter: 150,
        path: [
            { lat: 12.824, lng: 80.038 },
            { lat: 12.825, lng: 80.042 },
            { lat: 12.826, lng: 80.045 }
        ],
        length: 800,
        villageServed: 'Anjur'
    },
    {
        id: 'anjur-dist-01',
        type: 'Distribution',
        material: 'HDPE',
        diameter: 90,
        path: [
            { lat: 12.826, lng: 80.045 },
            { lat: 12.827, lng: 80.046 },
            { lat: 12.828, lng: 80.045 }
        ],
        length: 250,
        villageServed: 'Anjur'
    },
    {
        id: 'anjur-dist-02',
        type: 'Distribution',
        material: 'HDPE',
        diameter: 90,
        path: [
            { lat: 12.826, lng: 80.045 },
            { lat: 12.825, lng: 80.048 },
            { lat: 12.824, lng: 80.049 }
        ],
        length: 400,
        villageServed: 'Anjur'
    }
];

export const markers: Omit<Marker, 'id'>[] = [
    {
        id: 'anjur-pump-01',
        type: 'Pump',
        label: 'Main Pumping Station',
        position: { lat: 12.824, lng: 80.038 }
    },
    {
        id: 'anjur-tank-01',
        type: 'Tank',
        label: 'OHT - Anjur',
        position: { lat: 12.826, lng: 80.045 },
        data: { capacity: 50000 }
    },
    {
        id: 'anjur-valve-01',
        type: 'Valve',
        label: 'V01',
        position: { lat: 12.825, lng: 80.042 }
    }
];

    
