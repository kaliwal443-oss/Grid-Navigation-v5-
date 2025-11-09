import React, { useState } from 'react';
import { Layers } from 'lucide-react';

export type MapLayer = 'Topo' | 'Street' | 'Dark' | 'Satellite';

interface MapLayerControlProps {
    currentLayer: MapLayer;
    onLayerChange: (layer: MapLayer) => void;
}

const layerOptions: { id: MapLayer; name: string }[] = [
    { id: 'Topo', name: 'Topographic' },
    { id: 'Street', name: 'Street' },
    { id: 'Dark', name: 'Dark' },
    { id: 'Satellite', name: 'Satellite' },
];

const MapLayerControl: React.FC<MapLayerControlProps> = ({ currentLayer, onLayerChange }) => {
    const [isOpen, setIsOpen] = useState(false);

    const handleSelect = (layer: MapLayer) => {
        onLayerChange(layer);
        setIsOpen(false);
    };

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2.5 rounded-full text-white w-12 h-12 flex items-center justify-center bg-slate-700 hover:bg-slate-600 shadow-lg transition-colors"
                aria-label="Change map layer"
                title="Change map layer"
            >
                <Layers className="h-5 w-5" />
            </button>

            {isOpen && (
                <div className="absolute bottom-full mb-2 right-0 w-40 bg-[var(--color-surface)] border border-[var(--color-surface-light)] rounded-lg shadow-lg animate-fade-in-fast">
                    <ul className="p-1">
                        {layerOptions.map((option) => (
                            <li key={option.id}>
                                <button
                                    onClick={() => handleSelect(option.id)}
                                    className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${
                                        currentLayer === option.id
                                            ? 'bg-[var(--color-accent)] text-white'
                                            : 'hover:bg-[var(--color-surface-light)] text-[var(--color-text-primary)]'
                                    }`}
                                >
                                    {option.name}
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
             <style>{`
                @keyframes fade-in-fast {
                    from { opacity: 0; transform: scale(0.95) translateY(10px); }
                    to { opacity: 1; transform: scale(1) translateY(0); }
                }
                .animate-fade-in-fast {
                    animation: fade-in-fast 0.1s ease-out forwards;
                }
            `}</style>
        </div>
    );
};

export default MapLayerControl;