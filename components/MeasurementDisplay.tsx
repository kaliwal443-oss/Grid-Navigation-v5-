import React from 'react';
import { Polyline, Tooltip } from 'react-leaflet';
import { LatLng } from 'leaflet';
import { DrawnShape, DrawingTool } from '../types';
import { formatDistance, calculateDistance } from '../services/measurementService';

interface MeasurementDisplayProps {
    shapes: DrawnShape[];
    tempPoints: LatLng[];
    mousePos: LatLng | null;
    drawingTool: DrawingTool;
    drawingColor: string;
    drawingWeight: number;
}

const MeasurementDisplay: React.FC<MeasurementDisplayProps> = ({ shapes, tempPoints, mousePos, drawingTool, drawingColor, drawingWeight }) => {
    
    const getShapeStyle = (color: string, weight: number) => ({ color, weight, opacity: 0.9 });
    
    // Live calculation for tooltip
    let liveDistance = 0;
    if (drawingTool === DrawingTool.Pen && tempPoints.length > 0) {
        const pointsToMeasure = mousePos ? [...tempPoints, mousePos] : tempPoints;
        liveDistance = calculateDistance(pointsToMeasure);
    }

    return (
         <>
            <style>{`
                .measurement-tooltip {
                    background-color: var(--color-surface-light);
                    border: 1px solid var(--color-surface-lighter);
                    color: var(--color-text-primary);
                    padding: 4px 8px;
                    border-radius: 4px;
                    box-shadow: none;
                    font-family: var(--font-mono);
                    font-size: 12px;
                    text-align: center;
                }
            `}</style>
            {/* Render completed shapes and their measurements */}
            {shapes.map(shape => (
                <React.Fragment key={shape.id}>
                    {shape.type === DrawingTool.Pen && shape.points.length > 1 && (
                        <Polyline positions={shape.points} pathOptions={getShapeStyle(shape.color, shape.weight)}>
                            <Tooltip permanent className="measurement-tooltip">
                                <strong>Distance:</strong> {formatDistance(shape.distance ?? 0)}
                            </Tooltip>
                        </Polyline>
                    )}
                </React.Fragment>
            ))}

            {/* Render the shape being actively drawn */}
            {drawingTool === DrawingTool.Pen && tempPoints.length > 0 && (
                <>
                    {/* Render the temporary line */}
                    <Polyline positions={mousePos ? [...tempPoints, mousePos] : tempPoints} pathOptions={{ ...getShapeStyle(drawingColor, drawingWeight), dashArray: '5, 5' }} />
                    {/* Render live tooltip */}
                    {mousePos && liveDistance > 0 && (
                       <Tooltip
                            permanent
                            direction="right"
                            offset={[10, 0]}
                            position={mousePos}
                            className="measurement-tooltip"
                        >
                            <div>{formatDistance(liveDistance)}</div>
                        </Tooltip>
                    )}
                </>
            )}
        </>
    );
};

export default MeasurementDisplay;