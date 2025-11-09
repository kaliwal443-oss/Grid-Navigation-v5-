import React, { useState, useEffect } from 'react';
import useDeviceOrientation from '../hooks/useDeviceOrientation';
import { SlidersHorizontal } from 'lucide-react';

const CalibrationPanel: React.FC<{
    offset: number;
    onOffsetChange: (offset: number) => void;
    onClose: () => void;
}> = ({ offset, onOffsetChange, onClose }) => {
    const [localOffset, setLocalOffset] = useState(offset.toFixed(1));

    useEffect(() => { setLocalOffset(offset.toFixed(1)); }, [offset]);
    
    const handleApply = () => { onOffsetChange(parseFloat(localOffset) || 0); };
    const handleQuickAdjust = (val: number) => { onOffsetChange(offset + val); };
    
    return (
        <div className="fixed inset-0 bg-black/70 z-30 flex items-center justify-center" onClick={onClose}>
            <div className="bg-[var(--color-surface)] p-4 rounded-lg shadow-2xl border border-[var(--color-surface-light)] w-11/12 max-w-sm" onClick={e => e.stopPropagation()}>
                <h3 className="text-lg font-bold text-center mb-3">Compass Calibration</h3>
                <div className="flex items-center justify-center space-x-2 mb-3">
                    <span className="text-sm text-[var(--color-text-secondary)]">Offset:</span>
                    <input type="number" step="0.1" value={localOffset} onChange={(e) => setLocalOffset(e.target.value)} onBlur={handleApply} className="w-24 bg-[var(--color-background)] text-center text-lg font-mono p-1 rounded border border-[var(--color-surface-lighter)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]" />
                    <span className="text-lg">°</span>
                </div>
                <div className="grid grid-cols-4 gap-2 text-sm mb-4">
                    <button onClick={() => handleQuickAdjust(-10)} className="p-2 rounded bg-[var(--color-surface-light)] hover:bg-[var(--color-surface-lighter)]">-10</button>
                    <button onClick={() => handleQuickAdjust(-1)} className="p-2 rounded bg-[var(--color-surface-light)] hover:bg-[var(--color-surface-lighter)]">-1</button>
                    <button onClick={() => handleQuickAdjust(1)} className="p-2 rounded bg-[var(--color-surface-light)] hover:bg-[var(--color-surface-lighter)]">+1</button>
                    <button onClick={() => handleQuickAdjust(10)} className="p-2 rounded bg-[var(--color-surface-light)] hover:bg-[var(--color-surface-lighter)]">+10</button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => onOffsetChange(0)} className="w-full bg-[var(--color-danger)]/80 hover:bg-[var(--color-danger)] text-white font-semibold py-2 px-4 rounded transition-colors">Reset</button>
                    <button onClick={onClose} className="w-full bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white font-bold py-2 px-4 rounded transition-colors">Done</button>
                </div>
            </div>
        </div>
    );
};

const CompassPage: React.FC = () => {
    const { heading, accuracy, error, requestPermission } = useDeviceOrientation();
    const [calibrationOffset, setCalibrationOffset] = useState<number>(0);
    const [isCalibrating, setIsCalibrating] = useState(false);

    useEffect(() => {
        const savedOffset = localStorage.getItem('compassCalibrationOffset');
        if (savedOffset) setCalibrationOffset(parseFloat(savedOffset));
    }, []);

    const handleSetOffset = (newOffset: number) => {
        setCalibrationOffset(newOffset);
        localStorage.setItem('compassCalibrationOffset', newOffset.toString());
    };

    const getDirection = (h: number | null) => {
        if (h === null) return '--';
        const dirs = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
        return dirs[Math.round(h / 22.5) % 16];
    };

    const displayHeading = heading !== null ? (heading + calibrationOffset + 360) % 360 : null;

    return (
        <div className="h-full w-full flex flex-col items-center justify-center bg-[var(--color-background)] p-4 text-white overflow-hidden">
            <h1 className="text-xl font-bold text-center text-[var(--color-accent-hover)] mb-4 flex-shrink-0">Compass</h1>
            <div className="relative w-72 h-72 sm:w-80 sm:h-80 flex items-center justify-center flex-shrink-0">
                <svg className="absolute w-full h-full" viewBox="0 0 200 200">
                    <defs>
                        <radialGradient id="bezelGradient" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
                            <stop offset="85%" stopColor="var(--color-surface)" />
                            <stop offset="100%" stopColor="var(--color-surface-lighter)" />
                        </radialGradient>
                        <filter id="innerShadow"><feGaussianBlur in="SourceAlpha" stdDeviation="2" result="blur" /><feOffset in="blur" dx="0" dy="0" result="offsetBlur" /><feFlood floodColor="#000" floodOpacity="0.5" result="flood" /><feComposite in="flood" in2="offsetBlur" operator="in" result="shadow" /><feComposite in="SourceGraphic" in2="shadow" operator="over" /></filter>
                    </defs>
                    <circle cx="100" cy="100" r="100" fill="url(#bezelGradient)" />
                    <circle cx="100" cy="100" r="96" fill="transparent" stroke="var(--color-background)" strokeWidth="1" filter="url(#innerShadow)"/>
                </svg>
                <div className="absolute w-[96%] h-[96%] transition-transform duration-100 ease-linear" style={{ transform: `rotate(${-displayHeading}deg)` }}>
                    <svg viewBox="0 0 200 200" className="w-full h-full">
                        <circle cx="100" cy="100" r="96" fill="var(--color-surface)" />
                        {Array.from({ length: 72 }).map((_, i) => {
                            const angle = i * 5; const isMajor = angle % 15 === 0; const isCardinal = angle % 90 === 0;
                            return <line key={`deg-${angle}`} x1="100" y1="8" x2="100" y2={isCardinal ? "22" : isMajor ? "16" : "12"} stroke="var(--color-text-secondary)" strokeWidth={isMajor ? "1" : "0.5"} transform={`rotate(${angle} 100 100)`} />;
                        })}
                        {['N', 'E', 'S', 'W'].map((dir, i) => <text key={dir} x="100" y="32" textAnchor="middle" fill={dir === 'N' ? 'var(--color-danger)' : 'var(--color-text-primary)'} fontSize="16" fontWeight="bold" transform={`rotate(${i * 90} 100 100)`}>{dir}</text>)}
                        {['NE', 'SE', 'SW', 'NW'].map((dir, i) => <text key={dir} x="100" y="32" textAnchor="middle" fill="var(--color-text-secondary)" fontSize="12" transform={`rotate(${45 + i * 90} 100 100)`}>{dir}</text>)}
                    </svg>
                </div>
                <div className="compass-needle" />
                <div className="absolute w-2.5 h-2.5 bg-gray-500 rounded-full border-2 border-gray-400 z-10"></div>
            </div>
            <div className="text-center my-4 p-4 bg-[var(--color-surface)] rounded-lg w-52 border border-[var(--color-surface-light)] flex-shrink-0">
                <div className="text-5xl font-mono">{displayHeading !== null ? displayHeading.toFixed(0) : '---'}<span className="text-3xl align-top">°</span></div>
                <div className="text-xl text-[var(--color-accent-hover)] font-semibold">{getDirection(displayHeading)}</div>
                {accuracy !== null && <div className="text-xs text-[var(--color-text-secondary)] font-mono">±{accuracy.toFixed(0)}°</div>}
            </div>
            <button onClick={() => setIsCalibrating(true)} className="absolute top-4 right-4 p-2 rounded-full bg-[var(--color-surface)] hover:bg-[var(--color-surface-light)] transition-colors" title="Calibrate Compass"><SlidersHorizontal size={20} /></button>
            {isCalibrating && <CalibrationPanel offset={calibrationOffset} onOffsetChange={handleSetOffset} onClose={() => setIsCalibrating(false)} />}
            {error && (
                <div className="mt-4 text-center">
                    <p className="text-red-400">{error}</p>
                    {error.includes("permission") && <button onClick={requestPermission} className="mt-2 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white font-bold py-2 px-4 rounded">Grant Permission</button>}
                </div>
            )}
        </div>
    );
};

export default CompassPage;