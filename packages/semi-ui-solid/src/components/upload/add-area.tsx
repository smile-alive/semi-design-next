import { children, createEffect, createSignal, splitProps, untrack } from 'solid-js';
import { addAreaObservedAttributes, containsControl, containsName } from '@fibrae/semi-foundation/components/upload/utils';
import type { ElementProps } from '../../base/element-props';
import useMutationObserver from '../../primitives/use-mutation-observer';
import hasContent from '../../utils/has-content';
import mergeRefs from '../../utils/merge-refs';
import { AddAreaContext, type AddAreaContextValue } from './context';

interface AddAreaProps extends ElementProps<'div', 'ref'> {
    /** Given by a caller that resolves the content under its own provider before passing it in */
    context?: AddAreaContextValue;
    /** Describes the area only while it is the button; the content's own control is out of its reach */
    describedby?: string;
    disabled?: boolean;
    /** The name an icon-only area gets; any text or labelled child wins */
    label: string;
    onOpen: () => void;
    /** Called after mount and whenever the content starts or stops bringing its own control */
    onControlChange?: (hasControl: boolean) => void;
    ref?: (element: HTMLDivElement) => void;
}

/**
 * The area that opens the file dialog. A control inside a button is invalid nesting with two Tab stops, so when the
 * content brings its own control the area is no button and the control's click bubbles up. A Semi Button or
 * IconButton marks the context while the content is created, so the first frame, on the server too, already has the
 * right role; other controls and later changes are found by observing the mounted DOM.
 */
export default function AddArea(props: AddAreaProps) {
    const [local, rest] = splitProps(props, ['context', 'describedby', 'disabled', 'label', 'onOpen', 'onControlChange', 'ref', 'tabIndex', 'children']);

    const [element, setElement] = createSignal<HTMLDivElement>();

    // read once: the flag only seeds the first frame, the observer follows later changes
    const area = untrack(() => local.context) ?? { hasControl: false };
    const content = children(() => <AddAreaContext.Provider value={area}>{local.children}</AddAreaContext.Provider>);

    const [hasControl, setHasControl] = createSignal(hasContent(content()) && area.hasControl);

    // Empty content has no name, so the first frame already carries the label; content is assumed to name the area until
    // the observer reads the rendered DOM
    const [hasName, setHasName] = createSignal(hasContent(content()));

    const handleKeyDown = (e: KeyboardEvent & { currentTarget: HTMLDivElement; target: Element }) => {
        if (!hasControl() && e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) {
            // Space would scroll the page
            e.preventDefault();
            local.onOpen();
        }
    };

    useMutationObserver(
        element,
        () => {
            const node = element();
            if (node) {
                setHasControl(containsControl(node));
                setHasName(containsName(node));
            }
        },
        { subtree: true, childList: true, characterData: true, attributeFilter: addAreaObservedAttributes }
    );

    createEffect(() => local.onControlChange?.(hasControl()));

    return (
        <div
            {...rest}
            ref={mergeRefs(local.ref, (node: HTMLDivElement) => setElement(node))}
            role={hasControl() ? undefined : 'button'}
            tabIndex={hasControl() ? undefined : (local.tabIndex ?? 0)}
            aria-describedby={hasControl() ? undefined : local.describedby}
            aria-disabled={hasControl() ? undefined : local.disabled}
            aria-label={hasControl() || hasName() ? undefined : local.label}
            onKeyDown={handleKeyDown}
            onClick={() => local.onOpen()}
        >
            {content()}
        </div>
    );
}
