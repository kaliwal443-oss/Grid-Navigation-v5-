import { LatLng } from 'leaflet';

/**
 * Calculates the total geodesic distance of a path.
 * @param points - An array of LatLng points.
 * @returns The total distance in meters.
 */
export function calculateDistance(points: LatLng[]): number {
    let totalDistance = 0;
    for (let i = 0; i < points.length - 1; i++) {
        totalDistance += points[i].distanceTo(points[i + 1]);
    }
    return totalDistance;
}

/**
 * Calculates the initial bearing (forward azimuth) from one point to another.
 * @param p1 - The starting LatLng point.
 * @param p2 - The ending LatLng point.
 * @returns The bearing in degrees from 0 to 360.
 */
export function calculateBearing(p1: LatLng, p2: LatLng): number {
    const toRadians = (deg: number) => deg * Math.PI / 180;
    const toDegrees = (rad: number) => rad * 180 / Math.PI;

    const lat1 = toRadians(p1.lat);
    const lon1 = toRadians(p1.lng);
    const lat2 = toRadians(p2.lat);
    const lon2 = toRadians(p2.lng);

    const y = Math.sin(lon2 - lon1) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(lon2 - lon1);
    
    const bearingRad = Math.atan2(y, x);
    return (toDegrees(bearingRad) + 360) % 360;
}


/**
 * Formats a distance value into a readable string (m or km).
 * @param distanceInMeters - The distance in meters.
 * @returns A formatted string.
 */
export function formatDistance(distanceInMeters: number): string {
    if (distanceInMeters < 1000) {
        return `${distanceInMeters.toFixed(0)}m`;
    }
    return `${(distanceInMeters / 1000).toFixed(2)}km`;
}

/**
 * Calculates the approximate area of a polygon using the Shoelace formula.
 * Note: This is an approximation on a spherical model and is less accurate for large areas.
 * @param points - An array of LatLng points defining the polygon vertices.
 * @returns The area in square meters.
 */
export function calculateArea(points: LatLng[]): number {
    if (points.length < 3) return 0;

    const R = 6371e3; // Earth radius in meters
    const toRadians = (deg: number) => deg * Math.PI / 180;

    let area = 0;
    for (let i = 0; i < points.length; i++) {
        const p1 = points[i];
        const p2 = points[(i + 1) % points.length];
        
        area += toRadians(p2.lng - p1.lng) * (2 + Math.sin(toRadians(p1.lat)) + Math.sin(toRadians(p2.lat)));
    }

    return Math.abs(area * R * R / 2.0);
}


/**
 * Formats an area value into a readable string (m² or km²).
 * @param areaInSquareMeters - The area in square meters.
 * @returns A formatted string.
 */
export function formatArea(areaInSquareMeters: number): string {
    if (areaInSquareMeters < 10000) { // Show in m² for smaller areas
        return `${areaInSquareMeters.toFixed(0)} m²`;
    }
    return `${(areaInSquareMeters / 1000000).toFixed(3)} km²`;
}

/**
 * Formats a bearing value into a readable string with cardinal direction.
 * @param bearingInDegrees - The bearing in degrees (0-360).
 * @returns A formatted string (e.g., "135° SE").
 */
export function formatBearing(bearingInDegrees: number): string {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const index = Math.round(bearingInDegrees / 22.5) % 16;
    return `${bearingInDegrees.toFixed(1)}° ${directions[index]}`;
}

/**
 * Calculates the destination point given a starting point, bearing, and distance.
 * Uses a spherical Earth model for calculation.
 * @param startPoint - The starting LatLng point.
 * @param bearing - The bearing in degrees (0-360).
 * @param distance - The distance in meters.
 * @returns The destination LatLng point.
 */
export function calculateDestinationPoint(startPoint: LatLng, bearing: number, distance: number): LatLng {
    const R = 6371e3; // Earth's radius in meters
    const toRadians = (deg: number) => deg * Math.PI / 180;
    const toDegrees = (rad: number) => rad * 180 / Math.PI;

    const lat1 = toRadians(startPoint.lat);
    const lon1 = toRadians(startPoint.lng);
    const brng = toRadians(bearing);

    const lat2 = Math.asin(Math.sin(lat1) * Math.cos(distance / R) +
                          Math.cos(lat1) * Math.sin(distance / R) * Math.cos(brng));

    const lon2 = lon1 + Math.atan2(Math.sin(brng) * Math.sin(distance / R) * Math.cos(lat1),
                                  Math.cos(distance / R) - Math.sin(lat1) * Math.sin(lat2));

    return new LatLng(toDegrees(lat2), toDegrees(lon2));
}