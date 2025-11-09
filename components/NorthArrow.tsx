import React from 'react';
import { Compass } from 'lucide-react';
import { MapOrientationMode } from '../types';

interface NorthArrowProps {
    heading: number | null;
    orientationMode: MapOrientationMode;
    onModeChange: (mode: MapOrientationMode) => void;
    compassError: string | null;
    onRequestPermission: () => void;
}

const NorthArrow: React.FC<NorthArrowProps> = ({
    heading,
    orientationMode,
    onModeChange,
    compassError,
    onRequestPermission
}) => {

    const handleClick = () => {
        if (compassError && compassError.includes("permission")) {
            onRequestPermission();
            return;
        }
        // Cycle between North Up and Head Up. If in Free mode, snaps back to North Up.
        const newMode = orientationMode === MapOrientationMode.NorthUp 
            ? MapOrientationMode.HeadUp 
            : MapOrientationMode.NorthUp;
        onModeChange(newMode);
    };

    if (compassError && compassError.includes("permission")) {
        return (
            <button
                onClick={handleClick}
                className="p-2.5 rounded-full text-amber-400 w-12 h-12 flex items-center justify-center shadow-lg transition-colors bg-slate-700 hover:bg-slate-600 animate-pulse"
                aria-label="Enable compass"
                title="Enable compass"
            >
                <Compass className="h-5 w-5" />
            </button>
        );
    }

    const rotationStyle = {
        transform: (orientationMode === MapOrientationMode.HeadUp || heading === null) ? 'rotate(0deg)' : `rotate(${-heading}deg)`,
        transition: 'transform 0.1s ease-out',
    };

    const isActive = orientationMode === MapOrientationMode.HeadUp;
    const title = isActive
        ? `Mode: Head Up. Tap for North Up.`
        : `Mode: North Up. Tap for Head Up.`;

    return (
        <button
            onClick={handleClick}
            className={`p-2.5 rounded-full text-white w-12 h-12 flex items-center justify-center shadow-lg transition-colors ${isActive ? 'bg-amber-500 hover:bg-amber-400' : 'bg-slate-700 hover:bg-slate-600'}`}
            title={title}
        >
            <div style={rotationStyle}>
                <svg width="20" height="20" viewBox="0 0 24 24" className="mx-auto">
                    <polygon points="12,2 18,22 12,17" fill={isActive ? 'white' : 'var(--color-danger)'} />
                    <polygon points="12,2 6,22 12,17" fill={isActive ? '#ccc' : 'var(--color-text-primary)'} />
                </svg>
            </div>
        </button>
    );
};

export default NorthArrow;