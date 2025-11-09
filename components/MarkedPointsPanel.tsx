import React, { useRef, useEffect } from 'react';
import { MarkedPoint, CoordSystem } from '../types';
import { Trash2, Undo, LocateFixed, Pin, PlusCircle, Save, X } from 'lucide-react';
import { formatDistance } from '../services/measurementService';

interface MarkedPointsPanelProps {
    isOpen: boolean;
    onClosePanel: () => void;
    points: MarkedPoint[];
    coordSystem: CoordSystem;
    onAddCurrentLocation: () => void;
    onDelete: (id: string) => void;
    onUndo: () => void;
    onClear: () => void;
    onGoTo: (point: MarkedPoint) => void;
    onSaveRoute: () => void;
}

const PointRow: React.FC<{ point: MarkedPoint; coordSystem: CoordSystem; onDelete: (id: string) => void; onGoTo: (point: MarkedPoint) => void; }> = ({ point, coordSystem, onDelete, onGoTo }) => {
    const coords = coordSystem === CoordSystem.UTM_WGS84 ? point.coords.utm : point.coords.indianGrid;
    return (
        <div className="flex items-center justify-between p-1.5 rounded-md hover:bg-[var(--color-surface-lighter)]/50 transition-colors">
            <div className="flex items-center space-x-2">
                <span className="font-bold text-[var(--color-accent)] w-8 text-center">{point.name}</span>
                <div className="text-xs font-mono">
                    <p>{coords ? (coordSystem === CoordSystem.UTM_WGS84 && 'zone' in coords ? `${coords.zone}${coords.hemisphere} ${coords.easting.toFixed(0)} E ${coords.northing.toFixed(0)} N` : `${(coords as any).easting.toFixed(0)} E ${(coords as any).northing.toFixed(0)} N`) : 'Calculating...'}</p>
                    <p className="text-[var(--color-text-secondary)]">Total: {formatDistance(point.totalDistance)}</p>
                </div>
            </div>
            <div className="flex items-center">
                <button onClick={() => onGoTo(point)} className="p-1.5 rounded-full hover:bg-[var(--color-surface-light)] text-[var(--color-text-secondary)] hover:text-white" title="Navigate to point"><LocateFixed size={16}/></button>
                <button onClick={() => onDelete(point.id)} className="p-1.5 rounded-full hover:bg-red-900/50 text-[var(--color-danger)]" title="Delete point"><Trash2 size={16}/></button>
            </div>
        </div>
    );
};

const MarkedPointsPanel: React.FC<MarkedPointsPanelProps> = ({ isOpen, onClosePanel, points, coordSystem, onAddCurrentLocation, onDelete, onUndo, onClear, onGoTo, onSaveRoute }) => {
    const listRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
    }, [points.length]);

    const totalDistance = points.length > 0 ? points[points.length - 1].totalDistance : 0;

    return (
        <div className={`fixed bottom-0 left-0 right-0 z-[1001] transition-transform duration-300 ease-in-out ${isOpen ? '-translate-y-16' : 'translate-y-full'}`}>
            <div className="marked-points-panel-content">
                <div className="flex items-center justify-between p-2 border-b border-[var(--color-surface-light)]">
                    <div className="flex items-center space-x-2 overflow-hidden">
                        <Pin className="text-[var(--color-accent)] flex-shrink-0" size={18}/>
                        <div>
                            <h3 className="font-bold text-sm leading-tight truncate">Route Planner</h3>
                            <p className="text-xs text-[var(--color-text-secondary)] leading-tight">{points.length} points, Total: {formatDistance(totalDistance)}</p>
                        </div>
                    </div>
                    <button onClick={onClosePanel} className="p-1.5 rounded-full hover:bg-red-900/50 text-[var(--color-danger)]" title="Close Planner"><X size={18} /></button>
                </div>
                <div ref={listRef} className="flex-grow overflow-y-auto p-2 max-h-[30vh]">
                    {points.length > 0 ? (
                        <div className="space-y-0.5">{points.map(p => <PointRow key={p.id} point={p} coordSystem={coordSystem} onDelete={onDelete} onGoTo={onGoTo} />)}</div>
                    ) : (
                        <div className="text-center py-6 text-[var(--color-text-secondary)]"><p className="text-sm">Tap on the map to add points.</p></div>
                    )}
                </div>
                <div className="flex-shrink-0 p-2 border-t border-[var(--color-surface-light)] bg-[var(--color-background)]/50 grid grid-cols-2 gap-1.5">
                    <button onClick={onAddCurrentLocation} className="button-secondary"><PlusCircle size={14} /><span>Add My Location</span></button>
                    <button onClick={onSaveRoute} disabled={points.length === 0} className="button-primary"><Save size={14} /><span>Save Route</span></button>
                </div>
            </div>
        </div>
    );
};

export default MarkedPointsPanel;