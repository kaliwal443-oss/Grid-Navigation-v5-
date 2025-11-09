import React, { useMemo, useState, useEffect } from 'react';
import { Marker, useMap, useMapEvents } from 'react-leaflet';
import { divIcon, LatLng, LatLngBounds } from 'leaflet';
import { ImageOverlayState } from '../types';
import { calculateDestinationPoint } from '../services/measurementService';

interface EditableImageOverlayProps {
    overlay: ImageOverlayState;
    onOverlayChange: (overlay: ImageOverlayState | null) => void;
}

const EditableImageOverlay: React.FC<EditableImageOverlayProps> = ({ overlay, onOverlayChange }) => {
    const map = useMap();
    const [pixelSize, setPixelSize] = useState({ width: 0, height: 0 });

    const calculatePixelSize = (centerLatLng: LatLng, widthMeters: number, heightMeters: number) => {
        // Find corners by projecting from the center.
        // This is a simplified approach; for high precision at poles, more complex geo math would be needed.
        const northPoint = calculateDestinationPoint(centerLatLng, 0, heightMeters / 2);
        const southPoint = calculateDestinationPoint(centerLatLng, 180, heightMeters / 2);
        const eastPoint = calculateDestinationPoint(centerLatLng, 90, widthMeters / 2);
        const westPoint = calculateDestinationPoint(centerLatLng, 270, widthMeters / 2);

        // Create LatLngBounds from the extreme points.
        const bounds = new LatLngBounds(
            new LatLng(southPoint.lat, westPoint.lng),
            new LatLng(northPoint.lat, eastPoint.lng)
        );

        // Convert corner LatLngs to layer points (pixels relative to map container)
        const swPoint = map.latLngToLayerPoint(bounds.getSouthWest());
        const nePoint = map.latLngToLayerPoint(bounds.getNorthEast());
        
        // Calculate width and height in pixels
        const widthPx = Math.abs(nePoint.x - swPoint.x);
        const heightPx = Math.abs(swPoint.y - nePoint.y);

        setPixelSize({ width: widthPx, height: heightPx });
    };

    // Recalculate size on zoom or when overlay data changes
    useEffect(() => {
        const centerLatLng = new LatLng(overlay.center.lat, overlay.center.lng);
        calculatePixelSize(centerLatLng, overlay.width, overlay.height);
    }, [map, overlay.width, overlay.height, overlay.center]); // Dependencies for recalculation

    // Add a map event listener to update size on zoom
    useMapEvents({
        zoomend: () => {
            const centerLatLng = new LatLng(overlay.center.lat, overlay.center.lng);
            calculatePixelSize(centerLatLng, overlay.width, overlay.height);
        },
    });

    const handleDragEnd = (e: any) => {
        const newCenter = e.target.getLatLng();
        onOverlayChange({
            ...overlay,
            center: { lat: newCenter.lat, lng: newCenter.lng }, // Update center in parent state
        });
    };

    // useMemo helps to avoid re-creating the icon on every render
    const imageIcon = useMemo(() => {
        // Prevent creating an icon with 0 size, which can cause Leaflet errors
        if (pixelSize.width === 0 || pixelSize.height === 0) {
            return divIcon({ className: 'hidden' }); // Return an invisible icon
        }
        
        const moveIconSvg = `
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="5 9 2 12 5 15"/>
                <polyline points="9 5 12 2 15 5"/>
                <polyline points="15 19 12 22 9 19"/>
                <polyline points="19 9 22 12 19 15"/>
                <line x1="2" x2="22" y1="12" y2="12"/>
                <line x1="12" x2="12" y1="2" y2="22"/>
            </svg>
        `;

        return divIcon({
            className: 'editable-image-overlay', // Custom class for potential CSS
            html: `
                <div style="
                    transform: rotate(${overlay.rotation}deg);
                    width: 100%;
                    height: 100%;
                    position: relative;
                    cursor: move;
                ">
                    <img 
                        src="${overlay.url}" 
                        style="width: 100%; height: 100%; opacity: ${overlay.opacity};" 
                    />
                    <div style="
                        position: absolute;
                        top: 50%;
                        left: 50%;
                        transform: translate(-50%, -50%);
                        color: white;
                        background-color: rgba(0, 0, 0, 0.6);
                        border-radius: 50%;
                        padding: 6px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        filter: drop-shadow(0 1px 2px rgba(0,0,0,0.5));
                    ">
                        ${moveIconSvg}
                    </div>
                </div>
            `,
            iconSize: [pixelSize.width, pixelSize.height],
            iconAnchor: [pixelSize.width / 2, pixelSize.height / 2], // Anchor to the center
        });
    }, [overlay, pixelSize]);

    return (
        <Marker
            position={[overlay.center.lat, overlay.center.lng]}
            icon={imageIcon}
            draggable={true}
            eventHandlers={{
                dragend: handleDragEnd,
            }}
        />
    );
};

export default EditableImageOverlay;