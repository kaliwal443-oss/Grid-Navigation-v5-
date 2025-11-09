import { Component, Input, Output, EventEmitter } from '@angular/core';
import { DrawingTool } from '../types';

@Component({
  selector: 'app-drawing-tools',
  templateUrl: './drawing-tools.component.html',
})
export class DrawingToolsComponent {
  @Input() activeTool: DrawingTool;
  @Input() drawingColor: string;
  @Input() drawingWeight: number;
  @Output() toolSelect = new EventEmitter<DrawingTool>();
  @Output() clear = new EventEmitter<void>();
  @Output() colorChange = new EventEmitter<string>();
  @Output() weightChange = new EventEmitter<number>();

  isOpen = false;
  
  toolOptions = [{ id: DrawingTool.Pen, name: 'Pen Tool' }];
  colors = [
    { id: 'accent', value: '#f59e0b' },
    { id: 'blue', value: '#3b82f6' },
    { id: 'red', value: '#ef4444' },
  ];
  
  readonly DrawingTool = DrawingTool;

  handleToolClick(tool: DrawingTool): void {
    this.toolSelect.emit(this.activeTool === tool ? DrawingTool.None : tool);
  }

  handleClear(): void {
    this.clear.emit();
    this.isOpen = false;
  }
}
