import React from 'react';
import { Ruler, Pen, Trash2 } from 'lucide-react';
import { DrawingTool } from '../types';

interface DrawingToolsProps {
    activeTool: DrawingTool;
    onToolSelect: (tool: DrawingTool) => void;
    onClear: () => void;
    drawingColor: string;
    onColorChange: (color: string) => void;
    drawingWeight: number;
    onWeightChange: (weight: number) => void;
}

const DrawingTools: React.FC<DrawingToolsProps> = ({ activeTool, onToolSelect, onClear, drawingColor, onColorChange, drawingWeight, onWeightChange }) => {
    const [isOpen, setIsOpen] = React.useState(false);

    const handleToolClick = (tool: DrawingTool) => {
        onToolSelect(activeTool === tool ? DrawingTool.None : tool);
    };
    
    const toolOptions = [
        { id: DrawingTool.Pen, name: 'Pen Tool', icon: <Pen size={18} /> },
    ];

    const colors = [
        { id: 'accent', value: '#f59e0b' }, // amber-500
        { id: 'blue', value: '#3b82f6' }, // blue-500
        { id: 'red', value: '#ef4444' }, // red-500
    ];

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`p-2.5 rounded-full text-white w-12 h-12 flex items-center justify-center shadow-lg transition-colors ${activeTool !== DrawingTool.None ? 'bg-amber-500 hover:bg-amber-400' : 'bg-slate-700 hover:bg-slate-600'}`}
                aria-label="Drawing and Measurement Tools"
                title="Drawing and Measurement Tools"
            >
                <Ruler className="h-5 w-5" />
            </button>

            {isOpen && (
                <div className="absolute bottom-full mb-2 right-0 w-48 bg-[var(--color-surface)] border border-[var(--color-surface-light)] rounded-lg shadow-lg animate-fade-in-fast">
                    <ul className="p-1">
                        {toolOptions.map((option) => (
                            <li key={option.id}>
                                <button
                                    onClick={() => handleToolClick(option.id)}
                                    className={`w-full flex items-center space-x-2 text-left px-3 py-2 text-sm rounded-md transition-colors ${
                                        activeTool === option.id
                                            ? 'bg-[var(--color-accent)] text-white'
                                            : 'hover:bg-[var(--color-surface-light)] text-[var(--color-text-primary)]'
                                    }`}
                                >
                                    {option.icon}
                                    <span>{option.name}</span>
                                </button>
                            </li>
                        ))}
                        <li><div className="h-px bg-[var(--color-surface-light)] my-1"></div></li>
                        <li className="px-3 pt-1 pb-2">
                             <div className="text-xs text-[var(--color-text-secondary)] mb-2">Color</div>
                             <div className="flex justify-around">
                                {colors.map(color => (
                                    <button
                                        key={color.id}
                                        onClick={() => onColorChange(color.value)}
                                        className={`w-6 h-6 rounded-full transition-transform transform hover:scale-110 ${drawingColor === color.value ? 'ring-2 ring-offset-2 ring-offset-[var(--color-surface)] ring-white' : ''}`}
                                        style={{ backgroundColor: color.value }}
                                        aria-label={`Set color to ${color.id}`}
                                    />
                                ))}
                            </div>
                        </li>
                        <li className="px-3 pt-1 pb-2">
                             <div className="text-xs text-[var(--color-text-secondary)] mb-1">Thickness</div>
                             <div className="flex items-center space-x-2">
                                <input
                                    type="range"
                                    min="1"
                                    max="5"
                                    step="1"
                                    value={drawingWeight}
                                    onChange={(e) => onWeightChange(parseInt(e.target.value, 10))}
                                    className="w-full h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer"
                                />
                                <span className="text-sm font-mono">{drawingWeight}px</span>
                             </div>
                        </li>
                         <li>
                             <div className="h-px bg-[var(--color-surface-light)] my-1"></div>
                            <button
                                onClick={() => { onClear(); setIsOpen(false); }}
                                className="w-full flex items-center space-x-2 text-left px-3 py-2 text-sm rounded-md transition-colors hover:bg-red-900/50 text-[var(--color-danger)]"
                            >
                                <Trash2 size={18} />
                                <span>Clear Drawings</span>
                            </button>
                        </li>
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

export default DrawingTools;