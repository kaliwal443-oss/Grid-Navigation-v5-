import React from 'react';

interface SplashScreenProps {
    isFading: boolean;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ isFading }) => {
    return (
        <div className={`splash-screen ${isFading ? 'fading' : ''}`}>
            <div className="splash-content">
                <svg width="80" height="80" viewBox="0 0 24 24" className="splash-logo">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.5"/>
                    <line x1="12" y1="2" x2="12" y2="22" stroke="currentColor" strokeWidth="1" strokeDasharray="2 2" opacity="0.5"/>
                    <line x1="2" y1="12" x2="22" y2="12" stroke="currentColor" strokeWidth="1" strokeDasharray="2 2" opacity="0.5"/>
                    <polygon points="12,2 15,9 12,7 9,9" fill="currentColor"/>
                </svg>
                <h1 className="splash-title">Grid Navigation v4</h1>
                <p className="splash-subtitle">Initializing Systems...</p>
            </div>
        </div>
    );
};

export default SplashScreen;
