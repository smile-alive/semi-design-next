import BaseFoundation, { type DefaultAdapter } from '../base/foundation';
import { keyToCode, Keys } from './constants';

export interface HotKeysAdapter<P extends HotKeysBaseProps = HotKeysBaseProps, S extends object = object> extends DefaultAdapter<P, S> {
    notifyHotKey: (e: KeyboardEvent) => void;
}

/** The props the foundation reads with getProps */
export interface HotKeysBaseProps {
    hotKeys: KeyboardEvent['key'][];
    preventDefault?: boolean;
    getListenerTarget?: () => HTMLElement | null | undefined;
}

export default class HotKeysFoundation<P extends HotKeysBaseProps = HotKeysBaseProps, S extends object = object> extends BaseFoundation<HotKeysAdapter<P, S>, P, S> {
    // unbinding must not re-query `getListenerTarget`, which may return another element by then
    #target: HTMLElement | null = null;

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

    #isValidHotKeys(hotKeys: string[]) {
        let commonKeyCnt = 0;
        const modifierKeys: string[] = [Keys.Meta, Keys.Alt, Keys.Shift, Keys.Control];

        hotKeys.forEach((key) => {
            key = key.toLowerCase();
            if (!Object.values(Keys).some((value) => value === key)) {
                throw new Error(`${key} is not a valid key`);
            }
            if (!modifierKeys.includes(key)) {
                commonKeyCnt += 1;
            }
        });

        return commonKeyCnt === 1;
    }

    #handleKeyDown = (event: KeyboardEvent) => {
        const { hotKeys, preventDefault } = this.getProps();
        let allModifier = [false, false, false, false]; // Meta Shift Alt Ctrl
        let clickedModifier = [event.metaKey, event.shiftKey, event.altKey, event.ctrlKey];
        const keysPressed = hotKeys?.map((key: KeyboardEvent['key']) => {
            key = key.toLowerCase();
            if (key === Keys.Meta) {
                allModifier[0] = true;
                return event.metaKey;
            } else if (key === Keys.Shift) {
                allModifier[1] = true;
                return event.shiftKey;
            } else if (key === Keys.Alt) {
                allModifier[2] = true;
                return event.altKey;
            } else if (key === Keys.Control) {
                allModifier[3] = true;
                return event.ctrlKey;
            }
            return event.code === keyToCode(key);
        });

        if (!allModifier.every((value, index) => value === clickedModifier[index])) {
            return;
        }
        if (keysPressed.every(Boolean)) {
            if (preventDefault) {
                event.preventDefault();
            }
            this._adapter.notifyHotKey(event);
            return;
        }
    };

    #validate() {
        if (!this.#isValidHotKeys(this.getProps().hotKeys)) {
            throw new Error('HotKeys must have one common key and 0/some modifier key');
        }
    }

    override init() {
        // validate before binding: a throw skips destroy and would leak the listener
        this.#validate();
        this.#bind();
    }

    /** Applies the same check as mounting, so an invalid combination set later fails just as loudly */
    handleHotKeysChange() {
        this.#validate();
    }

    /** Moves the keydown listener when `getListenerTarget` now returns a different element */
    handleTargetChange() {
        if (this.#getTarget() !== this.#target) {
            this.#unbind();
            this.#bind();
        }
    }

    override destroy() {
        this.#unbind();
    }
}
