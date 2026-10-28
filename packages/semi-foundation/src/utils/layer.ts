import { ESC_KEY, isComposing } from './key-code';

/**
 * An open overlay (dialog, side sheet, image preview, popup) in the order the overlays opened. One stack serves
 * every overlay, so Escape reaches the one on top and a modal overlay can tell which elements must stay usable.
 */
export interface Layer {
    /** The overlay's outermost element; stays interactive while a modal layer makes the rest of the page inert */
    element: HTMLElement;
    /**
     * Modal layers make everything outside the open layers inert, and Escape never passes them to the layers
     * below, even when they ignore it themselves.
     */
    modal: boolean;
    /** Receives Escape while this is the top layer that wants it; returns whether it handled the key */
    onEscape?: (e: KeyboardEvent) => boolean;
}

/**
 * Elements with this attribute stay interactive under a modal layer. Toast and Notification mark their containers:
 * an inert live region is not announced.
 */
export const KEEP_INTERACTIVE_ATTRIBUTE = 'data-semi-keep-interactive';
/** Marks a top-layer popover a modal layer covers; the popup styles hide it until the modal layer closes */
const COVERED_ATTRIBUTE = 'data-semi-covered';

const layers: Layer[] = [];
// the elements this module made inert, so a recompute releases only its own and leaves inert set by others alone,
// each with the popovers it marked covered
const inertElements = new Map<Element, Element[]>();

// Bubble phase: a component inside an overlay claims Escape with stopPropagation or preventDefault
function handleKeyDown(e: KeyboardEvent) {
    if (e.key !== ESC_KEY || isComposing(e) || e.defaultPrevented) {
        return;
    }
    for (let index = layers.length - 1; index >= 0; index--) {
        const layer = layers[index];
        if (layer.onEscape?.(e)) {
            e.preventDefault();
            return;
        }
        if (layer.modal) {
            return;
        }
    }
}

/**
 * The elements a modal layer leaves interactive: the top-most modal layer and every layer opened after it (a
 * Select list inside a dialog is a sibling of the dialog in body), plus the elements marked to stay interactive.
 */
function getKeptElements() {
    const topModal = layers.findLastIndex((layer) => layer.modal);
    if (topModal === -1) {
        return [];
    }
    const marked = document.querySelectorAll(`[${KEEP_INTERACTIVE_ATTRIBUTE}]`);
    const kept = [...layers.slice(topModal).map((layer) => layer.element), ...marked];
    // a popup rendered into a container inside the dialog is kept with the dialog; walking up from it would make
    // the dialog's own content inert
    return kept.filter((element) => !kept.some((other) => other !== element && other.contains(element)));
}

/**
 * Makes inert every element that neither contains nor sits inside a kept element: the siblings of each kept
 * element and of each of its ancestors up to body, which also covers an overlay in a custom popup container.
 * Content added later, outside any layer, stays interactive until the stack next changes.
 */
function updateInert() {
    const kept = getKeptElements();
    const ancestors = new Set<Element>();
    for (const element of kept) {
        for (let node = element.parentElement; node && node !== document.documentElement; node = node.parentElement) {
            ancestors.add(node);
        }
    }
    const next = new Set<Element>();
    for (const parent of ancestors) {
        for (const child of parent.children) {
            if (!ancestors.has(child) && !kept.includes(child)) {
                next.add(child);
            }
        }
    }
    for (const [element, covered] of inertElements) {
        if (!next.has(element)) {
            (element as HTMLElement).inert = false;
            for (const popover of covered) {
                popover.removeAttribute(COVERED_ATTRIBUTE);
            }
            inertElements.delete(element);
        }
    }
    for (const element of next) {
        // an element made inert by someone else stays theirs to release
        if (!inertElements.has(element) && !(element as HTMLElement).inert) {
            (element as HTMLElement).inert = true;
            // a popover stays in the top layer, above the modal layer's mask, where an inert popup would let the
            // pointer through to whatever lies under it; one inside an inert container (a portal that wraps each
            // popup in its own element) is covered too
            const covered = [...(element.matches('[popover]') ? [element] : []), ...element.querySelectorAll('[popover]')];
            for (const popover of covered) {
                popover.setAttribute(COVERED_ATTRIBUTE, '');
            }
            inertElements.set(element, covered);
        }
    }
}

/**
 * Puts `layer` on top of the stack and returns the function that removes it. Removing releases the inert it
 * caused before returning, so the caller can move focus back to an element outside the layer right after.
 */
export function openLayer(layer: Layer) {
    if (!layers.length) {
        document.addEventListener('keydown', handleKeyDown);
    }
    layers.push(layer);
    updateInert();
    return () => {
        const index = layers.indexOf(layer);
        if (index === -1) {
            return;
        }
        layers.splice(index, 1);
        updateInert();
        if (!layers.length) {
            document.removeEventListener('keydown', handleKeyDown);
        }
    };
}
