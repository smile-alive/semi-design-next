import { type JSX, Show, createSignal, untrack } from 'solid-js';
import { cssClasses } from '@fibrae/semi-foundation/components/tree/constants';
import { toCssLength } from '@fibrae/semi-foundation/utils';
import { useResizeObserver } from '../../primitives/index';

export interface AutoSizerProps {
    defaultHeight?: number | string;
    defaultWidth?: number | string;
    /** Called once; `height` follows the measured size */
    children: (size: { readonly height: number; readonly width: number | string }) => JSX.Element;
}

export default function AutoSizer(props: AutoSizerProps) {
    // the starting value only: later heights come from measuring the parent
    const [height, setHeight] = createSignal(untrack(() => props.defaultHeight) || 0);
    const [wrapper, setWrapper] = createSignal<HTMLDivElement>();

    // no children before the first measurement, as in https://github.com/bvaughn/react-virtualized-auto-sizer
    const measured = () => {
        const value = height();
        return typeof value === 'number' && value !== 0 ? value : undefined;
    };

    useResizeObserver(
        () => wrapper()?.parentElement,
        () => {
            const parent = wrapper()?.parentElement;
            if (!parent) {
                return;
            }
            const style = window.getComputedStyle(parent);
            const paddings = (Number.parseInt(style.paddingTop, 10) || 0) + (Number.parseInt(style.paddingBottom, 10) || 0);
            setHeight((parent.offsetHeight || 0) - paddings);
        }
    );

    return (
        <div ref={setWrapper} class={`${cssClasses.PREFIX}-auto-wrapper`} style={{ height: toCssLength(props.defaultHeight ?? '100%'), overflow: 'visible' }}>
            <Show when={measured()}>
                {(value) =>
                    props.children({
                        get height() {
                            return value();
                        },
                        get width() {
                            return props.defaultWidth ?? '100%';
                        },
                    })
                }
            </Show>
        </div>
    );
}
