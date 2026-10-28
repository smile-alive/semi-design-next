import type { JSX } from 'solid-js';

export default function TriangleArrowVertical(props: { class?: string; style?: JSX.CSSProperties }) {
    return (
        <svg class={props.class} style={props.style} aria-hidden="true" fill="currentColor" height="24" width="7" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 0L1 0C1 4, 2 5.5, 4 7.5S7,10 7,12S6 14.5, 4 16.5S1,20 1,24L0 24L0 0z" />
        </svg>
    );
}
