import React, { useMemo } from 'react';
import { Polyline, Marker, Tooltip } from 'react-leaflet';
import { divIcon, LatLng } from 'leaflet';
import { MarkedPoint } from '../types';
import { formatDistance } from '../services/measurementService';

interface MarkedPointsDisplayProps {
    points: MarkedPoint[];
    startPosition?: LatLng | null;
}

const MarkedPointsDisplay: React.FC<MarkedPointsDisplayProps> = ({ points, startPosition }) => {
    if (points.length === 0) return null;

    const routeStyle = { color: 'var(--color-accent-hover)', weight: 3, opacity: 0.9, dashArray: '8, 8' };

    const pointIcon = (name: string, index: number, total: number) => {
        let backgroundColor = '#3b82f6'; // blue-500
        if (total > 1) {
            if (index === 0) backgroundColor = 'var(--color-success)'; // green-500 for start
            else if (index === total - 1) backgroundColor = 'var(--color-danger)'; // red-500 for end
        }

        return divIcon({
            className: 'custom-point-marker-wrapper',
            html: `<div class="custom-point-marker" style="background-color: ${backgroundColor};"><span>${name}</span></div>`,
            iconSize: [24, 24],
            iconAnchor: [12, 12],
        });
    };

    const transparentIcon = divIcon({
        className: 'transparent-icon',
        iconSize: [0, 0],
    });
    
    const polylinePoints = useMemo(() => {
        const positions = points.map(p => p.position);
        if (startPosition && positions.length > 0) {
            return [startPosition, ...positions];
        }
        return positions;
    }, [points, startPosition]);

    return (
        <>
            <style>{`
                .custom-point-marker-wrapper {
                    /* This wrapper prevents Leaflet from adding its own styles to our main element */
                }
                .custom-point-marker {
                    width: 24px;
                    height: 24px;
                    border-radius: 50%;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    border: 2px solid white;
                    box-shadow: 0 2px 5px rgba(0,0,0,0.5);
                }
                .custom-point-marker span {
                    color: white;
                    font-weight: bold;
                    font-size: 11px;
                    font-family: var(--font-sans);
                }
                .segment-info-tooltip {
                    background-color: var(--color-surface-light);
                    backdrop-filter: blur(2px);
                    border: 1px solid var(--color-surface-lighter);
                    color: var(--color-text-primary);
                    padding: 2px 6px;
                    border-radius: 4px;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.4);
                    font-family: var(--font-mono);
                    font-size: 10px;
                    line-height: 1.3;
                    white-space: nowrap;
                    pointer-events: none;
                    text-align: center;
                }
                .transparent-icon {
                    background: transparent;
                    border: none;
                }
            `}</style>
        
            {/* Draw route line */}
            {polylinePoints.length > 1 && (
                <Polyline positions={polylinePoints} pathOptions={routeStyle} />
            )}

            {/* Draw point markers (without tooltips) */}
            {points.map((point, index) => (
                <Marker 
                    key={point.id}
                    position={point.position}
                    icon={pointIcon(point.name, index, points.length)}
                />
            ))}

            {/* Draw segment info tooltips on invisible markers at midpoints */}
            {points.map((point, index) => {
                const prevPointInfo = index === 0 
                    ? (startPosition ? { position: startPosition, name: 'P0' } : null) 
                    : points[index - 1];

                if (!prevPointInfo || point.distanceFromPrevious === undefined || point.bearingFromPrevious === undefined) return null;

                const midPoint = new LatLng(
                    (prevPointInfo.position.lat + point.position.lat) / 2,
                    (prevPointInfo.position.lng + point.position.lng) / 2
                );

                const pointName = point.name.replace('P', '');
                const prevPointName = prevPointInfo.name.replace('P', '');

                return (
                    <Marker key={`segment-${point.id}`} position={midPoint} icon={transparentIcon}>
                        <Tooltip permanent direction="center" className="segment-info-tooltip">
                            <div className="font-bold">{`P${prevPointName}-P${pointName}`}</div>
                            <div>{`D:${formatDistance(point.distanceFromPrevious)}`}</div>
                            <div>{`B:${Math.round(point.bearingFromPrevious)}°`}</div>
                        </Tooltip>
                    </Marker>
                );
            })}
        </>
    );
};

export default MarkedPointsDisplay;