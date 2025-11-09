import { useState, useEffect, useCallback } from 'react';
import { Map as LeafletMap } from 'leaflet';
import { MapLayer } from '../components/MapLayerControl';

const MAP_VIEW_STORAGE_KEY = 'grid-nav-map-view';

export interface SavedMapView {
    lat: number;
    lng: number;
    zoom: number;
    layer: MapLayer;
}

const useMapViewPersistence = (map: LeafletMap | null, activeLayer: MapLayer) => {
    const [savedView, setSavedView] = useState<SavedMapView | null>(null);

    useEffect(() => {
        try {
            const storedView = localStorage.getItem(MAP_VIEW_STORAGE_KEY);
            if (storedView) {
                setSavedView(JSON.parse(storedView));
            }
        } catch (error) {
            console.error("Failed to load map view from localStorage", error);
        }
    }, []);

    const saveMapView = useCallback(() => {
        if (!map) return;
        try {
            const viewToSave: SavedMapView = {
                lat: map.getCenter().lat,
                lng: map.getCenter().lng,
                zoom: map.getZoom(),
                layer: activeLayer,
            };
            localStorage.setItem(MAP_VIEW_STORAGE_KEY, JSON.stringify(viewToSave));
            setSavedView(viewToSave);
            // User feedback could be added here if desired (e.g., via a toast notification)
        } catch (error) {
            console.error("Failed to save map view to localStorage", error);
        }
    }, [map, activeLayer]);

    return { saveMapView, savedView };
};

export default useMapViewPersistence;
