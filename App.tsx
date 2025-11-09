import React, { useState, useEffect } from 'react';
import MapPage from './components/MapPage';
import GpsSatellitePage from './components/GpsSatellitePage';
import ARPage from './components/ARPage';
import CompassPage from './components/CompassPage';
import SunMoonPage from './components/SunMoonPage';
import BottomNav from './components/BottomNav';
import { Page } from './types';
import SplashScreen from './components/SplashScreen';

export type ProjectionRequest = { bearing: number; distance: number } | 'clear' | null;

const App: React.FC = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [isFading, setIsFading] = useState(false);
    const [activePage, setActivePage] = useState<Page>(Page.Map);
    const [projectionRequest, setProjectionRequest] = useState<ProjectionRequest>(null);

    useEffect(() => {
        const fadeTimer = setTimeout(() => {
            setIsFading(true);
        }, 2000);

        const loadTimer = setTimeout(() => {
            setIsLoading(false);
        }, 2500); // 2000ms visible + 500ms fade out

        return () => {
            clearTimeout(fadeTimer);
            clearTimeout(loadTimer);
        };
    }, []);

    const renderPage = () => {
        switch (activePage) {
            case Page.Map:
                return <MapPage 
                    projectionRequest={projectionRequest} 
                    setProjectionRequest={setProjectionRequest}
                    isVisible={activePage === Page.Map}
                />;
            case Page.GPS:
                return <GpsSatellitePage />;
            case Page.AR:
                return <ARPage isVisible={activePage === Page.AR} />;
            case Page.Compass:
                return <CompassPage />;
            case Page.SunMoon:
                return <SunMoonPage />;
            default:
                return null;
        }
    };

    if (isLoading) {
        return <SplashScreen isFading={isFading} />;
    }

    return (
        <div className="h-full w-full flex flex-col bg-[var(--color-background)]">
            <main className="flex-grow h-0 relative">
               <div className="page h-full w-full">
                    {renderPage()}
                </div>
            </main>
            <BottomNav activePage={activePage} setActivePage={setActivePage} />
        </div>
    );
};

export default App;