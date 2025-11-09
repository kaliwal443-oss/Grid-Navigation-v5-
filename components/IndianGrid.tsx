
import React, { useEffect, useState } from 'react';
import { useMap, Polyline, Marker } from 'react-leaflet';
import { LatLng, LatLngBounds, divIcon } from 'leaflet';
import { convertIndianGridToLatLon, convertLatLonToIndianGrid } from '../services/coordService';
import { IndianGridCoordinates, IndianGridZone, GridSpacing } from '../types';

interface IndianGridProps {
    color: string;
    opacity: number;
    weight: number;
    zone: IndianGridZone;
    gridSpacing: GridSpacing;
}

const IndianGrid: React.FC<IndianGridProps> = ({ color, opacity, weight, zone, gridSpacing }) => {
    const map = useMap();
    const [gridLines, setGridLines] = useState<LatLng[][]>([]);
    const [gridLabels, setGridLabels] = useState<Array<{ position: LatLng; text: string }>>([]);

    useEffect(() => {
        const updateGrid = () => {
            const bounds = map.getBounds();
            const zoom = map.getZoom();
            
            let step: number;

            if (gridSpacing === 'Auto') {
                if (zoom < 8) {
                    setGridLines([]);
                    setGridLabels([]);
                    return;
                }
                step = zoom > 14 ? 1000 : zoom > 11 ? 10000 : 100000;
            } else {
                step = gridSpacing;
                if ((step === 1000 && zoom < 12) || (step === 5000 && zoom < 10) || (step === 10000 && zoom < 8)) {
                    setGridLines([]);
                    setGridLabels([]);
                    return;
                }
            }
            
            const formatGridLabel = (value: number): string => {
                if (step < 1000) return '';
                // Extract principal digits (thousands and ten thousands)
                const principal = Math.floor(value / 1000) % 100;
                return principal.toString().padStart(2, '0');
            };

            const sw = bounds.getSouthWest();
            const ne = bounds.getNorthEast();
            
            const extendedBounds = new LatLngBounds(
              new LatLng(sw.lat - (ne.lat - sw.lat) * 0.1, sw.lng - (ne.lng - sw.lng) * 0.1),
              new LatLng(ne.lat + (ne.lat - sw.lat) * 0.1, ne.lng + (ne.lng - sw.lng) * 0.1)
            );

            const swGrid = convertLatLonToIndianGrid(extendedBounds.getSouthWest(), zone);
            const neGrid = convertLatLonToIndianGrid(extendedBounds.getNorthEast(), zone);
            const centerGrid = convertLatLonToIndianGrid(map.getCenter(), zone);

            if (!swGrid || !neGrid || !centerGrid) return;
            
            const newLines: LatLng[][] = [];
            const newLabels: Array<{ position: LatLng; text: string }> = [];

            // Northing lines (horizontal)
            const northStart = Math.floor(swGrid.northing / step) * step;
            for (let n = northStart; n <= neGrid.northing; n += step) {
                const p1 = convertIndianGridToLatLon({easting: swGrid.easting, northing: n, zone: zone});
                const p2 = convertIndianGridToLatLon({easting: neGrid.easting, northing: n, zone: zone});
                if(p1 && p2) {
                    newLines.push([p1, p2]);
                    const labelText = formatGridLabel(n);
                    if (labelText) {
                        const labelPosition = convertIndianGridToLatLon({
                            easting: centerGrid.easting,
                            northing: n,
                            zone: zone
                        });
                        if (labelPosition && bounds.contains(labelPosition)) {
                            newLabels.push({ position: labelPosition, text: labelText });
                        }
                    }
                }
            }

            // Easting lines (vertical)
            const eastStart = Math.floor(swGrid.easting / step) * step;
            for (let e = eastStart; e <= neGrid.easting; e += step) {
                 const p1 = convertIndianGridToLatLon({easting: e, northing: swGrid.northing, zone: zone});
                 const p2 = convertIndianGridToLatLon({easting: e, northing: neGrid.northing, zone: zone});
                 if(p1 && p2) {
                    newLines.push([p1, p2]);
                    const labelText = formatGridLabel(e);
                     if (labelText) {
                        const labelPosition = convertIndianGridToLatLon({
                            easting: e,
                            northing: centerGrid.northing,
                            zone: zone
                        });
                        if (labelPosition && bounds.contains(labelPosition)) {
                            newLabels.push({ position: labelPosition, text: labelText });
                        }
                    }
                 }
            }

            setGridLines(newLines);
            setGridLabels(newLabels);
        };
        
        map.on('moveend', updateGrid);
        updateGrid();

        return () => {
            map.off('moveend', updateGrid);
        };
    }, [map, zone, color, opacity, weight, gridSpacing]);
    
    return <>
        {gridLines.map((line, index) => (
            <Polyline key={index} positions={line} pathOptions={{ color, opacity, weight }} />
        ))}
        {gridLabels.map((label, index) => (
            <Marker
                key={`label-${index}`}
                position={label.position}
                icon={divIcon({
                    className: 'utm-grid-label', // re-use style from UTMGrid
                    html: label.text,
                    iconSize: [40, 20],
                    iconAnchor: [20, 10],
                })}
            />
        ))}
        <style>{`
            .utm-grid-label {
                color: ${color};
                font-weight: 600;
                font-size: 14px;
                font-family: var(--font-mono);
                text-shadow: 0 0 1px #000, 0 0 3px #000, 0 0 5px #000;
                border: none;
                text-align: center;
                line-height: 20px;
                white-space: nowrap;
            }
        `}</style>
    </>;
};

export default IndianGrid;