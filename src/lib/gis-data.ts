

export type State = { id: string; name: string; center: { lat: number; lng: number; }; zoom: number; };
export type District = { id: string; name: string; center: { lat: number; lng: number; }; zoom: number; };
export type Mandal = { id: string; name: string; center: { lat: number; lng: number; }; zoom: number; };
export type Panchayat = { id: string; name: string; center: { lat: number; lng: number; }; zoom: number; };
export type Habitation = { id: string; name: string; };

export interface GeoJsonFeature<G, P> {
    id: string;
    type: "Feature";
    geometry: G;
    properties: P;
}

export interface Point {
    type: "Point";
    coordinates: [number, number]; // [lng, lat]
}

export interface LineString {
    type: "LineString";
    coordinates: [number, number][]; // Array of [lng, lat]
}

export interface PipelineProperties {
    asset_id: string;
    asset_type: "pipeline";
    name: string;
    material: string;
    diameter_mm: number;
    installation_date: string;
    last_maintenance: string;
    status: string;
}

export interface ValveProperties {
    asset_id: string;
    asset_type: "valve";
    name: string;
    installation_date: string;
    last_maintenance: string;
    status: string;
    complaints: number;
}

export interface PumpProperties {
    asset_id: string;
    asset_type: "pump";
    name: string;
    installation_date: string;
    last_maintenance: string;
    status: string;
    complaints: number;
}

export interface TankProperties {
    asset_id: string;
    asset_type: "tank";
    name: string;
    installation_date: string;
    last_maintenance: string;
    status: string;
    complaints: number;
    capacity_kl: number;
}


export type Pipeline = GeoJsonFeature<LineString, PipelineProperties>;
export type Valve = GeoJsonFeature<Point, ValveProperties>;
export type Pump = GeoJsonFeature<Point, PumpProperties>;
export type Tank = GeoJsonFeature<Point, TankProperties>;
export type ComplaintMarker = GeoJsonFeature<Point, any>; // Using any for complaint data for now

// Seed Data for Tamil Nadu -> Chengalpattu -> Kattankolathur -> Anjur

export const states: Omit<State, 'id'>[] = [
    { name: 'Tamil Nadu', center: { lat: 11.1271, lng: 78.6569 }, zoom: 7 }
];

export const districts: { [key: string]: Omit<District, 'id'>[] } = {
    'tamil-nadu': [ // Note the slugified key
        { name: 'Chengalpattu', center: { lat: 12.684, lng: 79.983 }, zoom: 11 },
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


export const pipelines: Omit<Pipeline, 'id' | 'type'>[] = [
    {
        geometry: {
            type: 'LineString',
            coordinates: [
                [80.038, 12.824],
                [80.042, 12.825],
                [80.045, 12.826]
            ]
        },
        properties: {
            asset_id: 'pipe-001',
            asset_type: 'pipeline',
            name: 'Rising Main from Pumping Station',
            material: 'DI',
            diameter_mm: 150,
            installation_date: '2020-01-10',
            last_maintenance: '2024-02-15',
            status: 'Active'
        }
    },
    {
        geometry: {
            type: 'LineString',
            coordinates: [
                [80.045, 12.826],
                [80.046, 12.827],
                [80.045, 12.828]
            ]
        },
        properties: {
            asset_id: 'pipe-002',
            asset_type: 'pipeline',
            name: 'North Anjur Distribution Line',
            material: 'HDPE',
            diameter_mm: 90,
            installation_date: '2020-02-20',
            last_maintenance: '2024-03-10',
            status: 'Active'
        }
    },
];


export const valves: Omit<Valve, 'id' | 'type'>[] = [
     {
        geometry: { type: 'Point', coordinates: [80.042, 12.825] },
        properties: {
            asset_id: 'valve-001',
            asset_type: 'valve',
            name: 'V01 - Sluice Valve',
            installation_date: '2020-01-10',
            last_maintenance: '2024-04-01',
            status: 'Operational',
            complaints: 0
        }
    }
];

export const pumps: Omit<Pump, 'id' | 'type'>[] = [
    {
        geometry: { type: 'Point', coordinates: [80.038, 12.824] },
        properties: {
            asset_id: 'pump-001',
            asset_type: 'pump',
            name: 'Main Pumping Station',
            installation_date: '2019-11-15',
            last_maintenance: '2024-05-20',
            status: 'Active',
            complaints: 1
        }
    }
];

export const tanks: Omit<Tank, 'id' | 'type'>[] = [
    {
        geometry: { type: 'Point', coordinates: [80.045, 12.826] },
        properties: {
            asset_id: 'tank-001',
            asset_type: 'tank',
            name: 'Anjur OHT',
            installation_date: '2020-01-05',
            last_maintenance: '2024-01-30',
            status: 'Active',
            complaints: 0,
            capacity_kl: 50,
        }
    }
];
