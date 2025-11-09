import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { MapPageComponent } from './components/map-page.component';
import { GpsSatellitePageComponent } from './components/gps-satellite-page.component';
import { CompassPageComponent } from './components/compass-page.component';
import { ARPageComponent } from './components/ar-page.component';
import { SunMoonPageComponent } from './components/sun-moon-page.component';
import { BottomNavComponent } from './components/bottom-nav.component';
import { SettingsMenuComponent } from './components/settings-menu.component';
import { UtmGridComponent } from './components/utm-grid.component';
import { IndianGridComponent } from './components/indian-grid.component';
import { ScaleBarComponent } from './components/scale-bar.component';
import { NorthArrowComponent } from './components/north-arrow.component';
import { MapLayerControlComponent } from './components/map-layer-control.component';
import { MarkedPointsDisplayComponent } from './components/marked-points-display.component';
import { MarkedPointsPanelComponent } from './components/marked-points-panel.component';
import { NavigationDisplayComponent } from './components/navigation-display.component';
import { MeasurementDisplayComponent } from './components/measurement-display.component';
import { DrawingToolsComponent } from './components/drawing-tools.component';
import { OfflineMapDownloaderComponent } from './components/offline-map-downloader.component';
import { EditableImageOverlayComponent } from './components/editable-image-overlay.component';

import { GeolocationService } from './services/geolocation.service';
import { DeviceOrientationService } from './services/device-orientation.service';
import { WaypointsService } from './services/waypoints.service';
import { MapViewPersistenceService } from './services/map-view-persistence.service';
import { OfflineMapsService } from './services/offline-maps.service';
import { CoordService } from './services/coord.service';
import { MeasurementService } from './services/measurement.service';
import { AstroService } from './services/astro.service';
import { MapUtilsService } from './services/map-utils.service';

@NgModule({
  declarations: [
    AppComponent,
    MapPageComponent,
    GpsSatellitePageComponent,
    CompassPageComponent,
    ARPageComponent,
    SunMoonPageComponent,
    BottomNavComponent,
    SettingsMenuComponent,
    UtmGridComponent,
    IndianGridComponent,
    ScaleBarComponent,
    NorthArrowComponent,
    MapLayerControlComponent,
    MarkedPointsDisplayComponent,
    MarkedPointsPanelComponent,
    NavigationDisplayComponent,
    MeasurementDisplayComponent,
    DrawingToolsComponent,
    OfflineMapDownloaderComponent,
    EditableImageOverlayComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    CommonModule
  ],
  providers: [
    GeolocationService,
    DeviceOrientationService,
    WaypointsService,
    MapViewPersistenceService,
    OfflineMapsService,
    CoordService,
    MeasurementService,
    AstroService,
    MapUtilsService,
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
