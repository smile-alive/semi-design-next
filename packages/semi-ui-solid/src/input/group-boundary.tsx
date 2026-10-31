import { type JSX, untrack } from 'solid-js';
import { usePopupLayer } from '../_base/popup-layer';
import { type InputGroupContextValue, InputGroupContext, useInputGroupContext } from './context';

export interface InputGroupBoundaryProps {
    /** Receives the enclosing InputGroup of the same popup layer, whose size and `disabled` the control applies to itself */
    children: (inGroup: InputGroupContextValue | undefined) => JSX.Element;
}

/**
 * Wraps a control that takes its own size and `disabled` from an enclosing InputGroup. Its slots and inner controls
 * resolve in the control's body, so the whole control, not only its markup, leaves the InputGroup.
 */
export default function InputGroupBoundary(props: InputGroupBoundaryProps) {
    const group = useInputGroupContext();
    const layer = usePopupLayer();

    const inGroup = group?.layer === layer ? group : undefined;

    // untracked: the control is built once, its own reads must not rebuild it through the Provider
    return <InputGroupContext.Provider value={undefined}>{untrack(() => props.children(inGroup))}</InputGroupContext.Provider>;
}
