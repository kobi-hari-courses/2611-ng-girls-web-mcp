import { Service } from "@angular/core";

@Service()
export class StorageService {
    readFromLocalStorage<T>(key: string) {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) as T : null;
    }

    writeToLocalStorage<T>(key: string, value: T) {
        localStorage.setItem(key, JSON.stringify(value));
    }
}