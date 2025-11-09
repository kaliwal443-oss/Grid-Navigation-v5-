import React from 'react';
import { MapIcon, SatelliteDish, Compass, Camera, SunMoon } from 'lucide-react';
import { Page } from '../types';

interface BottomNavProps {
    activePage: Page;
    setActivePage: (page: Page) => void;
}

const NavItem: React.FC<{
    icon: React.ReactNode;
    label: string;
    isActive: boolean;
    onClick: () => void;
}> = ({ icon, label, isActive, onClick }) => {
    return (
        <button
            onClick={onClick}
            className={`flex flex-col items-center justify-center w-full h-full pt-1 transition-all duration-200 ease-in-out relative
                ${isActive ? 'text-[var(--color-accent)]' : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'}`}
        >
            {icon}
            <span className="text-xs mt-1 font-medium tracking-wide">{label}</span>
            <div className={`absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 rounded-t-full bg-[var(--color-accent)] transition-all duration-200 ease-in-out ${isActive ? 'w-8' : 'w-0'}`} />
        </button>
    );
};

const BottomNav: React.FC<BottomNavProps> = ({ activePage, setActivePage }) => {
    return (
        <nav className="w-full h-16 bg-[var(--color-surface)] border-t border-[var(--color-surface-light)] flex justify-around shadow-lg-top">
            <NavItem icon={<MapIcon size={24} />} label="Map" isActive={activePage === Page.Map} onClick={() => setActivePage(Page.Map)} />
            <NavItem icon={<SatelliteDish size={24} />} label="GPS" isActive={activePage === Page.GPS} onClick={() => setActivePage(Page.GPS)} />
            <NavItem icon={<Camera size={24} />} label="AR" isActive={activePage === Page.AR} onClick={() => setActivePage(Page.AR)} />
            <NavItem icon={<Compass size={24} />} label="Compass" isActive={activePage === Page.Compass} onClick={() => setActivePage(Page.Compass)} />
            <NavItem icon={<SunMoon size={24} />} label="Sun & Moon" isActive={activePage === Page.SunMoon} onClick={() => setActivePage(Page.SunMoon)} />
        </nav>
    );
};

export default BottomNav;