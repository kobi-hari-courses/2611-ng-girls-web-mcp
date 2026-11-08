import { effect, Service, signal, inject } from '@angular/core';
import { StorageService } from './storage.service';
import type { TodoItem } from '../models/todo-item.model';

@Service()
export class TodoListService {
  readonly #items = signal<TodoItem[]>([]);
  readonly #storage = inject(StorageService);

  readonly items = this.#items.asReadonly();

  addItem(title: string) {
    this.#items.update((items) => [...items, { title, completed: false }]);
  }

  toggleItem(index: number) {
    this.#items.update((items) =>
      items.map((item, i) => (i === index ? { ...item, completed: !item.completed } : item)),
    );
  }

  removeItem(index: number) {
    this.#items.update((items) => items.filter((_, i) => i !== index));
  }

  #readFromLocalStorage() {
    const items = this.#storage.readFromLocalStorage<TodoItem[]>('todoItems');
    if (items) {
      this.#items.set(items);
    }
  }

  #writeToLocalStorage() {
    this.#storage.writeToLocalStorage('todoItems', this.#items());
  }

  constructor() {
    this.#readFromLocalStorage();
    effect(() => {
      this.#writeToLocalStorage();
    });
  }
}
