import { LatLng, LatLngLiteral } from 'leaflet';

export enum Page {
    Map = 'MAP',
    GPS = 'GPS',
    AR = 'AR',
    Compass = 'COMPASS',
    SunMoon = 'SUN_MOON',
}

export enum CoordSystem {
    UTM_WGS84 = 'UTM (WGS84)',
    IndianGrid_Everest1930 = 'Indian Grid (Everest 1930)',
}

export enum IndianGridZone {
    Z0 = '0',
    IA = 'IA',
    IB = 'IB',
    IIA = 'IIA',
    IIB = 'IIB',
    IIIA = 'IIIA',
    IIIB = 'IIIB',
    IVA = 'IVA',
    IVB = 'IVB',
}

export type GridSpacing = 'Auto' | 1000 | 5000 | 10000;

export interface GridSettings {
    color: string;
    opacity: number;
    weight: number;
}

export interface UTMCoordinates {
    zone: number;
    easting: number;
    northing: number;
    hemisphere: 'N' | 'S';
}

export interface IndianGridCoordinates {
    easting: number;
    northing: number;
    zone: IndianGridZone;
}

export interface GeolocationState {
    lat: number | null;
    lon: number | null;
    error: string | null;
    permissionState: PermissionState | 'prompt' | null;
    accuracy: number | null;
    altitude: number | null;
    altitudeAccuracy: number | null;
    heading: number | null;
    speed: number | null;
}

export interface MarkedPoint {
  id: string;
  name: string;
  position: LatLng;
  coords: {
    utm: UTMCoordinates | null;
    indianGrid: IndianGridCoordinates | null;
  };
  distanceFromPrevious?: number;
  bearingFromPrevious?: number;
  totalDistance: number;
}

export enum MapOrientationMode {
    NorthUp = 'NORTH_UP',
    HeadUp = 'HEAD_UP',
    Free = 'FREE',
}

export interface Waypoint {
  id: string;
  name: string;
  position: { lat: number; lng: number }; // Stored as object for JSON serialization
  coords: {
    utm: UTMCoordinates | null;
    indianGrid: IndianGridCoordinates | null;
  };
}

export enum DrawingTool {
    None = 'NONE',
    Pen = 'PEN',
}

export interface DrawnShape {
  id: string;
  type: DrawingTool;
  points: LatLng[];
  color: string;
  weight: number;
  distance: number;
}

export interface OfflineRegionInfo {
  id: string;
  name: string;
  bounds: { // Storing as plain object for JSON serialization
    _southWest: LatLngLiteral;
    _northEast: LatLngLiteral;
  };
  minZoom: number;
  maxZoom: number;
  tileCount: number;
  createdAt: string;
  layerUrl: string;
}

export interface ImageOverlayState {
  url: string;
  center: { lat: number; lng: number };
  width: number; // in meters
  height: number; // in meters
  rotation: number;
  opacity: number;
}