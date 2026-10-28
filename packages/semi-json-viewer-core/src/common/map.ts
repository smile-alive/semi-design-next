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

    #state: number;
    readonly [Symbol.toStringTag] = 'LinkedMap';

    constructor() {
        this.#map = new Map<K, Item<K, V>>();
        this.#head = undefined;
        this.#tail = undefined;
        this.#size = 0;
        this.#state = 0;
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
        this.#state++;
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
        this.#state++;
    }

    #removeItem(item: Item<K, V>) {
        if (item === this.#head && item === this.#tail) {
            this.#head = undefined;
            this.#tail = undefined;
        } else if (item === this.#head) {
            // size === 1 is handled above
            if (!item.next) {
                throw new Error('Invalid list');
            }
            item.next.previous = undefined;
            this.#head = item.next;
        } else if (item === this.#tail) {
            // size === 1 is handled above
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
        this.#state++;
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
                // previous is defined: the item is the tail but not the head
                previous.next = undefined;
                this.#tail = previous;
            } else {
                // next and previous are defined: the item is neither head nor tail
                next.previous = previous;
                previous.next = next;
            }

            item.previous = undefined;
            item.next = this.#head;
            this.#head.previous = item;
            this.#head = item;
            this.#state++;
        } else if (touch === Touch.AsNew) {
            if (item === this.#tail) {
                return;
            }

            const next = item.next;
            const previous = item.previous;

            if (item === this.#head) {
                // next is defined: the item is the head but not the tail
                next.previous = undefined;
                this.#head = next;
            } else {
                // next and previous are defined: the item is neither head nor tail
                next.previous = previous;
                previous.next = next;
            }
            item.next = undefined;
            item.previous = this.#tail;
            this.#tail.next = item;
            this.#tail = item;
            this.#state++;
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
        this.#state++;
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
        this.#state++;
    }

    clear() {
        this.#map.clear();
        this.#head = undefined;
        this.#tail = undefined;
        this.#size = 0;
        this.#state++;
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

    forEach(callbackfn: (value: V, key: K, map: LinkedMap<K, V>) => void, thisArg?: any) {
        const state = this.#state;
        let current = this.#head;
        while (current) {
            if (thisArg) {
                callbackfn.bind(thisArg)(current.value, current.key, this);
            } else {
                callbackfn(current.value, current.key, this);
            }
            if (this.#state !== state) {
                throw new Error(`LinkedMap got modified during iteration.`);
            }
            current = current.next;
        }
    }

    keys() {
        const map = this;
        const state = this.#state;
        let current = this.#head;
        const iterator: IterableIterator<K> = {
            [Symbol.iterator]() {
                return iterator;
            },
            next(): IteratorResult<K> {
                if (map.#state !== state) {
                    throw new Error(`LinkedMap got modified during iteration.`);
                }
                if (current) {
                    const result = { value: current.key, done: false };
                    current = current.next;
                    return result;
                } else {
                    return { value: undefined, done: true };
                }
            },
        };
        return iterator;
    }

    values() {
        const map = this;
        const state = this.#state;
        let current = this.#head;
        const iterator: IterableIterator<V> = {
            [Symbol.iterator]() {
                return iterator;
            },
            next(): IteratorResult<V> {
                if (map.#state !== state) {
                    throw new Error(`LinkedMap got modified during iteration.`);
                }
                if (current) {
                    const result = { value: current.value, done: false };
                    current = current.next;
                    return result;
                } else {
                    return { value: undefined, done: true };
                }
            },
        };
        return iterator;
    }

    entries() {
        const map = this;
        const state = this.#state;
        let current = this.#head;
        const iterator: IterableIterator<[K, V]> = {
            [Symbol.iterator]() {
                return iterator;
            },
            next(): IteratorResult<[K, V]> {
                if (map.#state !== state) {
                    throw new Error(`LinkedMap got modified during iteration.`);
                }
                if (current) {
                    const result: IteratorResult<[K, V]> = {
                        value: [current.key, current.value],
                        done: false,
                    };
                    current = current.next;
                    return result;
                } else {
                    return { value: undefined, done: true };
                }
            },
        };
        return iterator;
    }

    [Symbol.iterator]() {
        return this.entries();
    }

    toJSON() {
        const data: [K, V][] = [];

        this.forEach((value, key) => {
            data.push([key, value]);
        });

        return data;
    }

    fromJSON(data: [K, V][]) {
        this.clear();

        for (const [key, value] of data) {
            this.set(key, value);
        }
    }
}

abstract class Cache<K, V> extends LinkedMap<K, V> {
    protected _limit: number;
    protected _ratio: number;

    constructor(limit: number, ratio: number = 1) {
        super();
        this._limit = limit;
        this._ratio = Math.min(Math.max(0, ratio), 1);
    }

    protected checkTrim() {
        if (this.size > this._limit) {
            this.trim(Math.round(this._limit * this._ratio));
        }
    }

    protected abstract trim(newSize: number): void;

    get limit() {
        return this._limit;
    }

    set limit(limit: number) {
        this._limit = limit;
        this.checkTrim();
    }

    get ratio() {
        return this._ratio;
    }

    set ratio(ratio: number) {
        this._ratio = Math.min(Math.max(0, ratio), 1);
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
