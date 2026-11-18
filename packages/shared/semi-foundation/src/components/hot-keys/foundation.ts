import { BaseFoundation, type DefaultAdapter } from '../../base/index';
import { keyToCode, Keys } from './constants';

export interface HotKeysAdapter<P extends HotKeysBaseProps = HotKeysBaseProps> extends DefaultAdapter<P, object> {
    notifyHotKey: (e: KeyboardEvent) => void;
}

export interface HotKeysBaseProps {
    hotKeys: KeyboardEvent['key'][];
    preventDefault?: boolean;
    getListenerTarget?: () => HTMLElement | null | undefined;
}

const sameKeys = (a: readonly string[], b: readonly string[]) => a.length === b.length && a.every((key, index) => key === b[index]);

// in the order of the modifier flags read from the event below
const modifierKeys: string[] = [Keys.Meta, Keys.Shift, Keys.Alt, Keys.Control];

/** Throws unless `hotKeys` are known keys made of exactly one common key and any number of modifiers */
export function assertHotKeys(hotKeys: readonly string[]) {
    let commonKeyCnt = 0;
    hotKeys.forEach((key) => {
        key = key.toLowerCase();
        if (!Object.values(Keys).some((value) => value === key)) {
            throw new Error(`${key} is not a valid key`);
        }
        if (!modifierKeys.includes(key)) {
            commonKeyCnt += 1;
        }
    });
    if (commonKeyCnt !== 1) {
        throw new Error('HotKeys must have one common key and 0/some modifier key');
    }
}

/** Whether `event` presses the combination: its common key by physical position, and exactly its modifiers */
export function matchHotKeys(hotKeys: readonly string[], event: KeyboardEvent) {
    const keys = hotKeys.map((key) => key.toLowerCase());
    const pressedModifiers = [event.metaKey, event.shiftKey, event.altKey, event.ctrlKey];
    if (!modifierKeys.every((modifier, index) => keys.includes(modifier) === pressedModifiers[index])) {
        return false;
    }
    return keys.every((key) => modifierKeys.includes(key) || event.code === keyToCode(key));
}

export default class HotKeysFoundation<P extends HotKeysBaseProps = HotKeysBaseProps> extends BaseFoundation<HotKeysAdapter<P>, P, object> {
    // unbinding must not re-query `getListenerTarget`, which may return another element by then
    #target: HTMLElement | null = null;
    static override readonly propKeys = ['hotKeys', 'getListenerTarget'];
    // an inline array is new on every parent render
    static override readonly propEquals = { hotKeys: sameKeys };

    #getTarget() {
        return this.getProps().getListenerTarget?.() ?? document.body;
    }

    #bind() {
        this.#target = this.#getTarget();
        this.#target.addEventListener('keydown', this.#handleKeyDown);
    }

    #unbind() {
        this.#target?.removeEventListener('keydown', this.#handleKeyDown);
        this.#target = null;
    }

    #handleKeyDown = (event: KeyboardEvent) => {
        const { hotKeys, preventDefault } = this.getProps();
        if (matchHotKeys(hotKeys, event)) {
            if (preventDefault) {
                event.preventDefault();
            }
            this.adapter.notifyHotKey(event);
        }
    };

    override init() {
        // validate before binding: a throw skips destroy and would leak the listener
        assertHotKeys(this.getProps().hotKeys);
        this.#bind();
    }

    /** Applies the same check as mounting, so an invalid combination set later fails just as loudly */
    override handlePropsChange() {
        assertHotKeys(this.getProps().hotKeys);
        this.handleTargetChange();
    }

    /** Moves the keydown listener when `getListenerTarget` now returns a different element; idle while destroyed */
    handleTargetChange = () => {
        if (this.#target && this.#getTarget() !== this.#target) {
            this.#unbind();
            this.#bind();
        }
    };

    override destroy() {
        this.#unbind();
    }
}
