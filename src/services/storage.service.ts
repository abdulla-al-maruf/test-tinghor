export class StorageService {
    private storage: Storage;

    constructor(storage: Storage = localStorage) {
        this.storage = storage;
    }

    getItem(key: string): any {
        const item = this.storage.getItem(key);
        return item ? JSON.parse(item) : null;
    }

    setItem(key: string, value: any): void {
        this.storage.setItem(key, JSON.stringify(value));
    }

    removeItem(key: string): void {
        this.storage.removeItem(key);
    }

    clear(): void {
        this.storage.clear();
    }

    exportAll(): Record<string, any> {
        const allItems: Record<string, any> = {};
        for (let i = 0; i < this.storage.length; i++) {
            const key = this.storage.key(i);
            if (key) {
                allItems[key] = JSON.parse(this.storage.getItem(key) || 'null');
            }
        }
        return allItems;
    }

    importData(data: Record<string, any>): void {
        for (const [key, value] of Object.entries(data)) {
            this.setItem(key, value);
        }
    }
}