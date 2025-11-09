// FIX: Added 'React' to the import statement. It is required for JSX and to use 'React.FC'.
import React, { useEffect, useState } from 'react';
import { useMap, Polyline, Marker } from 'react-leaflet';
import { LatLng, LatLngBounds, divIcon } from 'leaflet';
import { convertUtmToLatLon, convertLatLonToUtm } from '../services/coordService';
import { UTMCoordinates, GridSpacing } from '../types';

interface UTMGridProps {
    color: string;
    opacity: number;
    weight: number;
    forcedZone?: number | null;
    gridSpacing: GridSpacing;
}

const UTMGrid: React.FC<UTMGridProps> = ({ color, opacity, weight, forcedZone, gridSpacing }) => {
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
                // Prevent rendering a grid that is too dense for the current view
                if ((step === 1000 && zoom < 12) || (step === 5000 && zoom < 10) || (step === 10000 && zoom < 8)) {
                    setGridLines([]);
                    setGridLabels([]);
                    return;
                }
            }
            
            const formatGridLabel = (value: number): string => {
                if (step < 1000) return '';
                const hundredKm = Math.floor(value / 100000);
                const principal = Math.floor(value / 1000) % 100;
                return `<span style="font-size: 0.7em; vertical-align: super; letter-spacing: -1px;">${hundredKm}</span>${principal.toString().padStart(2, '0')}`;
            };

            const center = map.getCenter();
            // Use the forced zone if provided, otherwise calculate from center
            const zone = forcedZone || (Math.floor((center.lng + 180) / 6) + 1);
            
            const centerUtm = convertLatLonToUtm(center, zone);
            if (!centerUtm) return;

            const sw = bounds.getSouthWest();
            const ne = bounds.getNorthEast();
            
            // Extend bounds slightly to avoid lines popping at edges
            const extendedBounds = new LatLngBounds(
              new LatLng(sw.lat - (ne.lat - sw.lat) * 0.1, sw.lng - (ne.lng - sw.lng) * 0.1),
              new LatLng(ne.lat + (ne.lat - sw.lat) * 0.1, ne.lng + (ne.lng - sw.lng) * 0.1)
            );

            const swUtm = convertLatLonToUtm(extendedBounds.getSouthWest(), zone);
            const neUtm = convertLatLonToUtm(extendedBounds.getNorthEast(), zone);

            if (!swUtm || !neUtm) return;
            
            const newLines: LatLng[][] = [];
            const newLabels: Array<{ position: LatLng; text: string }> = [];

            // Northing lines (horizontal)
            const northStart = Math.floor(swUtm.northing / step) * step;
            for (let n = northStart; n <= neUtm.northing; n += step) {
                const p1 = convertUtmToLatLon({easting: swUtm.easting, northing: n, zone: zone, hemisphere: centerUtm.hemisphere});
                const p2 = convertUtmToLatLon({easting: neUtm.easting, northing: n, zone: zone, hemisphere: centerUtm.hemisphere});
                if(p1 && p2) {
                    newLines.push([p1, p2]);
                    const labelText = formatGridLabel(n);
                    if (labelText) {
                        const labelPosition = convertUtmToLatLon({
                            easting: centerUtm.easting,
                            northing: n,
                            zone: zone,
                            hemisphere: centerUtm.hemisphere
                        });
                        if (labelPosition && bounds.contains(labelPosition)) {
                            newLabels.push({ position: labelPosition, text: labelText });
                        }
                    }
                }
            }

            // Easting lines (vertical)
            const eastStart = Math.floor(swUtm.easting / step) * step;
            for (let e = eastStart; e <= neUtm.easting; e += step) {
                 const p1 = convertUtmToLatLon({easting: e, northing: swUtm.northing, zone: zone, hemisphere: centerUtm.hemisphere});
                 const p2 = convertUtmToLatLon({easting: e, northing: neUtm.northing, zone: zone, hemisphere: centerUtm.hemisphere});
                 if(p1 && p2) {
                    newLines.push([p1, p2]);
                    const labelText = formatGridLabel(e);
                     if (labelText) {
                        const labelPosition = convertUtmToLatLon({
                            easting: e,
                            northing: centerUtm.northing,
                            zone: zone,
                            hemisphere: centerUtm.hemisphere
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
    }, [map, forcedZone, color, opacity, weight, gridSpacing]); // Rerun effect if gridSpacing or style changes
    
    return <>
        {gridLines.map((line, index) => (
            <Polyline key={index} positions={line} pathOptions={{ color, opacity, weight }} />
        ))}
        {gridLabels.map((label, index) => (
            <Marker
                key={`label-${index}`}
                position={label.position}
                icon={divIcon({
                    className: 'utm-grid-label',
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

export default UTMGrid;