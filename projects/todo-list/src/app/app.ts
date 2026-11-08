import { Component, inject, signal } from '@angular/core';
import { TodoItemComponent } from './components/todo-item/todo-item';
import { InputButtonUnitComponent } from './components/input-button-unit/input-button-unit';
import { TodoListService } from './services/todo-list.service';

@Component({
  selector: 'app-root',
  imports: [InputButtonUnitComponent, TodoItemComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  readonly todoList = inject(TodoListService);
}
