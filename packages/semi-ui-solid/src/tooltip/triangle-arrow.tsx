import type { JSX } from 'solid-js';

export default function TriangleArrow(props: { class?: string; style?: JSX.CSSProperties }) {
    return (
        <svg class={props.class} style={props.style} aria-hidden="true" fill="currentColor" height="7" viewBox="0 0 24 7" width="24" xmlns="http://www.w3.org/2000/svg">
            <path d="M24 0V1C20 1 18.5 2 16.5 4C14.5 6 14 7 12 7C10 7 9.5 6 7.5 4C5.5 2 4 1 0 1V0H24Z" />
        </svg>
    );
}
