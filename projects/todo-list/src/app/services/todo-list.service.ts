import { effect, Service, signal, inject, declareExperimentalWebMcpTool } from '@angular/core';
import { isStringArray } from '../utils/schema-validator';
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
    declareExperimentalWebMcpTool({
      name: 'get_all_todos',
      description: 'Returns all the todos in the list.',
      annotations: { readOnlyHint: true },
      execute: () => JSON.stringify(this.items()),
    }).catch(console.error);

    declareExperimentalWebMcpTool({
      name: 'add_todos',
      description: 'Add one or more todos to the list.',
      inputSchema: {
        type: 'object',
        properties: {
          titles: {
            type: 'array',
            items: { type: 'string' },
            description: 'The titles of the new todos.',
          },
        },
        required: ['titles'],
        additionalProperties: false,
      },
      execute: ({ titles }) => {
        if (!isStringArray(titles) || titles.length === 0) {
          throw new Error('A non-empty list of titles is required.');
        }
        titles.forEach((title) => this.addItem(title));
        return `Added ${titles.length} todos`;
      },
    }).catch(console.error);
    

    this.#readFromLocalStorage();
    effect(() => {
      this.#writeToLocalStorage();
    });
  }
}
