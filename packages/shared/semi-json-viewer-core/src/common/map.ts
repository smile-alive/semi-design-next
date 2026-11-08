/** reference from https://github.com/microsoft/vscode */
interface Item<K, V> {
    previous?: Item<K, V>;
    next?: Item<K, V>;
    key: K;
    value: V;
}

export const enum Touch {
    None = 0,
    AsOld = 1,
    AsNew = 2,
}

export class LinkedMap<K, V> {
    #map: Map<K, Item<K, V>>;
    #head: Item<K, V> | undefined;
    #tail: Item<K, V> | undefined;
    #size: number;

    constructor() {
        this.#map = new Map<K, Item<K, V>>();
        this.#head = undefined;
        this.#tail = undefined;
        this.#size = 0;
    }

    #addItemFirst(item: Item<K, V>) {
        if (!this.#head && !this.#tail) {
            this.#tail = item;
        } else if (!this.#head) {
            throw new Error('Invalid list');
        } else {
            item.next = this.#head;
            this.#head.previous = item;
        }
        this.#head = item;
    }

    #addItemLast(item: Item<K, V>) {
        if (!this.#head && !this.#tail) {
            this.#head = item;
        } else if (!this.#tail) {
            throw new Error('Invalid list');
        } else {
            item.previous = this.#tail;
            this.#tail.next = item;
        }
        this.#tail = item;
    }

    #removeItem(item: Item<K, V>) {
        if (item === this.#head && item === this.#tail) {
            this.#head = undefined;
            this.#tail = undefined;
        } else if (item === this.#head) {
            if (!item.next) {
                throw new Error('Invalid list');
            }
            item.next.previous = undefined;
            this.#head = item.next;
        } else if (item === this.#tail) {
            if (!item.previous) {
                throw new Error('Invalid list');
            }
            item.previous.next = undefined;
            this.#tail = item.previous;
        } else {
            const next = item.next;
            const previous = item.previous;
            if (!next || !previous) {
                throw new Error('Invalid list');
            }
            next.previous = previous;
            previous.next = next;
        }
        item.next = undefined;
        item.previous = undefined;
    }

    #touch(item: Item<K, V>, touch: Touch) {
        if (!this.#head || !this.#tail) {
            throw new Error('Invalid list');
        }
        if (touch !== Touch.AsOld && touch !== Touch.AsNew) {
            return;
        }

        if (touch === Touch.AsOld) {
            if (item === this.#head) {
                return;
            }

            const next = item.next;
            const previous = item.previous;

            if (item === this.#tail) {
                previous.next = undefined;
                this.#tail = previous;
            } else {
                next.previous = previous;
                previous.next = next;
            }

            item.previous = undefined;
            item.next = this.#head;
            this.#head.previous = item;
            this.#head = item;
        } else if (touch === Touch.AsNew) {
            if (item === this.#tail) {
                return;
            }

            const next = item.next;
            const previous = item.previous;

            if (item === this.#head) {
                next.previous = undefined;
                this.#head = next;
            } else {
                next.previous = previous;
                previous.next = next;
            }
            item.next = undefined;
            item.previous = this.#tail;
            this.#tail.next = item;
            this.#tail = item;
        }
    }

    protected trimOld(newSize: number) {
        if (newSize >= this.size) {
            return;
        }
        if (newSize === 0) {
            this.clear();
            return;
        }
        let current = this.#head;
        let currentSize = this.size;
        while (current && currentSize > newSize) {
            this.#map.delete(current.key);
            current = current.next;
            currentSize--;
        }
        this.#head = current;
        this.#size = currentSize;
        if (current) {
            current.previous = undefined;
        }
    }

    protected trimNew(newSize: number) {
        if (newSize >= this.size) {
            return;
        }
        if (newSize === 0) {
            this.clear();
            return;
        }
        let current = this.#tail;
        let currentSize = this.size;
        while (current && currentSize > newSize) {
            this.#map.delete(current.key);
            current = current.previous;
            currentSize--;
        }
        this.#tail = current;
        this.#size = currentSize;
        if (current) {
            current.next = undefined;
        }
    }

    clear() {
        this.#map.clear();
        this.#head = undefined;
        this.#tail = undefined;
        this.#size = 0;
    }

    isEmpty() {
        return !this.#head && !this.#tail;
    }

    get size() {
        return this.#size;
    }

    get first(): V | undefined {
        return this.#head?.value;
    }

    get last(): V | undefined {
        return this.#tail?.value;
    }

    has(key: K) {
        return this.#map.has(key);
    }

    get(key: K, touch: Touch = Touch.None): V | undefined {
        const item = this.#map.get(key);
        if (!item) {
            return undefined;
        }
        if (touch !== Touch.None) {
            this.#touch(item, touch);
        }
        return item.value;
    }

    set(key: K, value: V, touch: Touch = Touch.None) {
        let item = this.#map.get(key);
        if (item) {
            item.value = value;
            if (touch !== Touch.None) {
                this.#touch(item, touch);
            }
        } else {
            item = { key, value, next: undefined, previous: undefined };
            switch (touch) {
                case Touch.None:
                    this.#addItemLast(item);
                    break;
                case Touch.AsOld:
                    this.#addItemFirst(item);
                    break;
                case Touch.AsNew:
                    this.#addItemLast(item);
                    break;
                default:
                    this.#addItemLast(item);
                    break;
            }
            this.#map.set(key, item);
            this.#size++;
        }
        return this;
    }

    delete(key: K) {
        return !!this.remove(key);
    }

    remove(key: K): V | undefined {
        const item = this.#map.get(key);
        if (!item) {
            return undefined;
        }
        this.#map.delete(key);
        this.#removeItem(item);
        this.#size--;
        return item.value;
    }

    shift(): V | undefined {
        if (!this.#head && !this.#tail) {
            return undefined;
        }
        if (!this.#head || !this.#tail) {
            throw new Error('Invalid list');
        }
        const item = this.#head;
        this.#map.delete(item.key);
        this.#removeItem(item);
        this.#size--;
        return item.value;
    }
}

abstract class Cache<K, V> extends LinkedMap<K, V> {
    #limit: number;
    #ratio: number;

    constructor(limit: number, ratio: number = 1) {
        super();
        this.#limit = limit;
        this.#ratio = Math.min(Math.max(0, ratio), 1);
    }

    protected checkTrim() {
        if (this.size > this.#limit) {
            this.trim(Math.round(this.#limit * this.#ratio));
        }
    }

    protected abstract trim(newSize: number): void;

    get limit() {
        return this.#limit;
    }

    set limit(limit: number) {
        this.#limit = limit;
        this.checkTrim();
    }

    get ratio() {
        return this.#ratio;
    }

    set ratio(ratio: number) {
        this.#ratio = Math.min(Math.max(0, ratio), 1);
        this.checkTrim();
    }

    override get(key: K, touch: Touch = Touch.AsNew) {
        return super.get(key, touch);
    }

    peek(key: K) {
        return super.get(key, Touch.None);
    }

    override set(key: K, value: V) {
        super.set(key, value, Touch.AsNew);
        return this;
    }
}

export class LRUCache<K, V> extends Cache<K, V> {
    constructor(limit: number, ratio: number = 1) {
        super(limit, ratio);
    }

    protected override trim(newSize: number) {
        this.trimOld(newSize);
    }

    override set(key: K, value: V) {
        super.set(key, value);
        this.checkTrim();
        return this;
    }
}
