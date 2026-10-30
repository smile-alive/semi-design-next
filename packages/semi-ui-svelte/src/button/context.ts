import type { ButtonLooks } from '@fibrae/semi-foundation/button/utils';
import { createContext } from '../_base/create-context.js';
import { getPopupLayerContext } from '../_base/popup-layer.js';

export interface ButtonGroupContext extends Partial<ButtonLooks> {
    /** The popup layer the group renders in; buttons in a popup opened from inside the group do not inherit */
    layer?: symbol;
    add: (button: HTMLElement) => void;
    remove: (button: HTMLElement) => void;
    /** Whether another button of the group follows `button` in the document, which is when it draws the separator */
    hasNext: (button: HTMLElement) => boolean;
}

const [getEnclosingGroup, setButtonGroupContext] = createContext<ButtonGroupContext>('ButtonGroup', { optional: true });

export { setButtonGroupContext };

/** The enclosing group, unless a popup layer lies between: the group's context also reaches the popup's content */
export function getButtonGroupContext() {
    const group = getEnclosingGroup();
    return group?.layer === getPopupLayerContext() ? group : undefined;
}
