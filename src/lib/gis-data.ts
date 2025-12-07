

export type State = { id: string; name: string; };
export type District = { id: string; name: string; };
export type Mandal = { id: string; name: string; };
export type Panchayat = { id: string; name: string; };
export type Habitation = { id: string; name: string; };

export type Pipeline = {
    id: string;
    type: "Rising Main" | "Distribution";
    material: string;
    diameter: number;
    path: { lat: number; lng: number; }[];
};

export type Marker = {
    id: string;
    type: "Pump" | "Tank" | "Valve" | "Alert";
    label: string;
    position: { lat: number; lng: number; };
};

// Seed Data for Tamil Nadu -> Chengalpattu -> Kattankolathur -> Anjur

export const states: State[] = [
    { id: 'tamil_nadu', name: 'Tamil Nadu' }
];

export const districts: District[] = [
    { id: 'chengalpattu', name: 'Chengalpattu' }
];

export const mandals: Mandal[] = [
    { id: 'kattankolathur', name: 'Kattankolathur' }
];

export const panchayats: Panchayat[] = [
    { id: 'anjur', name: 'Anjur' }
];

export const pipelines: Omit<Pipeline, 'id'>[] = [
    {
        type: 'Rising Main',
        material: 'DI',
        diameter: 150,
        path: [
            { lat: 12.824, lng: 80.038 },
            { lat: 12.825, lng: 80.042 },
            { lat: 12.826, lng: 80.045 }
        ]
    },
    {
        type: 'Distribution',
        material: 'HDPE',
        diameter: 90,
        path: [
            { lat: 12.826, lng: 80.045 },
            { lat: 12.827, lng: 80.046 },
            { lat: 12.828, lng: 80.045 }
        ]
    },
    {
        type: 'Distribution',
        material: 'HDPE',
        diameter: 90,
        path: [
            { lat: 12.826, lng: 80.045 },
            { lat: 12.825, lng: 80.048 },
            { lat: 12.824, lng: 80.049 }
        ]
    }
];

export const markers: Omit<Marker, 'id'>[] = [
    {
        type: 'Pump',
        label: 'Main Pumping Station',
        position: { lat: 12.824, lng: 80.038 }
    },
    {
        type: 'Tank',
        label: 'OHT - Anjur',
        position: { lat: 12.826, lng: 80.045 }
    },
    {
        type: 'Valve',
        label: 'V01',
        position: { lat: 12.825, lng: 80.042 }
    },
    {
        type: 'Alert',
        label: 'Low Pressure Complaint',
        position: { lat: 12.828, lng: 80.045 }
    }
];
