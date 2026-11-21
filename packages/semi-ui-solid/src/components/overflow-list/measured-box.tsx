import { type JSX, createSignal } from 'solid-js';
import { useResizeObserver } from '../../primitives/index';

export interface MeasuredBoxProps {
    class: string;
    style?: JSX.CSSProperties | string;
    onResize: (entry: ResizeObserverEntry) => void;
    children?: JSX.Element;
}

export default function MeasuredBox(props: MeasuredBoxProps) {
    const [box, setBox] = createSignal<HTMLDivElement>();

    useResizeObserver(box, ([entry]) => props.onResize(entry));

    return (
        <div ref={setBox} class={props.class} style={props.style}>
            {props.children}
        </div>
    );
}
