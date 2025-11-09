import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MapPageComponent } from './components/map-page.component';
import { GpsSatellitePageComponent } from './components/gps-satellite-page.component';
import { CompassPageComponent } from './components/compass-page.component';
import { ARPageComponent } from './components/ar-page.component';
import { SunMoonPageComponent } from './components/sun-moon-page.component';

const routes: Routes = [
  { path: 'map', component: MapPageComponent },
  { path: 'gps', component: GpsSatellitePageComponent },
  { path: 'ar', component: ARPageComponent },
  { path: 'compass', component: CompassPageComponent },
  { path: 'sun-moon', component: SunMoonPageComponent },
  { path: '', redirectTo: '/map', pathMatch: 'full' },
  { path: '**', redirectTo: '/map' } 
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { useHash: true })], // useHash for compatibility
  exports: [RouterModule]
})
export class AppRoutingModule { }
