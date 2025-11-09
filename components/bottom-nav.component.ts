import { Component } from '@angular/core';

@Component({
  selector: 'app-bottom-nav',
  template: `
    <nav class="w-full h-16 bg-[var(--color-surface)] border-t border-[var(--color-surface-light)] flex justify-around shadow-lg-top">
      <a *ngFor="let item of navItems"
        [routerLink]="item.path"
        routerLinkActive="active"
        class="flex flex-col items-center justify-center w-full h-full pt-1 transition-all duration-200 ease-in-out relative text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]">
        
        <!-- Icons embedded as SVG for simplicity -->
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <use [attr.href]="'#' + item.icon"></use>
        </svg>

        <span class="text-xs mt-1 font-medium tracking-wide">{{ item.label }}</span>
        <div class="absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 rounded-t-full bg-[var(--color-accent)] transition-all duration-200 ease-in-out indicator"></div>
      </a>
    </nav>
    
    <!-- SVG Icon Definitions -->
    <svg width="0" height="0" class="hidden">
      <defs>
        <g id="map">
            <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"></polygon>
            <line x1="8" y1="2" x2="8" y2="18"></line>
            <line x1="16" y1="6" x2="16" y2="22"></line>
        </g>
        <g id="satellite-dish">
            <path d="M6 20.33a3.5 3.5 0 0 1 7 0"></path>
            <path d="M12.5 13a2.5 2.5 0 1 0 5 0 2.5 2.5 0 0 0-5 0Z"></path>
            <path d="m22 13-1.5-1.5"></path>
            <path d="m2 13 7.5-7.5"></path>
            <path d="M11 5.5 13 3"></path>
            <path d="M15 2.5 17 4"></path>
        </g>
        <g id="camera">
            <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"></path>
            <circle cx="12" cy="13" r="3"></circle>
        </g>
        <g id="compass">
            <circle cx="12" cy="12" r="10"></circle>
            <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon>
        </g>
        <g id="sun-moon">
            <path d="M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"></path>
            <path d="M12 2v2"></path><path d="M12 20v2"></path>
            <path d="m4.93 4.93 1.41 1.41"></path>
            <path d="m17.66 17.66 1.41 1.41"></path>
            <path d="M2 12h2"></path><path d="M20 12h2"></path>
            <path d="m6.34 17.66-1.41 1.41"></path>
            <path d="m19.07 4.93-1.41 1.41"></path>
        </g>
      </defs>
    </svg>
  `,
  styles: [`
    a.active {
      color: var(--color-accent);
    }
    .indicator {
      width: 0;
    }
    a.active .indicator {
      width: 2rem; /* w-8 */
    }
  `]
})
export class BottomNavComponent {
  navItems = [
    { path: '/map', label: 'Map', icon: 'map' },
    { path: '/gps', label: 'GPS', icon: 'satellite-dish' },
    { path: '/ar', label: 'AR', icon: 'camera' },
    { path: '/compass', label: 'Compass', icon: 'compass' },
    { path: '/sun-moon', label: 'Sun & Moon', icon: 'sun-moon' },
  ];
}
