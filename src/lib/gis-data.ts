
import type { Complaint } from "./data";

export type Panchayat = { id: string; name: string; center: { lat: number; lng: number; }; zoom: number; };

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

export interface GisProperties {
    asset_id?: string;
    name: string;
    asset_type: "pipeline" | "valve" | "pump" | "tank" | "complaint";
    village: string;
    status: string;
    last_updated: string;
}

export type PipelineFeature = GeoJsonFeature<LineString, GisProperties>;
export type ValveFeature = GeoJsonFeature<Point, GisProperties>;
export type PumpFeature = GeoJsonFeature<Point, GisProperties>;
export type TankFeature = GeoJsonFeature<Point, GisProperties>;
export type ComplaintFeature = GeoJsonFeature<Point, Complaint & { asset_type: 'complaint' }>;

// Seed Data
export const panchayatDetails: Panchayat = {
    id: 'anjur',
    name: 'Anjur',
    center: { lat: 12.828, lng: 80.051 },
    zoom: 16
};

// Sample data to be used for seeding the database
export const samplePipeline: Omit<PipelineFeature, 'id'> = {
    type: "Feature",
    geometry: {
        type: "LineString",
        coordinates: [
          [80.04990, 12.82701],
          [80.05060, 12.82775],
          [80.05145, 12.82852],
          [80.05210, 12.82910]
        ]
    },
    properties: {
        asset_id: 'pipeline_001',
        asset_type: "pipeline",
        name: "Main Distribution Pipeline",
        village: "Anjur",
        status: "active",
        last_updated: "2025-12-08T10:00:00Z"
    }
};

export const sampleValve: Omit<ValveFeature, 'id'> = {
    type: "Feature",
    geometry: { type: "Point", coordinates: [80.05145, 12.82852] },
    properties: {
        asset_id: 'valve_001',
        asset_type: "valve",
        name: "Control Valve 1",
        village: "Anjur",
        status: "operational",
        last_updated: "2025-12-08T10:00:00Z"
    }
};

export const samplePump: Omit<PumpFeature, 'id'> = {
    type: "Feature",
    geometry: { type: "Point", coordinates: [80.05220, 12.82950] },
    properties: {
        asset_id: 'pump_001',
        asset_type: "pump",
        name: "Primary Booster Pump",
        village: "Anjur",
        status: "active",
        last_updated: new Date().toISOString()
    }
};

export const sampleTank: Omit<TankFeature, 'id'> = {
    type: "Feature",
    geometry: { type: "Point", coordinates: [80.05310, 12.83010] },
    properties: {
        asset_id: 'tank_001',
        asset_type: "tank",
        name: "Overhead Tank",
        village: "Anjur",
        status: "active",
        last_updated: new Date().toISOString()
    }
};
