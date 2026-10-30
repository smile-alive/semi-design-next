/** reference from https://github.com/microsoft/vscode */
import { toUint8 } from './uint';

/**
 * A fast character classifier that uses a compact array for ASCII values.
 */
export class CharacterClassifier<T extends number> {
    /**
     * Maintain a compact (fully initialized ASCII map for quickly classifying ASCII characters - used more often in code).
     */
    protected readonly asciiMap: Uint8Array;
    /**
     * The entire map (sparse array).
     */
    protected readonly map: Map<number, number>;
    protected readonly defaultValue: number;

    constructor(_defaultValue: T) {
        const defaultValue = toUint8(_defaultValue);

        this.defaultValue = defaultValue;
        this.asciiMap = CharacterClassifier.#createAsciiMap(defaultValue);
        this.map = new Map<number, number>();
    }

    static #createAsciiMap(defaultValue: number): Uint8Array {
        const asciiMap = new Uint8Array(256);
        asciiMap.fill(defaultValue);
        return asciiMap;
    }

    set(charCode: number, _value: T) {
        const value = toUint8(_value);

        if (charCode >= 0 && charCode < 256) {
            this.asciiMap[charCode] = value;
        } else {
            this.map.set(charCode, value);
        }
    }

    get(charCode: number) {
        if (charCode >= 0 && charCode < 256) {
            return <T>this.asciiMap[charCode];
        } else {
            return <T>(this.map.get(charCode) || this.defaultValue);
        }
    }

    clear() {
        this.asciiMap.fill(this.defaultValue);
        this.map.clear();
    }
}

const enum BooleanEnum {
    False = 0,
    True = 1,
}

export class CharacterSet {
    readonly #actual: CharacterClassifier<BooleanEnum>;

    constructor() {
        this.#actual = new CharacterClassifier<BooleanEnum>(BooleanEnum.False);
    }

    add(charCode: number) {
        this.#actual.set(charCode, BooleanEnum.True);
    }

    has(charCode: number) {
        return this.#actual.get(charCode) === BooleanEnum.True;
    }

    clear() {
        return this.#actual.clear();
    }
}
