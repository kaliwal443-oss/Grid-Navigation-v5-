import { useState, useEffect, useCallback } from 'react';
import { OfflineRegionInfo } from '../types';

const OFFLINE_REGIONS_KEY = 'grid-nav-offline-regions';

const useOfflineMaps = () => {
    const [regions, setRegions] = useState<OfflineRegionInfo[]>([]);

    useEffect(() => {
        try {
            const stored = localStorage.getItem(OFFLINE_REGIONS_KEY);
            if (stored) {
                setRegions(JSON.parse(stored));
            }
        } catch (error) {
            console.error("Failed to load offline regions:", error);
        }
    }, []);

    const saveRegions = (updatedRegions: OfflineRegionInfo[]) => {
        setRegions(updatedRegions);
        try {
            localStorage.setItem(OFFLINE_REGIONS_KEY, JSON.stringify(updatedRegions));
        } catch (error) {
            console.error("Failed to save offline regions:", error);
        }
    };

    const addRegion = useCallback((region: Omit<OfflineRegionInfo, 'id' | 'createdAt'>) => {
        setRegions(prevRegions => {
            const newRegion: OfflineRegionInfo = {
                ...region,
                id: String(Date.now()),
                createdAt: new Date().toISOString(),
            };
            const updatedRegions = [...prevRegions, newRegion];
            saveRegions(updatedRegions);
            return updatedRegions;
        });
    }, []);

    const deleteRegion = useCallback((regionId: string, tileUrls: string[]) => {
        // Post message to service worker to delete cached tiles
        if (navigator.serviceWorker && navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({
                type: 'DELETE_TILES',
                urls: tileUrls,
            });
        }

        // Remove region metadata from localStorage
        setRegions(prevRegions => {
             const updatedRegions = prevRegions.filter(r => r.id !== regionId);
             saveRegions(updatedRegions);
             return updatedRegions;
        });
    }, []);

    return { regions, addRegion, deleteRegion };
};

export default useOfflineMaps;
