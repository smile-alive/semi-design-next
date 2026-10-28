import { type JSX, createSignal } from 'solid-js';
import useResizeObserver from '../_base/use-resize-observer';

export interface MeasuredBoxProps {
    class: string;
    onResize: (entry: ResizeObserverEntry) => void;
    children?: JSX.Element;
}

// The wrapper div gives an item's width without adding up its padding, margin and border
export default function MeasuredBox(props: MeasuredBoxProps) {
    const [box, setBox] = createSignal<HTMLDivElement>();

    useResizeObserver(box, ([entry]) => props.onResize(entry));

    return (
        <div ref={setBox} class={props.class}>
            {props.children}
        </div>
    );
}
