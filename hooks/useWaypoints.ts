import { useState, useEffect, useCallback } from 'react';
import { Waypoint, MarkedPoint } from '../types';

const WAYPOINTS_STORAGE_KEY = 'grid-nav-waypoints';

const useWaypoints = () => {
    const [waypoints, setWaypoints] = useState<Waypoint[]>([]);

    useEffect(() => {
        try {
            const storedWaypoints = localStorage.getItem(WAYPOINTS_STORAGE_KEY);
            if (storedWaypoints) {
                setWaypoints(JSON.parse(storedWaypoints));
            }
        } catch (error) {
            console.error("Failed to load waypoints from localStorage", error);
        }
    }, []);

    const saveWaypointsToStorage = (updatedWaypoints: Waypoint[]) => {
        try {
            localStorage.setItem(WAYPOINTS_STORAGE_KEY, JSON.stringify(updatedWaypoints));
        } catch (error) {
            console.error("Failed to save waypoints to localStorage", error);
        }
    };

    const addWaypoint = useCallback((point: MarkedPoint) => {
        setWaypoints(prevWaypoints => {
            if (prevWaypoints.some(wp => wp.name === point.name)) {
                alert(`A waypoint named "${point.name}" already exists.`);
                return prevWaypoints;
            }

            const newWaypoint: Waypoint = {
                id: point.id,
                name: point.name,
                position: { lat: point.position.lat, lng: point.position.lng },
                coords: point.coords,
            };

            const updatedWaypoints = [...prevWaypoints, newWaypoint];
            saveWaypointsToStorage(updatedWaypoints);
            return updatedWaypoints;
        });
    }, []);
    
    const saveRouteAsWaypoints = useCallback((points: MarkedPoint[]) => {
        setWaypoints(prevWaypoints => {
            const newWaypoints: Waypoint[] = points.map(p => ({
                id: p.id,
                name: p.name,
                position: { lat: p.position.lat, lng: p.position.lng },
                coords: p.coords,
            }));

            const existingNames = new Set(prevWaypoints.map(wp => wp.name));
            const filteredNewWaypoints = newWaypoints.filter(wp => !existingNames.has(wp.name));

            if (filteredNewWaypoints.length !== newWaypoints.length) {
                const skippedCount = newWaypoints.length - filteredNewWaypoints.length;
                alert(`${skippedCount} point(s) were not saved as waypoints because their names (e.g., "P1") already exist.`);
            }
            
            if (filteredNewWaypoints.length === 0 && newWaypoints.length > 0) {
                 alert('All points in this route already exist as waypoints.');
                 return prevWaypoints;
            }

            const updatedWaypoints = [...prevWaypoints, ...filteredNewWaypoints];
            saveWaypointsToStorage(updatedWaypoints);
             if (filteredNewWaypoints.length > 0) {
                alert(`${filteredNewWaypoints.length} new waypoint(s) saved.`);
            }
            return updatedWaypoints;
        });
    }, []);

    const deleteWaypoint = useCallback((waypointId: string) => {
        setWaypoints(prevWaypoints => {
            const updatedWaypoints = prevWaypoints.filter(wp => wp.id !== waypointId);
            saveWaypointsToStorage(updatedWaypoints);
            return updatedWaypoints;
        });
    }, []);

    return { waypoints, addWaypoint, deleteWaypoint, saveRouteAsWaypoints };
};

export default useWaypoints;