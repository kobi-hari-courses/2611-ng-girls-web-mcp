import { Component, input, output, signal } from '@angular/core';
import type { TodoItem } from '../../models/todo-item.model';

@Component({
  imports: [],
  selector: 'app-todo-item',
  styleUrl: './todo-item.css',
  templateUrl: './todo-item.html',
})
export class TodoItemComponent {
  readonly item = input.required<TodoItem>();
  readonly editMode = signal(false);

  readonly renamed = output<string>();
  readonly deleted = output<void>();
  readonly toggled = output<void>();

  startEditMode() {
    this.editMode.set(true);
  }

  commit(newTitle: string) {
    this.editMode.set(false);
    this.renamed.emit(newTitle);
  }

  cancel() {
    this.editMode.set(false);
  }
}
