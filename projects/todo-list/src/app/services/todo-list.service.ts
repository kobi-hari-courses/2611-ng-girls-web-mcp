import { effect, Service, signal, inject } from '@angular/core';
import { StorageService } from './storage.service';
import type { TodoItem } from '../models/todo-item.model';

@Service()
export class TodoListService {
  readonly #items = signal<TodoItem[]>([]);

  readonly #storage = inject(StorageService);

  readonly items = this.#items.asReadonly();

  addItem(title: string) {
    this.#items.update((items) => [...items, { id: crypto.randomUUID(), title, completed: false }]);
  }

  toggleItem(index: number) {
    this.#items.update((items) =>
      items.map((item, i) => (i === index ? { ...item, completed: !item.completed } : item)),
    );
  }

  removeItem(index: number) {
    this.#items.update((items) => items.filter((_, i) => i !== index));
  }

  renameItem(index: number, title: string) {
    this.#items.update((items) =>
      items.map((item, i) => (i === index 
        ? { ...item, title } 
        : item)),
    );
  }

  #readFromLocalStorage() {
    const items = this.#storage.readFromLocalStorage<(Omit<TodoItem, 'id'> & { id?: string })[]>('todoItems');
    if (items) {
      this.#items.set(items.map((item) => ({ ...item, id: item.id ?? crypto.randomUUID() })));
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
