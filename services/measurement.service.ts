import { Injectable } from '@angular/core';
import { LatLng } from 'leaflet';

@Injectable({ providedIn: 'root' })
export class MeasurementService {

    /** Calculates the total geodesic distance of a path. */
    calculateDistance(points: LatLng[]): number {
        let totalDistance = 0;
        for (let i = 0; i < points.length - 1; i++) {
            totalDistance += points[i].distanceTo(points[i + 1]);
        }
        return totalDistance;
    }

    /** Calculates the initial bearing (forward azimuth) from one point to another. */
    calculateBearing(p1: LatLng, p2: LatLng): number {
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

    /** Formats a distance value into a readable string (m or km). */
    formatDistance(distanceInMeters: number): string {
        if (distanceInMeters < 1000) {
            return `${distanceInMeters.toFixed(0)}m`;
        }
        return `${(distanceInMeters / 1000).toFixed(2)}km`;
    }

    /** Calculates the destination point given a starting point, bearing, and distance. */
    calculateDestinationPoint(startPoint: LatLng, bearing: number, distance: number): LatLng {
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
}
