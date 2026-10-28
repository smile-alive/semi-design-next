import { type JSX, Show, splitProps } from 'solid-js';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-foundation/popover/constants';

/** An option object with React's and Vue's camelCase keys, not a Solid style object */
export interface ArrowStyle {
    borderColor?: string;
    backgroundColor?: string;
    borderOpacity?: string | number;
}

export interface ArrowProps {
    position?: string;
    class?: string;
    arrowStyle?: ArrowStyle;
    popStyle?: JSX.CSSProperties;
}

export default function Arrow(props: ArrowProps) {
    const [local, rest] = splitProps(props, ['arrowStyle', 'class', 'popStyle', 'position']);

    const isVertical = () => local.position?.startsWith('top') || local.position?.startsWith('bottom');

    const borderColor = () => local.arrowStyle?.borderColor ?? local.popStyle?.['border-color'];

    const backgroundColor = () => local.arrowStyle?.backgroundColor ?? local.popStyle?.['background-color'];

    return (
        <svg {...rest} width={24} height={8} xmlns="http://www.w3.org/2000/svg" aria-hidden="true" class={clsx(local.class, cssClasses.ARROW)}>
            <Show
                when={isVertical()}
                fallback={
                    <>
                        <path style={{ fill: borderColor(), opacity: local.arrowStyle?.borderOpacity }} d="M0.5 0L1.5 0C1.5 4, 3 5.5, 5 7.5S8,10 8,12S7 14.5, 5 16.5S1.5,20 1.5,24L0.5 24L0.5 0z" />
                        <path style={{ fill: backgroundColor() }} d="M0 0L1 0C1 4, 2 5.5, 4 7.5S7,10 7,12S6 14.5, 4 16.5S1,20 1,24L0 24L0 0z" />
                    </>
                }
            >
                <path style={{ fill: borderColor(), opacity: local.arrowStyle?.borderOpacity }} d="M0 0.5L0 1.5C4 1.5, 5.5 3, 7.5 5S10,8 12,8S14.5 7, 16.5 5S20,1.5 24,1.5L24 0.5L0 0.5z" />
                <path style={{ fill: backgroundColor() }} d="M0 0L0 1C4 1, 5.5 2, 7.5 4S10,7 12,7S14.5  6, 16.5 4S20,1 24,1L24 0L0 0z" />
            </Show>
        </svg>
    );
}
