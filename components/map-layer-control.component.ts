import { Component, Input, Output, EventEmitter } from '@angular/core';

export type MapLayer = 'Topo' | 'Street' | 'Dark' | 'Satellite';

@Component({
  selector: 'app-map-layer-control',
  templateUrl: './map-layer-control.component.html',
})
export class MapLayerControlComponent {
  @Input() currentLayer: MapLayer;
  @Output() layerChange = new EventEmitter<MapLayer>();

  isOpen = false;
  layerOptions: { id: MapLayer; name: string }[] = [
    { id: 'Topo', name: 'Topographic' },
    { id: 'Street', name: 'Street' },
    { id: 'Dark', name: 'Dark' },
    { id: 'Satellite', name: 'Satellite' },
  ];

  handleSelect(layer: MapLayer): void {
    this.layerChange.emit(layer);
    this.isOpen = false;
  }
}
