import React, { useState, useEffect, useRef } from 'react';
import { LatLng } from 'leaflet';
import { MarkedPoint } from '../types';
import { calculateBearing, formatDistance } from '../services/measurementService';

interface NavigationDisplayProps {
    targetPoint: MarkedPoint;
    currentPosition: LatLng;
    currentHeading: number | null;
    onStop: () => void;
}

const BEARING_TOLERANCE = 5;

const playBeep = () => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    if (!audioContext) return;

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(880, audioContext.currentTime);
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.2);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.2);
};


const NavigationDisplay: React.FC<NavigationDisplayProps> = ({ targetPoint, currentPosition, currentHeading, onStop }) => {
    const distance = currentPosition.distanceTo(targetPoint.position);
    const bearing = calculateBearing(currentPosition, targetPoint.position);
    
    const rotation = currentHeading !== null ? bearing - currentHeading : 0;
    
    const headingDifference = currentHeading !== null ? Math.abs(((bearing - currentHeading + 180) % 360) - 180) : Infinity;
    const isOnBearing = headingDifference <= BEARING_TOLERANCE;
    
    const wasOnBearingRef = useRef(isOnBearing);

    useEffect(() => {
        if (isOnBearing && !wasOnBearingRef.current) {
            playBeep();
        }
        wasOnBearingRef.current = isOnBearing;
    }, [isOnBearing]);

    return (
        <div className="navigation-panel-container">
            <div className="navigation-panel">
                {/* Left Section: Target Info */}
                <div className="target-info">
                    <p className="target-label">TARGET</p>
                    <h2 className="target-name" title={targetPoint.name}>{targetPoint.name}</h2>
                    <button onClick={onStop} className="stop-button">Stop Nav</button>
                </div>

                {/* Center Section: Arrow Dial */}
                <div className="arrow-dial">
                    <div className="arrow-container" style={{ transform: `rotate(${rotation}deg)` }}>
                        <svg width="80" height="80" viewBox="0 0 24 24" className={`arrow-svg ${isOnBearing ? 'on-bearing' : ''}`}>
                            <path d="M12 2L2.5 21.5L12 17L21.5 21.5L12 2Z" />
                        </svg>
                    </div>
                </div>

                {/* Right Section: Data Pods */}
                <div className="data-pods">
                    <div className="data-pod">
                        <p className="pod-label">DISTANCE</p>
                        <p className="pod-value">{formatDistance(distance)}</p>
                    </div>
                    <div className="data-pod">
                        <p className="pod-label">BEARING</p>
                        <p className="pod-value">{bearing.toFixed(0)}°</p>
                    </div>
                </div>
            </div>
            <style>{`
                .navigation-panel-container {
                    position: absolute;
                    bottom: 5.5rem; /* Adjusted for FAB */
                    left: 50%;
                    transform: translateX(-50%);
                    width: 95%;
                    max-width: 420px;
                    z-index: 1001;
                    pointer-events: auto;
                    animation: fade-in-up 0.3s ease-out forwards;
                }
                .navigation-panel {
                    background-color: var(--color-surface)/95;
                    backdrop-filter: blur(12px);
                    border-radius: 1rem;
                    box-shadow: 0 10px 25px -5px rgba(0,0,0,0.3), 0 8px 10px -6px rgba(0,0,0,0.2);
                    padding: 0.75rem 1rem;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 0.5rem;
                    border: 1px solid var(--color-surface-light);
                }
                .target-label, .target-name, .pod-label, .pod-value {
                    text-shadow: 0 1px 3px rgba(0, 0, 0, 0.7);
                }
                .target-info { text-align: left; flex: 1; }
                .target-label { font-size: 0.65rem; color: var(--color-text-secondary); letter-spacing: 0.1em; }
                .target-name { font-size: 1rem; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
                .stop-button {
                    margin-top: 0.25rem;
                    font-size: 0.75rem;
                    background-color: var(--color-danger)/80;
                    color: white;
                    font-weight: 700;
                    padding: 0.25rem 0.75rem;
                    border-radius: 0.375rem;
                    transition: background-color 0.2s;
                }
                .stop-button:hover { background-color: var(--color-danger); }

                .arrow-dial {
                    flex-shrink: 0;
                    width: 90px;
                    height: 90px;
                    background-image: radial-gradient(circle, var(--color-surface-light) 1px, transparent 1px);
                    background-size: 8px 8px;
                    border-radius: 50%;
                    padding: 5px;
                    background-color: var(--color-background);
                    box-shadow: inset 0 2px 4px rgba(0,0,0,0.4);
                }
                .arrow-container {
                    width: 100%; height: 100%;
                    display: flex; align-items: center; justify-content: center;
                    transition: transform 0.2s ease-out;
                    border-radius: 50%;
                }
                .arrow-svg {
                    width: 80px; height: 80px;
                    transition: color 0.3s, filter 0.3s;
                    color: var(--color-accent);
                    filter: drop-shadow(0 4px 6px rgba(0,0,0,0.4));
                }
                .arrow-svg path {
                    stroke: var(--color-surface);
                    stroke-width: 0.75px;
                    fill: currentColor;
                }
                .arrow-svg.on-bearing {
                    color: var(--color-success);
                    animation: pulse-glow 1.5s infinite ease-in-out;
                }
                
                .data-pods { flex: 1; text-align: right; space-y: 0.5rem; }
                .data-pod { padding: 0.25rem 0.5rem; border-radius: 0.375rem; background-color: var(--color-surface-light)/50; }
                .pod-label { font-size: 0.65rem; color: var(--color-text-secondary); letter-spacing: 0.1em; }
                .pod-value { font-size: 1.25rem; font-family: var(--font-mono); font-weight: 700; line-height: 1; }

                @keyframes fade-in-up {
                    from { opacity: 0; transform: translate(-50%, 20px); }
                    to { opacity: 1; transform: translate(-50%, 0); }
                }
                 @keyframes pulse-glow {
                    0% { filter: drop-shadow(0 0 2px var(--color-success)) drop-shadow(0 4px 6px rgba(0,0,0,0.4)); transform: scale(1); }
                    50% { filter: drop-shadow(0 0 10px var(--color-success)) drop-shadow(0 4px 10px rgba(0,0,0,0.4)); transform: scale(1.05); }
                    100% { filter: drop-shadow(0 0 2px var(--color-success)) drop-shadow(0 4px 6px rgba(0,0,0,0.4)); transform: scale(1); }
                }
            `}</style>
        </div>
    );
};

export default NavigationDisplay;