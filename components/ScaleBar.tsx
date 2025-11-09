

import React, { useState, useEffect } from 'react';
import { useMap } from 'react-leaflet';

const ScaleBar: React.FC = () => {
    const map = useMap();
    const [scaleInfo, setScaleInfo] = useState({
        ratioText: '1 : --',
        barText: '--',
        barWidth: 0,
    });

    useEffect(() => {
        const updateScale = () => {
            if (!map) return;

            const center = map.getCenter();
            const zoom = map.getZoom();
            
            // This constant is the Earth's circumference in meters at the equator.
            const earthCircumference = 40075016.686;
            
            // Meters per pixel at the center latitude
            const metersPerPixel = earthCircumference * Math.cos(center.lat * Math.PI / 180) / Math.pow(2, zoom + 8);

            // Calculate scale ratio assuming a standard screen DPI of 96 (0.0002645833 meters per pixel)
            const metersPerPixelOnScreen = 0.0002645833;
            const scale = metersPerPixel / metersPerPixelOnScreen;
            const ratioText = `1 : ${Math.round(scale).toLocaleString('en-US')}`;

            // Calculate a visually pleasing distance for the scale bar
            const possibleDistances = [1, 2, 5, 10, 20, 30, 50, 100, 200, 300, 500, 1000, 2000, 5000, 10000, 20000, 50000, 100000, 200000, 500000, 1000000];
            const maxBarWidthPx = 100; // Aim for a bar around 100px wide
            
            let idealMeters = 0;
            let minDiff = Infinity;

            for (const dist of possibleDistances) {
                const width = dist / metersPerPixel;
                const diff = Math.abs(width - maxBarWidthPx);
                if (diff < minDiff) {
                    minDiff = diff;
                    idealMeters = dist;
                }
            }

            const barWidth = idealMeters / metersPerPixel;
            const barText = idealMeters < 1000 ? `${idealMeters} m` : `${idealMeters / 1000} km`;

            setScaleInfo({
                ratioText,
                barText,
                barWidth,
            });
        };

        map.on('moveend', updateScale);
        map.on('zoomend', updateScale);
        updateScale(); // Initial call

        return () => {
            map.off('moveend', updateScale);
            map.off('zoomend', updateScale);
        };
    }, [map]);

    const textShadowStyle = { textShadow: '0 1px 3px black, 0 0 5px black' };

    return (
        <div className="absolute bottom-5 left-2 p-1 text-xs font-mono z-[1000] pointer-events-none">
            <div className="text-center mb-1 text-[var(--color-text-secondary)]" style={textShadowStyle}>{scaleInfo.ratioText}</div>
            <div className="flex items-end">
                <div className="border-l-2 border-white h-2"></div>
                <div 
                  className="border-b-2 border-white h-0" 
                  style={{ width: `${scaleInfo.barWidth}px` }}
                />
                <div className="border-r-2 border-white h-2"></div>
                <span className="pl-2 leading-none text-[var(--color-text-primary)]" style={textShadowStyle}>{scaleInfo.barText}</span>
            </div>
        </div>
    );
};

export default ScaleBar;