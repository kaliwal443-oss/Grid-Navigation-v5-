import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-root',
  template: `
    <div *ngIf="isLoading" class="splash-screen" [class.fading]="isFading">
        <div class="splash-content">
            <svg width="80" height="80" viewBox="0 0 24 24" class="splash-logo">
                <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.5" fill="none" opacity="0.5"/>
                <line x1="12" y1="2" x2="12" y2="22" stroke="currentColor" stroke-width="1" stroke-dasharray="2 2" opacity="0.5"/>
                <line x1="2" y1="12" x2="22" y2="12" stroke="currentColor" stroke-width="1" stroke-dasharray="2 2" opacity="0.5"/>
                <polygon points="12,2 15,9 12,7 9,9" fill="currentColor"/>
            </svg>
            <h1 class="splash-title">Grid Navigation v4</h1>
            <p class="splash-subtitle">Initializing Systems...</p>
        </div>
    </div>
    <div *ngIf="!isLoading" class="h-full w-full flex flex-col bg-[var(--color-background)]">
        <main class="flex-grow h-0 relative">
            <router-outlet></router-outlet>
        </main>
        <app-bottom-nav></app-bottom-nav>
    </div>
  `
})
export class AppComponent implements OnInit {
  isLoading = true;
  isFading = false;

  ngOnInit(): void {
    setTimeout(() => {
        this.isFading = true;
    }, 2000);

    setTimeout(() => {
        this.isLoading = false;
    }, 2500);
  }
}
