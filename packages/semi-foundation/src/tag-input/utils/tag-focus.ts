import { type FocusableElement, tabbable } from 'tabbable';
import FocusTrapHandle from '../../utils/focus-handle';
import { cssClasses } from '../constants';

// Tags are rebuilt when drag handles come or go, so a focused tag is found again by its place among the tags' tab stops
// (handles and the text input excluded). Every stop is a tag's own content, so visibility is not checked.
function tagStops(wrapper: HTMLElement) {
    return tabbable(wrapper, { displayCheck: 'none' }).filter((node) => !node.closest(`.${cssClasses.PREFIX}-wrapper-input, .${cssClasses.PREFIX}-sortable-handle`));
}

/** The place of the focused element among the tags' tab stops in the TagInput's wrapper, or -1 */
export function getFocusedTagStop(wrapper: HTMLElement | null) {
    return wrapper ? tagStops(wrapper).indexOf(FocusTrapHandle.getActiveElement(wrapper) as FocusableElement) : -1;
}

export function focusTagStop(wrapper: HTMLElement | null, index: number) {
    (wrapper && tagStops(wrapper)[index])?.focus({ preventScroll: true });
}
