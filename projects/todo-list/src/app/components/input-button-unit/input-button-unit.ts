import { Component, output } from '@angular/core';

@Component({
  imports: [],
  selector: 'app-input-button-unit',
  styleUrl: './input-button-unit.css',
  templateUrl: './input-button-unit.html',
})
export class InputButtonUnitComponent {
  readonly added = output<string>();
}
