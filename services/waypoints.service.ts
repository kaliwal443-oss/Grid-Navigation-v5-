import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Waypoint, MarkedPoint } from '../types';

@Injectable({ providedIn: 'root' })
export class WaypointsService {
    private readonly WAYPOINTS_STORAGE_KEY = 'grid-nav-waypoints';
    private waypointsSubject = new BehaviorSubject<Waypoint[]>([]);
    
    public waypoints$ = this.waypointsSubject.asObservable();

    constructor() {
        this.loadWaypoints();
    }

    private loadWaypoints(): void {
        try {
            const storedWaypoints = localStorage.getItem(this.WAYPOINTS_STORAGE_KEY);
            if (storedWaypoints) {
                this.waypointsSubject.next(JSON.parse(storedWaypoints));
            }
        } catch (error) {
            console.error("Failed to load waypoints from localStorage", error);
        }
    }

    private saveWaypoints(waypoints: Waypoint[]): void {
        try {
            localStorage.setItem(this.WAYPOINTS_STORAGE_KEY, JSON.stringify(waypoints));
            this.waypointsSubject.next(waypoints);
        } catch (error) {
            console.error("Failed to save waypoints to localStorage", error);
        }
    }

    addWaypoint(point: MarkedPoint): void {
        const currentWaypoints = this.waypointsSubject.getValue();
        if (currentWaypoints.some(wp => wp.name === point.name)) {
            alert(`A waypoint named "${point.name}" already exists.`);
            return;
        }

        const newWaypoint: Waypoint = {
            id: point.id,
            name: point.name,
            position: { lat: point.position.lat, lng: point.position.lng },
            coords: point.coords,
        };
        this.saveWaypoints([...currentWaypoints, newWaypoint]);
    }

    saveRouteAsWaypoints(points: MarkedPoint[]): void {
        const currentWaypoints = this.waypointsSubject.getValue();
        const newWaypoints: Waypoint[] = points.map(p => ({
            id: p.id,
            name: p.name,
            position: { lat: p.position.lat, lng: p.position.lng },
            coords: p.coords,
        }));

        const existingNames = new Set(currentWaypoints.map(wp => wp.name));
        const filteredNewWaypoints = newWaypoints.filter(wp => !existingNames.has(wp.name));

        if (filteredNewWaypoints.length !== newWaypoints.length) {
            const skippedCount = newWaypoints.length - filteredNewWaypoints.length;
            alert(`${skippedCount} point(s) were not saved because their names already exist.`);
        }
        
        if (filteredNewWaypoints.length === 0 && newWaypoints.length > 0) {
             alert('All points in this route already exist as waypoints.');
             return;
        }

        if (filteredNewWaypoints.length > 0) {
            this.saveWaypoints([...currentWaypoints, ...filteredNewWaypoints]);
            alert(`${filteredNewWaypoints.length} new waypoint(s) saved.`);
        }
    }

    deleteWaypoint(waypointId: string): void {
        const updatedWaypoints = this.waypointsSubject.getValue().filter(wp => wp.id !== waypointId);
        this.saveWaypoints(updatedWaypoints);
    }
}
